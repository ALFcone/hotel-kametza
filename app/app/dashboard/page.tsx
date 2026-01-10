"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  MapPin,
  LogOut,
  Home,
} from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      // 1. Verificar Usuario
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);

      // 2. Cargar sus reservas
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*, rooms(name, image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingData) setBookings(bookingData);
      setLoading(false);
    };

    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-rose-900 font-bold">
        Cargando tu perfil...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans">
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-900 shadow-inner">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-rose-950">
                Hola, {user.user_metadata?.full_name || "Viajero"}
              </h1>
              <p className="text-stone-500 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="px-5 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-xs hover:bg-stone-200 transition flex items-center gap-2"
            >
              <Home size={14} /> Inicio
            </a>
            <button
              onClick={handleLogout}
              className="px-5 py-3 bg-rose-50 text-rose-900 rounded-xl font-bold text-xs hover:bg-rose-100 transition flex items-center gap-2"
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        {/* HISTORIAL DE RESERVAS */}
        <h2 className="text-xl font-serif font-bold text-stone-700 mb-6 flex items-center gap-2">
          <Calendar className="text-rose-900" size={20} /> Mis Estancias
        </h2>

        <div className="grid gap-6">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white p-6 rounded-3xl shadow-md border border-stone-100 flex flex-col md:flex-row gap-6 hover:shadow-xl transition duration-300"
              >
                <div className="w-full md:w-40 h-32 rounded-2xl overflow-hidden relative bg-stone-200">
                  {booking.rooms?.image_url && (
                    <img
                      src={booking.rooms.image_url}
                      className="w-full h-full object-cover"
                      alt="Habitación"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-rose-950">
                      {booking.rooms?.name || "Habitación"}
                    </h3>
                    {booking.status === "pagado" ||
                    booking.status === "approved" ? (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle size={12} /> Confirmada
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Clock size={12} /> Pendiente
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-stone-500">
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Llegada
                      </p>
                      <p className="font-bold text-stone-700">
                        {booking.check_in}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Salida
                      </p>
                      <p className="font-bold text-stone-700">
                        {booking.check_out}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Total
                      </p>
                      <p className="font-bold text-rose-900">
                        S/ {booking.price || booking.total_price}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Pago
                      </p>
                      <p className="capitalize font-medium">
                        {booking.payment_method}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-200">
              <p className="text-stone-400 font-bold mb-4 text-sm">
                Aún no tienes reservas registradas.
              </p>
              <a
                href="/#habitaciones"
                className="text-rose-900 font-bold hover:underline text-sm"
              >
                ¡Reserva ahora!
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
