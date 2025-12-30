import { supabase } from "@/lib/supabase";
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Users,
  LogOut,
  BedDouble,
  Clock,
} from "lucide-react";
import Link from "next/link";

// --- TIPOS ---
interface Booking {
  id: number;
  room_id: number;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string; // 'confirmed', 'pending', 'cancelled'
  rooms: { name: string };
}

interface Room {
  id: number;
  name: string;
  status: "available" | "occupied" | "cleaning";
}

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // 1. Obtener todas las reservas
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select(`*, rooms(name)`)
    .order("created_at", { ascending: false });

  const bookings = (bookingsData as any[]) || [];

  // 2. Obtener habitaciones
  const { data: roomsData } = await supabase
    .from("rooms")
    .select("*")
    .order("id");
  const allRooms = (roomsData as any[]) || [];

  // --- LÓGICA DE NEGOCIO (Cálculos) ---

  // Calcular Ingresos Totales
  const totalRevenue = bookings.reduce(
    (acc, curr) => acc + (curr.total_price || 0),
    0
  );

  // Calcular Ocupación Actual (Simulada: Si hay reserva que incluye HOY)
  const today = new Date().toISOString().split("T")[0];
  const activeBookings = bookings.filter(
    (b) => b.check_in <= today && b.check_out >= today
  );
  const occupiedRoomIds = activeBookings.map((b) => b.room_id);

  // Mapear estado de habitaciones para el Grid Visual
  const roomStatusList = allRooms.map((room) => ({
    ...room,
    status: occupiedRoomIds.includes(room.id) ? "occupied" : "available",
  }));

  const occupancyRate =
    Math.round((activeBookings.length / allRooms.length) * 100) || 0;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      {/* --- SIDEBAR / NAVBAR SUPERIOR --- */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-rose-900 text-white p-2 rounded-lg">
                <BedDouble size={24} />
              </div>
              <span className="font-serif font-bold text-xl text-rose-950">
                Kametza Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-500">
                Hola, Administrador
              </span>
              <Link
                href="/"
                className="text-sm text-rose-700 hover:text-rose-900 font-medium"
              >
                Ver Web Pública &rarr;
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- SECCIÓN 1: KPIs (TARJETAS DE ESTADÍSTICAS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Tarjeta 1: Ingresos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Ingresos Totales
              </p>
              <h3 className="text-2xl font-bold text-emerald-900">
                S/ {totalRevenue}
              </h3>
            </div>
          </div>

          {/* Tarjeta 2: Reservas Totales */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Reservas
              </p>
              <h3 className="text-2xl font-bold text-stone-900">
                {bookings.length}
              </h3>
            </div>
          </div>

          {/* Tarjeta 3: Ocupación */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
              <BedDouble size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Ocupación Hoy
              </p>
              <h3 className="text-2xl font-bold text-rose-900">
                {occupancyRate}%
              </h3>
            </div>
          </div>

          {/* Tarjeta 4: Huéspedes Activos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Huéspedes Activos
              </p>
              <h3 className="text-2xl font-bold text-stone-900">
                {activeBookings.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- SECCIÓN 2: ESTADO DE HABITACIONES (VISUAL) --- */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-rose-700" /> Estado de
              Habitaciones
            </h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
              <div className="grid grid-cols-2 gap-4">
                {roomStatusList.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all ${
                      room.status === "occupied"
                        ? "border-rose-100 bg-rose-50"
                        : "border-emerald-100 bg-emerald-50"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold uppercase mb-1 ${
                        room.status === "occupied"
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {room.status === "occupied" ? "Ocupada" : "Disponible"}
                    </span>
                    <span className="font-bold text-stone-800">
                      {room.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded-full"></div>{" "}
                  Libre
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-50 border border-rose-200 rounded-full"></div>{" "}
                  Ocupada
                </div>
              </div>
            </div>
          </div>

          {/* --- SECCIÓN 3: ÚLTIMAS RESERVAS (TABLA DETALLADA) --- */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                <Clock size={20} className="text-rose-700" /> Últimas Reservas
              </h2>
              <button className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-black transition">
                Descargar Reporte
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-xs border-b border-stone-100">
                    <tr>
                      <th className="px-6 py-4">Huésped</th>
                      <th className="px-6 py-4">Habitación</th>
                      <th className="px-6 py-4">Fechas</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-stone-400"
                        >
                          No hay reservas registradas aún.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="hover:bg-stone-50/50 transition"
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold text-stone-800">
                              {booking.guest_name}
                            </p>
                            <p className="text-stone-400 text-xs">
                              ID: #{booking.id}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded-md text-xs font-medium">
                              {booking.rooms?.name || "Hab. General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-stone-600">
                            <div className="flex flex-col text-xs">
                              <span className="flex items-center gap-1">
                                📥 {booking.check_in}
                              </span>
                              <span className="flex items-center gap-1">
                                📤 {booking.check_out}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Confirmada
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-stone-800">
                            S/ {booking.total_price}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
