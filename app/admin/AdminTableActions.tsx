"use client";
/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/admin/AdminTableActions.tsx
 * PROPÓSITO: Componente que renderiza los botones de acción en la tabla 
 *            del Historial (Abonar, Editar Fechas, Consumos, Eliminar)
 *            y maneja todas sus ventanas emergentes (modales).
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "../useDialog";
import { CheckCircle, X, DollarSign, Edit3, Calendar, ShoppingCart, Trash2, MessageCircle, Printer, FileWarning } from "lucide-react";
import { adminRegisterPayment, adminUpdateBookingDates, addBookingExtra, deleteBookingExtra, fetchRucData, fetchDniData, cancelBooking } from "@/app/actions";
import ThermalTicket from "./ThermalTicket";
import Link from "next/link";
import { type Comprobante, NOMBRE_COMPROBANTE, numeroComprobante } from "@/lib/cpe";
import { codigoReserva, formaDePago } from "@/lib/reserva";
import Swal from "sweetalert2";
import { BRAND_COLORS } from "@/lib/brand-colors";

interface AdminTableActionsProps {
  bookingId: number;
  status: string;
  totalPrice: number;
  amountPaid: number;
  isCancelled: boolean;
  checkIn: string;
  checkOut: string;
  extras?: any[];
  guestName: string;
  roomName: string;
  roomType?: string;
  guestPhone?: string;
  guestDocument?: string;
  paymentMethod?: string;
  onDelete: (formData: FormData) => void;
  products?: any[];
  userRole?: string | null;
  // Boletas, facturas o notas de SUNAT registradas (XML) para esta reserva
  comprobantes?: Comprobante[];
}

