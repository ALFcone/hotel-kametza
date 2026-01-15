"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cancelBooking } from "../actions"; // Importamos la acción de cancelar
import {
  CalendarDays,
  CreditCard,
  Clock,
  ArrowRight,
  LogOut,
  BedDouble,
  User,
  Home,
  XCircle, // Icono para botón cancelar
  Ban, // Icono para estado cancelado (encima de la foto)
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    const getData = async () => {
      // 1. Obtener Usuario
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/");
        return;
      }
      setUser(user);

      // 2. Obtener Reservas
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*, rooms(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsData) setBookings(bookingsData);
      setLoading(false);
    };

    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // --- LÓGICA DE CANCELACIÓN ---
  const handleCancel = async (bookingId: number) => {
    const confirm = window.confirm(
      "¿Estás seguro que deseas cancelar esta reserva? Esta acción liberará la habitación."
    );
    if (!confirm) return;

    setCancellingId(bookingId); // Activar "cargando..."
    const res = await cancelBooking(bookingId); // Llamar al servidor

    if (res?.success) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
      alert("Reserva cancelada correctamente.");
    } else {
      // AHORA MOSTRAMOS EL ERROR REAL
      alert("Error: " + (res?.error || "Desconocido"));
    }
    setCancellingId(null);
  };

  const getDisplayName = () => {
    if (!user) return "Viajero";
    const rawName = user.user_metadata?.full_name || user.email || "Viajero";
    const firstName = rawName.split(" ")[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "pendiente":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-800 border-rose-100";
      default:
        return "bg-stone-100 text-stone-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendiente de Pago";
      case "pendiente":
        return "Pendiente de Pago";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#700824] font-bold animate-pulse">
        Cargando tus reservas...
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-stone-800 relative bg-[#FDFBF7]">
      {/* FONDO */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/86/Retablo_ayacuchano.jpg"
          alt="Fondo Textura"
          className="w-full h-full object-cover object-center opacity-20 scale-105 blur-[2px]"
        />
        <div className="absolute inset-0 bg-[#FFFDF5]/90 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <span className="text-[#700824] font-bold tracking-widest text-xs uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100 mb-4 inline-block">
              Panel de Huésped
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-stone-900">
              Hola, {getDisplayName()}
            </h1>
            <p className="text-stone-500 mt-2 font-light">
              Gestiona tus reservas de manera sencilla.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 px-5 py-3 rounded-full hover:bg-stone-50 hover:text-[#700824] transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
            >
              <Home size={16} /> Inicio
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-stone-900 text-white px-5 py-3 rounded-full hover:bg-[#700824] transition-all shadow-lg font-bold text-xs uppercase tracking-wider"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        {/* LISTA */}
        {bookings.length > 0 ? (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`group bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-stone-100 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden transition-all duration-500 ${
                  booking.status === "cancelled"
                    ? "opacity-75 grayscale-[0.5]"
                    : "hover:shadow-2xl"
                }`}
              >
                {/* Decoración Fondo Tarjeta */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-bl-[100px] -z-0 group-hover:bg-rose-50 transition-colors duration-500"></div>

                {/* IMAGEN */}
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-md relative z-10 flex-shrink-0">
                  <img
                    src={booking.rooms?.image_url}
                    alt={booking.rooms?.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay Cancelado */}
                  {booking.status === "cancelled" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Ban className="text-white opacity-80" size={32} />
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1 w-full relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-serif font-bold text-[#700824]">
                      {booking.rooms?.name || "Habitación"}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {getStatusText(booking.status)}
                    </span>
                  </div>

                  {/* ID CORREGIDO (+100) */}
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">
                    TICKET: RES-{(booking.id + 100).toString().padStart(5, "0")}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                    <div className="flex items-center gap-3">
                      <div className="bg-stone-50 p-2 rounded-full text-stone-400">
                        <CalendarDays size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">
                          Llegada
                        </p>
                        <p className="text-sm font-bold text-stone-700">
                          {booking.check_in}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-stone-50 p-2 rounded-full text-stone-400">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">
                          Salida
                        </p>
                        <p className="text-sm font-bold text-stone-700">
                          {booking.check_out}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                      <div className="bg-stone-50 p-2 rounded-full text-stone-400">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">
                          Total
                        </p>
                        <p className="text-lg font-black text-[#700824]">
                          S/ {booking.total_price}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SOLO BOTÓN CANCELAR (Y solo si no está cancelada ya) */}
                  {booking.status !== "cancelled" && (
                    <div className="mt-6 border-t border-stone-100 pt-4 flex justify-end">
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="flex items-center gap-2 text-rose-700 hover:text-white border border-rose-200 hover:bg-rose-700 hover:border-rose-700 px-4 py-2 rounded-lg transition-all duration-300 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === booking.id ? (
                          "Cancelando..."
                        ) : (
                          <>
                            <XCircle size={16} /> Cancelar Reserva
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-stone-100">
            <div className="bg-stone-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
              <BedDouble size={48} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
              Aún no tienes reservas
            </h2>
            <p className="text-stone-500 max-w-md mx-auto mb-8">
              Descubre la magia de Ayacucho y vive una experiencia inolvidable
              con nosotros.
            </p>
            <Link
              href="/#habitaciones"
              className="inline-flex items-center gap-2 bg-[#700824] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg hover:shadow-rose-900/30"
            >
              Explorar Habitaciones <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
