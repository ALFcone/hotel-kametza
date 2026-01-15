"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cancelBooking } from "../actions"; // Importamos la lógica del servidor
import {
  CalendarDays,
  CreditCard,
  Clock,
  ArrowRight,
  LogOut,
  BedDouble,
  User,
  Home,
  XCircle,
  Ban,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();

  // ==============================================================================
  // 1. ESTADO: Variables para guardar datos temporalmente en pantalla
  // ==============================================================================
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // Guardamos quién es el usuario
  const [bookings, setBookings] = useState<any[]>([]); // Guardamos sus reservas
  const [cancellingId, setCancellingId] = useState<number | null>(null); // Para efecto de carga

  // ==============================================================================
  // 2. EFECTO: Cargar datos al entrar a la página
  // ==============================================================================
  useEffect(() => {
    const getData = async () => {
      // A. Obtener Usuario actual
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/"); // Si no hay usuario, mandar al inicio
        return;
      }
      setUser(user);

      // B. Obtener Reservas de este usuario desde Supabase
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*, rooms(*)")
        .eq("user_id", user.id) // Solo las de este ID
        .order("created_at", { ascending: false });

      if (bookingsData) setBookings(bookingsData);
      setLoading(false); // Apagar pantalla de carga
    };

    getData();
  }, [router]);

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ==============================================================================
  // 3. LÓGICA: Manejar el clic en "Cancelar"
  // ==============================================================================
  const handleCancel = async (bookingId: number) => {
    // A. Confirmación visual
    const confirm = window.confirm(
      "¿Estás seguro que deseas cancelar esta reserva?"
    );
    if (!confirm) return;

    // B. Validación de seguridad: ¿Sabemos quién es el usuario?
    if (!user || !user.id) {
      alert("Error crítico: No se reconoce tu usuario. Recarga la página.");
      return;
    }

    setCancellingId(bookingId); // Activar spinner en el botón

    // C. LLAMADA AL SERVIDOR (Aquí estaba el error antes)
    // Ahora enviamos explícitamente el user.id para evitar el error de sesión
    const res = await cancelBooking(bookingId, user.id);

    // D. Resultado
    if (res?.success) {
      // Actualizar la lista visualmente (cambiar estado a 'cancelled')
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
      alert("Reserva cancelada correctamente.");
    } else {
      alert("Error: " + (res?.error || "Desconocido"));
    }
    setCancellingId(null);
  };

  // Función auxiliar para obtener el nombre corto del usuario
  const getDisplayName = () => {
    if (!user) return "Viajero";
    const rawName = user.user_metadata?.full_name || user.email || "Viajero";
    const firstName = rawName.split(" ")[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  // Helpers para colores y textos de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pendiente":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-800 border-rose-100";
      default:
        return "bg-stone-100 text-stone-600";
    }
  };

  // ==============================================================================
  // 4. RENDERIZADO: El HTML que ve el cliente
  // ==============================================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#700824] font-bold animate-pulse">
        Cargando tus reservas...
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-stone-800 relative bg-[#FDFBF7]">
      {/* Fondo Decorativo */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/86/Retablo_ayacuchano.jpg"
          alt="Fondo Textura"
          className="w-full h-full object-cover object-center opacity-20 scale-105 blur-[2px]"
        />
        <div className="absolute inset-0 bg-[#FFFDF5]/90 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Encabezado con Bienvenida */}
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
              className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 px-5 py-3 rounded-full hover:bg-stone-50 font-bold text-xs uppercase tracking-wider"
            >
              <Home size={16} /> Inicio
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-stone-900 text-white px-5 py-3 rounded-full hover:bg-[#700824] font-bold text-xs uppercase tracking-wider"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        {/* Lista de Reservas */}
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
                {/* Imagen Habitación */}
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-md relative z-10 flex-shrink-0">
                  <img
                    src={booking.rooms?.image_url}
                    alt={booking.rooms?.name}
                    className="w-full h-full object-cover"
                  />
                  {booking.status === "cancelled" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Ban className="text-white opacity-80" size={32} />
                    </div>
                  )}
                </div>

                {/* Detalles Reserva */}
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
                      {booking.status === "cancelled"
                        ? "Cancelada"
                        : booking.status === "pendiente"
                        ? "Pendiente"
                        : booking.status}
                    </span>
                  </div>

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

                  {/* BOTÓN CANCELAR (Solo si no está cancelada) */}
                  {booking.status !== "cancelled" && (
                    <div className="mt-6 border-t border-stone-100 pt-4 flex justify-end">
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="flex items-center gap-2 text-rose-700 hover:text-white border border-rose-200 hover:bg-rose-700 hover:border-rose-700 px-4 py-2 rounded-lg transition-all duration-300 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === booking.id ? (
                          "Procesando..."
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
          /* Estado Vacío */
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-stone-100">
            <div className="bg-stone-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
              <BedDouble size={48} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
              Aún no tienes reservas
            </h2>
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