export function AdminTableActions({
  bookingId,
  status,
  totalPrice,
  amountPaid,
  isCancelled,
  checkIn,
  checkOut,
  extras = [],
  guestName,
  roomName,
  roomType,
  guestPhone,
  guestDocument,
  paymentMethod,
  onDelete,
  products = [],
  userRole,
  comprobantes = [],
}: AdminTableActionsProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [extraQty, setExtraQty] = useState("1");
  const [extraProductId, setExtraProductId] = useState<string>("");
  const [editCheckOut, setEditCheckOut] = useState<string>(checkOut);
  const [editTotalPrice, setEditTotalPrice] = useState<string>(totalPrice.toString());
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Facturación States
  const [isPrinting, setIsPrinting] = useState(false);
  // null = ticket interno; con un comprobante = representación impresa del XML de SUNAT
  const [ticketComprobante, setTicketComprobante] = useState<Comprobante | null>(null);
  const [billingDocument, setBillingDocument] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [includeRoomType, setIncludeRoomType] = useState(false);
  const [isFetchingRuc, setIsFetchingRuc] = useState(false);
  const [billingPaymentMethod, setBillingPaymentMethod] = useState("Efectivo");
  const [billingAmountPaid, setBillingAmountPaid] = useState("0");
  const paymentDialogRef = useDialog(isPaymentModalOpen, () => setIsPaymentModalOpen(false), !loading);
  const editDialogRef = useDialog(isEditModalOpen, () => setIsEditModalOpen(false), !loading);
  const extrasDialogRef = useDialog(isExtrasModalOpen, () => setIsExtrasModalOpen(false), !loading);
  const billingDialogRef = useDialog(isBillingModalOpen, () => setIsBillingModalOpen(false));

  const handleFetchDocument = async () => {
    const esRuc = billingDocument.length === 11;
    if (!esRuc && billingDocument.length !== 8) {
      alert("Ingresa un DNI de 8 dígitos o un RUC de 11");
      return;
    }

    setIsFetchingRuc(true);
    try {
      const result = esRuc
        ? await fetchRucData(billingDocument)
        : await fetchDniData(billingDocument);

      if (esRuc && result.data && result.data.nombre) {
        setBillingName(result.data.nombre);
        if (result.data.direccion) {
          const fullAddress = [
            result.data.direccion,
            result.data.distrito,
            result.data.provincia,
            result.data.departamento
          ].filter(Boolean).join(" - ");
          setBillingAddress(fullAddress);
        } else {
          setBillingAddress("");
        }
      } else if (!esRuc && result.data) {
        // Algunas APIs devuelven "nombre", otras devuelven "nombres", "apellidoPaterno", etc.
        if (result.data.nombre) {
          setBillingName(result.data.nombre);
        } else if (result.data.nombres) {
          setBillingName(`${result.data.nombres} ${result.data.apellidoPaterno || ""} ${result.data.apellidoMaterno || ""}`.trim());
        } else {
          alert("DNI no encontrado o inválido.");
        }
        setBillingAddress(""); // Usualmente DNI no devuelve dirección
      } else {
        alert(result.error || `${esRuc ? "RUC" : "DNI"} no encontrado o inválido.`);
      }
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor. Inténtalo de nuevo.");
    }
    setIsFetchingRuc(false);
  };
  
  const extrasTotal = extras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
  const grandTotal = totalPrice + extrasTotal;

  const effectiveAmountPaid = (amountPaid !== null && amountPaid !== undefined)
    ? amountPaid
    : ((status === "pagado" || status === "approved") ? totalPrice : 0);

  const balance = grandTotal - effectiveAmountPaid;
  const isFullyPaid = balance <= 0;

  useEffect(() => {
    if (isPrinting) {
      // Retardo de 800ms para asegurar que el QR y logo carguen antes de imprimir
      setTimeout(() => {
        window.print();
        setTimeout(() => setIsPrinting(false), 500);
      }, 800);
    }
  }, [isPrinting]);

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0 || amount > balance) {
      alert("Ingrese un monto válido (mayor a 0 y menor o igual al saldo).");
      return;
    }
    
    setLoading(true);
    const result = await adminRegisterPayment(bookingId, amount);
    if (result.error) {
      alert(result.error);
    } else {
      setIsPaymentModalOpen(false);
      setPaymentAmount("");
    }
    setLoading(false);
  };

  const handleEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCheckOut) return;
    
    // Validar que checkout sea después de checkin
    if (new Date(editCheckOut) <= new Date(checkIn)) {
      alert("La fecha de salida debe ser posterior a la fecha de entrada.");
      return;
    }

    setLoading(true);
    const newTotal = Number(editTotalPrice);
    const result = await adminUpdateBookingDates(bookingId, editCheckOut, newTotal);
    
    if (result.error) {
      alert(result.error);
    } else {
      setIsEditModalOpen(false);
    }
    setLoading(false);
  };

  const handleAddExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validar stock si se seleccionó un producto
    if (extraProductId) {
      const selectedProduct = products.find(p => p.id.toString() === extraProductId);
      if (selectedProduct && selectedProduct.stock < Number(extraQty)) {
        alert(`No hay stock suficiente. Stock actual: ${selectedProduct.stock}`);
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append("bookingId", bookingId.toString());
    formData.append("itemName", extraName.toUpperCase());
    formData.append("price", extraPrice);
    formData.append("quantity", extraQty);
    if (extraProductId) {
      formData.append("productId", extraProductId);
    }
    
    const result = await addBookingExtra(formData);
    if (result.error) alert(result.error);
    else {
      setExtraName("");
      setExtraPrice("");
      setExtraQty("1");
      setExtraProductId("");
    }
    setLoading(false);
  };

  const handleDeleteExtra = async (extraId: number) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("extraId", extraId.toString());
    const result = await deleteBookingExtra(formData);
    if (result.error) alert(result.error);
    setLoading(false);
  };

  const handleCancelBooking = async () => {
    const result = await Swal.fire({
      title: "¿Anular reserva?",
      text: "Se generará una Nota de Crédito y la habitación quedará libre. Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: BRAND_COLORS.rose, // Kametza red
      cancelButtonColor: BRAND_COLORS.stoneSoft,
      confirmButtonText: "Sí, anular reserva",
      cancelButtonText: "No, mantener"
    });

    if (result.isConfirmed) {
      setLoading(true);
      const cancelResult = await cancelBooking(bookingId);
      if (cancelResult.error) {
        Swal.fire("Error", cancelResult.error, "error");
      } else {
        Swal.fire("Anulada", "La reserva fue anulada y se liberó la habitación.", "success");
      }
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    let msg = `*🏨 Hotel Kametza - Comprobante de Reserva*\n\n`;
    msg += `*Huésped:* ${guestName}\n`;
    msg += `*Habitación:* #${roomName}\n`;
    msg += `*Ingreso:* ${checkIn}\n`;
    msg += `*Salida:* ${checkOut}\n\n`;
    msg += `*Total Reserva:* S/ ${totalPrice.toFixed(2)}\n`;
    
    if (extrasTotal > 0) {
      msg += `*Extras:* S/ ${extrasTotal.toFixed(2)}\n`;
      msg += `*Total Acumulado:* S/ ${grandTotal.toFixed(2)}\n`;
    }
    msg += `*Abonado:* S/ ${(amountPaid || 0).toFixed(2)}\n`;
    
    if (balance > 0) {
      msg += `*Saldo Pendiente:* S/ ${balance.toFixed(2)}\n`;
    } else {
      msg += `*Estado:* PAGADO TOTALMENTE ✅\n`;
    }
    
    msg += `\n¡Gracias por su preferencia!`;
    
    // Si hay un teléfono, limpiamos espacios y caracteres raros. Si no, abrimos WhatsApp sin número para elegir contacto.
    const phone = guestPhone ? guestPhone.replace(/\D/g, '') : '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const mockBookingForTicket = {
    check_in: checkIn,
    check_out: checkOut,
    total_price: grandTotal, // Incluye extras
    base_price: totalPrice, // Precio solo del alojamiento
    extras: extras, // Array de consumos adicionales
    customer_name: billingName || guestName,
    customer_document: billingDocument || "No Registrado",
    customer_address: billingAddress || undefined,
    room_id: roomName,
    room_type: includeRoomType ? roomType : undefined,
    payment_method: billingPaymentMethod,
    amount_paid: Number(billingAmountPaid) || 0,
  };

  const handleOpenBilling = () => {
    // Valores por defecto al abrir (todos editables antes de imprimir)
    setBillingDocument(guestDocument || "");
    setBillingName(guestName);
    setBillingPaymentMethod(formaDePago(paymentMethod));
    setBillingAmountPaid((isFullyPaid ? grandTotal : effectiveAmountPaid).toFixed(2));
    setIsBillingModalOpen(true);
  };

  return (
    <>
      {mounted && isPrinting && createPortal(
        <ThermalTicket
          booking={mockBookingForTicket}
          bookingId={bookingId}
          isCancelled={isCancelled}
          comprobante={ticketComprobante}
        />,
        document.body
      )}
      
      <div className="flex items-center gap-2 justify-center flex-wrap">
        {/* === GRUPO DE ACCIONES SEGURAS === */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm">
          <button
            onClick={handleOpenBilling}
            className={`group relative flex items-center justify-center w-11 h-11 md:w-8 md:h-8 rounded-xl transition-all hover:-translate-y-0.5 ${
              isCancelled 
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700" 
                : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200"
            }`}
            title="Imprimir comprobante"
            aria-label="Imprimir comprobante"
          >
            <Printer size={14} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        {!isCancelled && (
          <button
            onClick={handleShareWhatsApp}
            className="group relative flex items-center justify-center w-11 h-11 md:w-8 md:h-8 bg-green-50 text-green-600 rounded-xl hover:text-green-700 hover:bg-green-100 transition-all hover:-translate-y-0.5"
            title="Compartir Comprobante por WhatsApp"
            aria-label="Compartir Comprobante por WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="group-hover:scale-110 transition-transform duration-300">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
          </button>
        )}
        {!isCancelled && (
          <button
            onClick={() => setIsExtrasModalOpen(true)}
            className="group relative flex items-center justify-center w-11 h-11 md:w-8 md:h-8 bg-purple-50 text-purple-600 rounded-xl hover:text-purple-700 hover:bg-purple-100 transition-all hover:-translate-y-0.5"
            title="Añadir Consumos / Extras"
          >
            <ShoppingCart size={14} className="group-hover:scale-110 transition-transform duration-300" />
            {extras.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {extras.length}
              </span>
            )}
          </button>
        )}
        {!isCancelled && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="group relative flex items-center justify-center w-11 h-11 md:w-8 md:h-8 bg-blue-50 text-blue-600 rounded-xl hover:text-blue-700 hover:bg-blue-100 transition-all hover:-translate-y-0.5"
            title="Editar Reserva"
          >
            <Edit3 size={14} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        )}
        {!isFullyPaid && !isCancelled && (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="group relative flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-[0_2px_10px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
            title="Registrar Pago"
          >
            <CheckCircle size={14} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-wider">Abonar</span>
          </button>
        )}
        </div>

        {/* === GRUPO DE ACCIONES DE PELIGRO === */}
        <div className="flex items-center gap-1.5 bg-rose-50/50 p-1.5 rounded-2xl border border-rose-100 shadow-sm">
        {!isCancelled && (
          <button
            onClick={handleCancelBooking}
            className="group relative flex items-center justify-center w-11 h-11 md:w-8 md:h-8 bg-orange-100 text-orange-600 rounded-xl hover:text-orange-700 hover:bg-orange-200 transition-all hover:-translate-y-0.5"
            title="Anular y Emitir Nota de Crédito"
            aria-label="Anular y Emitir Nota de Crédito"
          >
            <FileWarning size={14} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        )}
        {(userRole === "admin" || userRole === "dueño") && (
          <button
            type="button"
            onClick={async () => {
              const result = await Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta acción eliminará la reserva permanentemente.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar"
              });
              if (result.isConfirmed) {
                const formData = new FormData();
                formData.append("bookingId", bookingId.toString());
                onDelete(formData);
              }
            }}
            className="group relative flex items-center justify-center w-11 h-11 md:w-8 md:h-8 bg-red-100 text-red-600 rounded-xl hover:text-red-700 hover:bg-red-200 transition-all hover:-translate-y-0.5"
            title="Eliminar Reserva"
          >
            <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}
        </div>
      </div>

      {/* Modal de Pago */}
      {mounted && isPaymentModalOpen && createPortal(
        <div ref={paymentDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Registrar pago" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm outline-none">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Registrar Pago</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva {codigoReserva(bookingId)}</p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 mb-6 border border-stone-100">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-stone-500 font-medium">Costo Habitación:</span>
                <span className="font-bold text-stone-900">S/ {totalPrice.toFixed(2)}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-stone-500 font-medium">Consumos Extras:</span>
                  <span className="font-bold text-purple-600">+ S/ {extrasTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs mb-2 pt-2 border-t border-stone-200">
                <span className="text-stone-500 font-medium">Total Acumulado:</span>
                <span className="font-bold text-stone-900">S/ {grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-stone-500 font-medium">Pagado hasta ahora:</span>
                <span className="font-bold text-emerald-700">- S/ {(amountPaid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                <span className="text-stone-900 font-bold">Saldo Pendiente:</span>
                <span className="font-black text-rose-600">S/ {balance.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleRegisterPayment}>
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2">
                  Monto a Pagar (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold">S/</span>
                  <input aria-label="Monto a pagar (S/)"
                    type="number"
                    step="0.01"
                    min="0.1"
                    max={balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={balance.toFixed(2)}
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(balance.toString())}
                    className="text-[10px] text-emerald-700 font-bold hover:underline"
                  >
                    Saldar deuda completa
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-800 transition shadow-lg shadow-stone-900/20 disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Confirmar Pago"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Editar Reserva */}
      {mounted && isEditModalOpen && createPortal(
        <div ref={editDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Editar reserva" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm outline-none">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Editar Reserva</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva {codigoReserva(bookingId)}</p>
              </div>
            </div>

            <form onSubmit={handleEditBooking}>
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2">
                  Fecha de Entrada (Fija)
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input aria-label="Fecha de entrada"
                    type="date"
                    value={checkIn}
                    disabled
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2">
                  Nueva Fecha de Salida
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input aria-label="Nueva fecha de salida"
                    type="date"
                    min={checkIn}
                    value={editCheckOut}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditCheckOut(newDate);
                      
                      // Auto-calcular nuevo precio (mantiene tarifa original o descuento proporcional)
                      if (newDate && newDate >= checkIn) {
                        const calcNights = (d1: string, d2: string) => {
                          const start = new Date(d1);
                          const end = new Date(d2);
                          const diffTime = Math.abs(end.getTime() - start.getTime());
                          return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                        };
                        const originalNights = calcNights(checkIn, checkOut);
                        const pricePerNight = totalPrice / originalNights;
                        const newNights = calcNights(checkIn, newDate);
                        setEditTotalPrice((pricePerNight * newNights).toFixed(2));
                      }
                    }}
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2">
                  Nuevo Precio Total (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold">S/</span>
                  <input aria-label="Nuevo precio total (S/)"
                    type="number"
                    step="0.01"
                    min={amountPaid || 0}
                    value={editTotalPrice}
                    onChange={(e) => setEditTotalPrice(e.target.value)}
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-stone-500 font-medium mt-1.5 ml-1">
                  Monto ya pagado: S/ {(amountPaid || 0).toFixed(2)}. No puedes cobrar menos que esto.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Consumos Extras */}
      {mounted && isExtrasModalOpen && createPortal(
        <div ref={extrasDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Consumos extras" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm outline-none">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsExtrasModalOpen(false)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Consumos Extras</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva {codigoReserva(bookingId)}</p>
              </div>
            </div>

            {/* Formulario para añadir */}
            <form onSubmit={handleAddExtra} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-6">
              <h4 className="text-[10px] font-black uppercase text-stone-500 mb-3">Añadir Nuevo Consumo</h4>
              <div className="space-y-3">
                <select aria-label="Producto o consumo"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm font-bold bg-white"
                  value={extraProductId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExtraProductId(val);
                    if (val) {
                      const prod = products.find(p => p.id.toString() === val);
                      if (prod) {
                        setExtraName(prod.name);
                        setExtraPrice(prod.price.toString());
                      }
                    } else {
                      setExtraName("");
                      setExtraPrice("");
                    }
                  }}
                >
                  <option value="">-- Consumo Personalizado --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} - S/ {p.price.toFixed(2)} (Stock: {p.stock})
                    </option>
                  ))}
                </select>

                {!extraProductId && (
                  <input aria-label="Nombre del consumo"
                    type="text"
                    placeholder="Ej: Lavandería (Escribe manualmente)"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    required
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm font-bold placeholder-stone-300"
                  />
                )}
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">S/</span>
                    <input aria-label="Precio (S/)"
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="Precio"
                      value={extraPrice}
                      onChange={(e) => setExtraPrice(e.target.value)}
                      required
                      className="w-full border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-sm font-bold"
                    />
                  </div>
                  <div className="relative w-24">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">Cant:</span>
                    <input aria-label="Cantidad"
                      type="number"
                      min="1"
                      value={extraQty}
                      onChange={(e) => setExtraQty(e.target.value)}
                      required
                      className="w-full border border-stone-200 rounded-lg pl-12 pr-2 py-2 text-sm font-bold"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] hover:bg-purple-700 transition"
                >
                  {loading ? "Añadiendo..." : "Añadir a la cuenta"}
                </button>
              </div>
            </form>

            {/* Lista de consumos */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <h4 className="text-[10px] font-black uppercase text-stone-500">Detalle de Consumos</h4>
                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded">Total: S/ {extrasTotal.toFixed(2)}</span>
              </div>
              
              {extras.length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-xs italic">
                  No hay consumos registrados aún.
                </div>
              ) : (
                <ul className="space-y-2">
                  {extras.map((extra) => (
                    <li key={extra.id} className="flex justify-between items-center p-3 border border-stone-100 rounded-xl bg-white shadow-sm">
                      <div>
                        <p className="text-xs font-bold text-stone-800">{extra.item_name}</p>
                        <p className="text-[10px] text-stone-500 font-medium">
                          S/ {extra.price.toFixed(2)} x {extra.quantity} und.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-stone-900 text-xs">S/ {(extra.price * extra.quantity).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExtra(extra.id)}
                          disabled={loading}
                          className="text-stone-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Facturación / Boleta */}
      {mounted && isBillingModalOpen && createPortal(
        <div ref={billingDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Imprimir comprobante" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm outline-none">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setIsBillingModalOpen(false)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
                <Printer size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Imprimir comprobante</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva {codigoReserva(bookingId)}</p>
              </div>
            </div>

            <div className="overflow-y-auto pr-1 -mr-1 flex-1">
              {/* Boletas / facturas oficiales: se emiten en SUNAT y se registran subiendo su XML */}
              <div className="bg-stone-50 p-3 rounded-2xl mb-3">
                <h3 className="text-[10px] font-black uppercase text-stone-500 mb-2 tracking-wider">
                  Boleta o factura de SUNAT
                </h3>
                {comprobantes.length > 0 ? (
                  <ul className="space-y-2">
                    {comprobantes.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 bg-white rounded-xl border border-stone-200 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900">{numeroComprobante(c)}</p>
                          <p className="text-[10px] text-stone-500 uppercase truncate">
                            {NOMBRE_COMPROBANTE[c.tipo]} · S/ {Number(c.total).toFixed(2)}
                          </p>
                          {Math.abs(Number(c.total) - grandTotal) >= 0.01 && (
                            <p className="text-[10px] font-bold text-amber-700 leading-snug mt-0.5">
                              No coincide con el total de la reserva (S/ {grandTotal.toFixed(2)})
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setTicketComprobante(c);
                            setIsBillingModalOpen(false);
                            setIsPrinting(true);
                          }}
                          className="shrink-0 min-h-11 px-3 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800"
                        >
                          Imprimir
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone-600 leading-snug">
                    Esta reserva aún no tiene boleta ni factura. Emítela en SUNAT y sube el XML en{" "}
                    <Link href="/admin?tab=comprobantes" className="font-bold text-amber-700 underline underline-offset-2">
                      Comprobantes SUNAT
                    </Link>
                    .
                  </p>
                )}
              </div>

            <h3 className="text-[10px] font-black uppercase text-stone-500 mb-2 tracking-wider">
              Ticket interno (no es boleta ni factura)
            </h3>
            <div className="space-y-3 mb-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  DNI o RUC del cliente
                </label>
                <div className="flex gap-2">
                  <input aria-label="DNI o RUC del cliente"
                    type="text"
                    inputMode="numeric"
                    value={billingDocument}
                    onChange={(e) => setBillingDocument(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                    placeholder="DNI (8) o RUC (11)"
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold"
                  />
                  <button
                    onClick={handleFetchDocument}
                    disabled={isFetchingRuc || (billingDocument.length !== 8 && billingDocument.length !== 11)}
                    className="px-3 bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {isFetchingRuc ? "..." : "Buscar"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  Nombre o razón social
                </label>
                <input aria-label="Nombre o razón social"
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value.toUpperCase())}
                  placeholder="Nombres completos"
                  className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                  Dirección (Opcional)
                </label>
                <input aria-label="Dirección (opcional)"
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value.toUpperCase())}
                  placeholder="Ej. Av. Principal 123"
                  className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                    Forma de Pago
                  </label>
                  <select aria-label="Forma de pago"
                    value={billingPaymentMethod}
                    onChange={(e) => setBillingPaymentMethod(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold bg-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape / Plin">Yape / Plin</option>
                    <option value="Tarjeta / Online">Tarjeta / Online</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                    Monto Pagado (S/)
                  </label>
                  <input aria-label="Monto pagado (S/)"
                    type="number"
                    step="0.01"
                    min="0"
                    max={grandTotal}
                    value={billingAmountPaid}
                    onChange={(e) => setBillingAmountPaid(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold"
                  />
                </div>
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wide -mt-1 ${
                (grandTotal - Number(billingAmountPaid || 0)) > 0.009 ? "text-rose-600" : "text-emerald-700"
              }`}>
                {(grandTotal - Number(billingAmountPaid || 0)) > 0.009
                  ? `Saldo pendiente en el comprobante: S/ ${(grandTotal - Number(billingAmountPaid || 0)).toFixed(2)}`
                  : "Se imprimirá como pagado en su totalidad"}
              </p>

              <div className="flex items-center gap-2 mt-2 pb-1">
                <input
                  type="checkbox"
                  id="includeRoomType"
                  checked={includeRoomType}
                  onChange={(e) => setIncludeRoomType(e.target.checked)}
                  className="w-4 h-4 text-stone-900 bg-stone-100 border-stone-300 rounded focus:ring-stone-900"
                />
                <label htmlFor="includeRoomType" className="text-xs font-bold text-stone-600 cursor-pointer select-none">
                  Incluir tipo de habitación (Ej. Matrimonial)
                </label>
              </div>
            </div>
            </div>

            <div className="pt-2 shrink-0 mt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setTicketComprobante(null);
                  setIsBillingModalOpen(false);
                  setIsPrinting(true);
                }}
                className="w-full py-2.5 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-800 transition shadow-lg shadow-stone-900/20"
              >
                Imprimir ticket interno
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
