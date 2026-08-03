"use client";

import { useState, useEffect } from "react";
import { adminCreateBooking } from "../actions";
import { Calendar, User, Phone, MapPin, DollarSign, FileText, Bed } from "lucide-react";

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
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-200/60 p-8 md:p-10 shadow-sm max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-50 text-[#d97706] p-3 rounded-2xl border border-amber-100">
          <Calendar size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-stone-900">Registrar Recepción</h3>
          <p className="text-stone-400 text-xs">Crea una reserva directamente para un huésped walk-in.</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold text-center mb-6 border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selección de Habitación */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Habitación</label>
            <div className="relative">
              <Bed className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <select
                value={selectedRoomId}
                onChange={(e) => {
                  setSelectedRoomId(Number(e.target.value));
                  setCustomPrice("");
                }}
                className="w-full p-4 pl-12 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none appearance-none cursor-pointer text-stone-700 text-ellipsis overflow-hidden"
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Método de Pago</label>
            <select
              name="paymentMethod"
              required
              className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-750"
            >
              <option value="recepcion">🏨 Pagar en Recepción (Efectivo/Tarjeta)</option>
              <option value="online">💳 Yape / Plin / Transferencia</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha de Entrada */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Entrada (Check-in)</label>
            <input
              type="date"
              name="checkIn"
              required
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setCustomPrice("");
              }}
              className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700"
            />
          </div>

          {/* Fecha de Salida */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Salida (Check-out)</label>
            <input
              type="date"
              name="checkOut"
              required
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setCustomPrice("");
              }}
              className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700"
            />
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="border-t border-stone-100 pt-6 space-y-4">
          <h4 className="font-bold text-xs text-stone-500 uppercase tracking-widest ml-2 mb-2">Detalles del Huésped</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Nombre del huésped"
                  className="w-full p-4 pl-12 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Celular</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="WhatsApp / Teléfono"
                  className="w-full p-4 pl-12 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Tipo Doc</label>
              <select
                name="documentType"
                className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-750"
              >
                <option value="DNI">DNI</option>
                <option value="CE">C.E.</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Número de Documento</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="text"
                  name="documentNumber"
                  required
                  placeholder="N° de documento"
                  className="w-full p-4 pl-12 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">País de Origen</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="text"
                  name="country"
                  defaultValue="Perú"
                  className="w-full p-4 pl-12 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Correo (Opcional)</label>
              <input
                type="email"
                name="email"
                placeholder="cliente@correo.com"
                className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold outline-none text-stone-700"
              />
            </div>
          </div>
        </div>

        {/* Resumen de Tarifas */}
        <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Monto Total Estimado</p>
            <p className="text-2xl font-black text-[#d97706] mt-1">
              S/ {customPrice ? Number(customPrice) : price} <span className="text-xs font-bold text-stone-500">({nights} Noche{nights > 1 ? "s" : ""})</span>
            </p>
          </div>
          
          <div className="flex flex-col gap-1 w-full md:w-48">
            <label className="text-[9px] font-black uppercase text-stone-400 ml-1">Tarifa Personalizada</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input
                type="number"
                placeholder="Monto final (S/)"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full p-2.5 pl-8 bg-white rounded-xl border border-stone-200 text-xs font-bold outline-none focus:border-[#d97706]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-shimmer w-full bg-[#d97706] hover:bg-black text-white font-black py-4 rounded-2xl transition duration-300 text-xs uppercase tracking-widest shadow-lg shadow-amber-900/10 disabled:opacity-50"
        >
          {isSubmitting ? "Registrando..." : "Registrar Entrada Directa"}
        </button>
      </form>
    </div>
  );
}
