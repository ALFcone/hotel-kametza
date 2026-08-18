"use client";
/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/admin/WalkInForm.tsx
 * PROPÓSITO: Formulario de Nueva Reserva Rápida (Walk-in).
 *            Permite a recepción crear reservas manualmente y 
 *            registrarlas al instante desde el Panel de Administración.
 * ---------------------------------------------------------------------
 */
import { useState, useRef } from "react";
import { adminCreateBooking, searchGuestByDocument } from "../actions";
import { Calendar, User, Phone, MapPin, DollarSign, FileText, Bed, Search, Loader2 } from "lucide-react";

interface Room {
  id: number;
  name: string;
  room_number: string;
  price_per_night: number;
}

export default function WalkInForm({ rooms }: { rooms: Room[] }) {
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id || 0);
  const [checkIn, setCheckIn] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState<string>(() => new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Refs para autocompletado
  const docNumRef = useRef<HTMLInputElement>(null);
  const docTypeRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Derived state: Nights
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Derived state: Price
  const price = selectedRoom ? nights * selectedRoom.price_per_night : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("roomId", selectedRoomId.toString());
    formData.set("price", (customPrice ? Number(customPrice) : price).toString());

    try {
      const res = await adminCreateBooking(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else if (res?.success) {
        setStatusMessage({ type: "success", text: "¡Reserva registrada con éxito!" });
        // Reset form
        (e.target as HTMLFormElement).reset();
        setCustomPrice("");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Ocurrió un error inesperado." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchDni = async () => {
    const docNumber = docNumRef.current?.value;
    if (!docNumber || docNumber.length < 5) {
      setStatusMessage({ type: "error", text: "Ingresa un documento válido para buscar." });
      return;
    }

    setIsSearchingDni(true);
    setStatusMessage(null);
    try {
      const guest = await searchGuestByDocument(docNumber);
      if (guest) {
        if (nameRef.current) nameRef.current.value = guest.name || "";
        if (phoneRef.current) phoneRef.current.value = guest.phone || "";
        if (emailRef.current) emailRef.current.value = guest.email || "";
        if (countryRef.current) countryRef.current.value = guest.country || "Perú";
        if (docTypeRef.current && guest.document_type) docTypeRef.current.value = guest.document_type;
        
        if (guest.phone) {
          setStatusMessage({ type: "success", text: "¡Huésped frecuente! Datos cargados del historial." });
        } else {
          setStatusMessage({ type: "success", text: "DNI válido (RENIEC). Completa los datos restantes." });
        }
      } else {
        setStatusMessage({ type: "info", text: "No encontrado. Por favor, ingresa los datos a mano." });
      }
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: "error", text: "No se pudo buscar el documento." });
    } finally {
      setIsSearchingDni(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-stone-100 p-8 md:p-12 shadow-2xl shadow-stone-200/50 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-amber-100 to-amber-50 text-[#d97706] p-4 rounded-2xl border border-amber-200 shadow-inner">
          <Calendar size={24} />
        </div>
        <div>
          <h3 className="font-bold text-xl text-stone-900 tracking-tight">Registrar Recepción</h3>
          <p className="text-stone-400 text-xs mt-0.5">Crea una reserva directamente para un huésped walk-in.</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold text-center mb-6 border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : statusMessage.type === "info"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Selección de Habitación */}
          <div className="flex flex-col gap-1.5 group/input">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Habitación</label>
            <div className="relative">
              <Bed className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-[#d97706] transition-colors" size={16} />
              <select
                value={selectedRoomId}
                onChange={(e) => {
                  setSelectedRoomId(Number(e.target.value));
                  setCustomPrice("");
                }}
                className="w-full p-4 pl-12 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none appearance-none cursor-pointer text-stone-700 text-ellipsis overflow-hidden focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Hab #{room.room_number || room.id} — {room.name} (S/ {room.price_per_night}/noche)
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-[10px]">▼</div>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="flex flex-col gap-1.5 group/input">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Método de Pago</label>
            <select
              name="paymentMethod"
              required
              className="w-full p-4 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-750 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
            >
              <option value="recepcion">🏨 Pagar en Recepción (Efectivo/Tarjeta)</option>
              <option value="online">💳 Yape / Plin / Transferencia</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Fecha de Entrada */}
          <div className="flex flex-col gap-1.5 group/input">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Entrada (Check-in)</label>
            <input
              type="date"
              name="checkIn"
              required
              value={checkIn}
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setCustomPrice("");
              }}
              className="w-full p-4 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50 cursor-pointer"
            />
          </div>

          {/* Fecha de Salida */}
          <div className="flex flex-col gap-1.5 group/input">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Salida (Check-out)</label>
            <input
              type="date"
              name="checkOut"
              required
              value={checkOut}
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setCustomPrice("");
              }}
              className="w-full p-4 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50 cursor-pointer"
            />
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="border-t border-stone-100 pt-8 mt-4 space-y-5">
          <h4 className="font-bold text-xs text-stone-500 uppercase tracking-widest ml-2 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
            Detalles del Huésped
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 group/input">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-[#d97706] transition-colors" size={16} />
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  required
                  placeholder="Nombre del huésped"
                  className="w-full p-4 pl-12 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 group/input">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Celular</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-[#d97706] transition-colors" size={16} />
                <input
                  ref={phoneRef}
                  type="tel"
                  name="phone"
                  required
                  placeholder="WhatsApp / Teléfono"
                  className="w-full p-4 pl-12 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-1 flex flex-col gap-1.5 group/input">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Tipo Doc</label>
              <select
                ref={docTypeRef}
                name="documentType"
                className="w-full p-4 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-750 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
              >
                <option value="DNI">DNI</option>
                <option value="CE">C.E.</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5 group/input">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Número de Documento</label>
              <div className="relative flex items-center">
                <FileText className="absolute left-4 text-stone-400 group-focus-within/input:text-[#d97706] transition-colors z-10 pointer-events-none" size={16} />
                <input
                  ref={docNumRef}
                  type="text"
                  name="documentNumber"
                  required
                  placeholder="N° de documento"
                  className="w-full p-4 pl-12 pr-14 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchDni();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearchDni}
                  disabled={isSearchingDni}
                  className="absolute right-2 p-2 bg-[#d97706]/10 text-[#d97706] rounded-xl hover:bg-[#d97706] hover:text-white transition-colors disabled:opacity-50"
                  title="Buscar historial del huésped"
                >
                  {isSearchingDni ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 group/input">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">País de Origen</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-[#d97706] transition-colors" size={16} />
                <input
                  ref={countryRef}
                  type="text"
                  name="country"
                  list="countries-list"
                  defaultValue="Perú"
                  className="w-full p-4 pl-12 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
                />
                <datalist id="countries-list">
                  <option value="Perú" />
                  <option value="Estados Unidos" />
                  <option value="España" />
                  <option value="Colombia" />
                  <option value="Chile" />
                  <option value="Argentina" />
                  <option value="Ecuador" />
                  <option value="México" />
                  <option value="Brasil" />
                  <option value="Bolivia" />
                  <option value="Francia" />
                  <option value="Alemania" />
                  <option value="Italia" />
                  <option value="Reino Unido" />
                  <option value="Canadá" />
                </datalist>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 group/input">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 group-focus-within/input:text-[#d97706] transition-colors">Correo (Opcional)</label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                placeholder="cliente@correo.com"
                className="w-full p-4 bg-stone-50/50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
              />
            </div>
          </div>
        </div>

        {/* Resumen de Tarifas */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm mt-4">
          <div>
            <p className="text-[10px] font-black uppercase text-amber-700/60 tracking-wider">Monto Total Estimado</p>
            <p className="text-3xl font-black text-[#d97706] mt-1.5 drop-shadow-sm">
              S/ {customPrice ? Number(customPrice) : price} <span className="text-xs font-bold text-amber-600/70 ml-1">({nights} Noche{nights > 1 ? "s" : ""})</span>
            </p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex flex-col gap-1.5 flex-1 group/input">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-1 group-focus-within/input:text-[#d97706] transition-colors">Tarifa Total Fija</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-[#d97706] transition-colors" size={14} />
                <input
                  type="number"
                  placeholder="S/ Total"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full p-3 pl-8 bg-white/60 backdrop-blur-sm rounded-xl border border-stone-200 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] transition-all shadow-inner shadow-stone-100/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 group/input">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-1 group-focus-within/input:text-emerald-500 transition-colors">Monto Cobrado Hoy</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-emerald-500 transition-colors" size={14} />
                <input
                  type="number"
                  name="amountPaid"
                  placeholder="S/ Adelanto"
                  className="w-full p-3 pl-8 bg-white/60 backdrop-blur-sm rounded-xl border border-stone-200 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-700 transition-all shadow-inner shadow-stone-100/50"
                />
              </div>
              <span className="text-[8px] font-medium text-stone-400 text-center uppercase tracking-wider">Dejar vacío si cobró todo</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="relative overflow-hidden w-full bg-stone-900 text-amber-500 font-black py-4.5 rounded-[1.5rem] transition-all duration-300 text-xs uppercase tracking-widest shadow-xl hover:shadow-[#d97706]/20 hover:-translate-y-0.5 group/btn disabled:opacity-50 mt-4"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting ? "Registrando..." : "Registrar Entrada Directa"}
          </span>
          {!isSubmitting && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />}
        </button>
      </form>
    </div>
  );
}
