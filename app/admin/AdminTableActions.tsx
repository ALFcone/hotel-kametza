"use client";
/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/admin/AdminTableActions.tsx
 * PROPÓSITO: Componente que renderiza los botones de acción en la tabla 
 *            del Historial (Abonar, Editar Fechas, Consumos, Eliminar)
 *            y maneja todas sus ventanas emergentes (modales).
 */
import { useState, useEffect } from "react";
import { CheckCircle, X, DollarSign, Edit3, Calendar, ShoppingCart, Trash2, MessageCircle, Printer, FileWarning } from "lucide-react";
import { adminRegisterPayment, adminUpdateBookingDates, addBookingExtra, deleteBookingExtra, fetchRucData, fetchDniData, cancelBooking } from "@/app/actions";
import ThermalTicket from "./ThermalTicket";

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
  onDelete: (formData: FormData) => void;
  // added customer_document if it exists in parent, otherwise we'll pass guestName as is
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
  onDelete,
}: AdminTableActionsProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [extraQty, setExtraQty] = useState("1");
  const [editCheckOut, setEditCheckOut] = useState<string>(checkOut);
  const [editTotalPrice, setEditTotalPrice] = useState<string>(totalPrice.toString());
  const [loading, setLoading] = useState(false);
  
  // Facturación States
  const [isPrinting, setIsPrinting] = useState(false);
  const [billingType, setBillingType] = useState<"BOLETA" | "FACTURA" | "NOTA DE CRÉDITO">("BOLETA");
  const [billingDocument, setBillingDocument] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [includeRoomType, setIncludeRoomType] = useState(false);
  const [isFetchingRuc, setIsFetchingRuc] = useState(false);

  const handleFetchDocument = async () => {
    if (billingType === "FACTURA" && billingDocument.length !== 11) {
      alert("El RUC debe tener 11 dígitos");
      return;
    }
    if (billingType === "BOLETA" && billingDocument.length !== 8) {
      alert("El DNI debe tener 8 dígitos");
      return;
    }
    
    setIsFetchingRuc(true);
    try {
      const result = billingType === "FACTURA" 
        ? await fetchRucData(billingDocument)
        : await fetchDniData(billingDocument);
        
      if (billingType === "FACTURA" && result.data && result.data.nombre) {
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
      } else if (billingType === "BOLETA" && result.data) {
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
        alert(`${billingType === "FACTURA" ? "RUC" : "DNI"} no encontrado o inválido.`);
      }
    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor. Inténtalo de nuevo.");
    }
    setIsFetchingRuc(false);
  };
  
  const extrasTotal = extras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
  const grandTotal = totalPrice + extrasTotal;
  const balance = grandTotal - (amountPaid || 0);
  const isFullyPaid = status === "pagado" || status === "approved" || balance <= 0;

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
    const formData = new FormData();
    formData.append("bookingId", bookingId.toString());
    formData.append("itemName", extraName);
    formData.append("price", extraPrice);
    formData.append("quantity", extraQty);
    
    const result = await addBookingExtra(formData);
    if (result.error) alert(result.error);
    else {
      setExtraName("");
      setExtraPrice("");
      setExtraQty("1");
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
    if (confirm("¿Estás seguro de anular esta reserva y generar una Nota de Crédito?")) {
      setLoading(true);
      const result = await cancelBooking(bookingId);
      if (result.error) alert(result.error);
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
    customer_document: billingDocument || guestPhone || "No Registrado",
    customer_address: billingAddress || undefined,
    room_id: roomName,
    room_type: includeRoomType ? roomType : undefined,
  };

  const handleOpenBilling = () => {
    // Valores por defecto al abrir
    setBillingType(isCancelled ? "NOTA DE CRÉDITO" : "BOLETA");
    setBillingDocument(guestDocument || "");
    setBillingName(guestName);
    setIsBillingModalOpen(true);
  };

  return (
    <>
      {isPrinting && (
        <ThermalTicket 
          booking={mockBookingForTicket} 
          type={billingType} 
          correlative={`${billingType === "FACTURA" ? "F001" : "B001"}-${bookingId.toString().padStart(6, '0')}`} 
        />
      )}
      
      <div className="flex gap-2 justify-center">
        <button
          onClick={handleOpenBilling}
          className={`group relative flex items-center justify-center w-8 h-8 border rounded-lg transition-all hover:-translate-y-0.5 ${
            isCancelled 
              ? "bg-rose-50 border-rose-200 text-rose-500 hover:border-rose-400 hover:bg-rose-100 hover:text-rose-700 hover:shadow-[0_2px_10px_rgba(244,63,94,0.2)]" 
              : "bg-white border-stone-200 text-stone-400 hover:border-zinc-800 hover:text-zinc-800 hover:bg-zinc-100 hover:shadow-[0_2px_10px_rgba(39,39,42,0.1)]"
          }`}
          title={isCancelled ? "Imprimir Nota de Crédito" : "Emitir Comprobante (Boleta/Factura)"}
        >
          <Printer size={14} className="group-hover:scale-110 transition-transform duration-300" />
        </button>
        {!isCancelled && (
          <button
            onClick={handleShareWhatsApp}
            className="group relative flex items-center justify-center w-8 h-8 bg-white border border-stone-200 text-stone-400 rounded-lg hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all hover:shadow-[0_2px_10px_rgba(34,197,94,0.1)] hover:-translate-y-0.5"
            title="Compartir Comprobante por WhatsApp"
          >
            <MessageCircle size={14} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        )}
        {!isCancelled && (
          <button
            onClick={() => setIsExtrasModalOpen(true)}
            className="group relative flex items-center justify-center w-8 h-8 bg-white border border-stone-200 text-stone-400 rounded-lg hover:border-purple-200 hover:text-purple-600 hover:bg-purple-50 transition-all hover:shadow-[0_2px_10px_rgba(168,85,247,0.1)] hover:-translate-y-0.5"
            title="Añadir Consumos / Extras"
          >
            <ShoppingCart size={14} className="group-hover:scale-110 transition-transform duration-300" />
            {extras.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {extras.length}
              </span>
            )}
          </button>
        )}
        {!isCancelled && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="group relative flex items-center justify-center w-8 h-8 bg-white border border-stone-200 text-stone-400 rounded-lg hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all hover:shadow-[0_2px_10px_rgba(59,130,246,0.1)] hover:-translate-y-0.5"
            title="Editar Reserva"
          >
            <Edit3 size={14} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        )}
        {!isFullyPaid && !isCancelled && (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="group relative flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-[0_2px_10px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
            title="Registrar Pago"
          >
            <CheckCircle size={14} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-wider">Abonar</span>
          </button>
        )}
        {!isCancelled && (
          <button
            onClick={handleCancelBooking}
            className="group relative flex items-center justify-center w-8 h-8 bg-white border border-stone-200 text-stone-400 rounded-lg hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50 transition-all hover:shadow-[0_2px_10px_rgba(249,115,22,0.1)] hover:-translate-y-0.5"
            title="Anular y Emitir Nota de Crédito"
          >
            <FileWarning size={14} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        )}
        <form action={onDelete}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <button
            type="submit"
            className="group relative flex items-center justify-center w-8 h-8 bg-white border border-stone-200 text-stone-400 rounded-lg hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all hover:shadow-[0_2px_10px_rgba(239,68,68,0.1)] hover:-translate-y-0.5"
            title="Eliminar Reserva"
          >
            <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </form>
      </div>

      {/* Modal de Pago */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Registrar Pago</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva #{bookingId}</p>
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
                <span className="font-bold text-emerald-600">- S/ {(amountPaid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                <span className="text-stone-900 font-bold">Saldo Pendiente:</span>
                <span className="font-black text-rose-600">S/ {balance.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleRegisterPayment}>
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">
                  Monto a Pagar (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">S/</span>
                  <input
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
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
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
        </div>
      )}

      {/* Modal de Editar Reserva */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Editar Reserva</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva #{bookingId}</p>
              </div>
            </div>

            <form onSubmit={handleEditBooking}>
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">
                  Fecha de Entrada (Fija)
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="date"
                    value={checkIn}
                    disabled
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">
                  Nueva Fecha de Salida
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
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
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">
                  Nuevo Precio Total (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min={amountPaid || 0}
                    value={editTotalPrice}
                    onChange={(e) => setEditTotalPrice(e.target.value)}
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-[9px] text-stone-500 font-medium mt-1.5 ml-1">
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
        </div>
      )}

      {/* Modal de Consumos Extras */}
      {isExtrasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsExtrasModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Consumos Extras</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva #{bookingId}</p>
              </div>
            </div>

            {/* Formulario para añadir */}
            <form onSubmit={handleAddExtra} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-6">
              <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3">Añadir Nuevo Consumo</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ej: Botella de Agua"
                  value={extraName}
                  onChange={(e) => setExtraName(e.target.value)}
                  required
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm font-bold placeholder-stone-300"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">S/</span>
                    <input
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">Cant:</span>
                    <input
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
                <h4 className="text-[10px] font-black uppercase text-stone-400">Detalle de Consumos</h4>
                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded">Total: S/ {extrasTotal.toFixed(2)}</span>
              </div>
              
              {extras.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs italic">
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
        </div>
      )}

      {/* Modal de Facturación / Boleta */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setIsBillingModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center">
                <Printer size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Emitir Comprobante</h3>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Reserva #{bookingId}</p>
              </div>
            </div>

            <div className="overflow-y-auto pr-1 -mr-1 flex-1">
              <div className="bg-stone-50 p-3 rounded-2xl mb-3">
                <h3 className="text-[10px] font-black uppercase text-stone-400 mb-2 tracking-wider">
                  Tipo de Comprobante
                </h3>
              
              {isCancelled ? (
                <div className="flex bg-stone-200 p-1 rounded-xl">
                  <button className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-rose-500 text-white shadow-sm cursor-default">
                    NOTA DE CRÉDITO
                  </button>
                </div>
              ) : (
                <div className="flex bg-stone-200 p-1 rounded-xl">
                  <button
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${billingType === 'BOLETA' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    onClick={() => {
                      setBillingType('BOLETA');
                      setBillingDocument(guestDocument || "");
                      setBillingName(guestName);
                    }}
                  >
                    BOLETA
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${billingType === 'FACTURA' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    onClick={() => {
                      setBillingType('FACTURA');
                      setBillingDocument("");
                      setBillingName("");
                    }}
                  >
                    FACTURA
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">
                  {billingType === "FACTURA" ? "RUC (11 dígitos)" : "DNI / Documento"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={billingDocument}
                    onChange={(e) => setBillingDocument(e.target.value.replace(/\D/g, ''))}
                    maxLength={billingType === "FACTURA" ? 11 : 8}
                    placeholder={billingType === "FACTURA" ? "Ej. 20123456789" : "Ej. 70123456"}
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold"
                  />
                  <button
                    onClick={handleFetchDocument}
                    disabled={isFetchingRuc || (billingType === "FACTURA" ? billingDocument.length !== 11 : billingDocument.length !== 8)}
                    className="px-3 bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {isFetchingRuc ? "..." : "Buscar"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">
                  {billingType === "FACTURA" ? "Razón Social" : "Nombre del Cliente"}
                </label>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value.toUpperCase())}
                  placeholder="Nombres completos"
                  className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">
                  Dirección (Opcional)
                </label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value.toUpperCase())}
                  placeholder="Ej. Av. Principal 123"
                  className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold uppercase"
                />
              </div>
              
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
                  if (!billingDocument || !billingName) {
                    alert("Complete los datos del cliente");
                    return;
                  }
                  setIsBillingModalOpen(false);
                  setIsPrinting(true);
                }}
                className="w-full py-2.5 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-stone-800 transition shadow-lg shadow-stone-900/20"
              >
                Generar {billingType} e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
