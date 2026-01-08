import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { updateRoom } from "../actions";
import DownloadButton from "./DownloadButton"; // Importamos el botón
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Home as HomeIcon,
  X,
  TrendingUp,
  LogIn,
  LogOut,
  Brush,
} from "lucide-react";

// --- ACTIONS ---
async function markAsPaid(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");
  await supabase
    .from("bookings")
    .update({ status: "pagado" })
    .eq("id", bookingId);
  revalidatePath("/admin");
}

async function deleteBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");
  await supabase.from("bookings").delete().eq("id", bookingId);
  revalidatePath("/admin");
}

export default async function AdminPage() {
  // 1. CARGA DE DATOS
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. CÁLCULOS DE ESTADÍSTICAS
  const today = new Date().toISOString().split("T")[0]; // Fecha de hoy (YYYY-MM-DD)

  // A. Ganancias Totales (Solo pagados)
  const totalRevenue =
    bookings
      ?.filter((b) => b.status === "pagado" || b.status === "approved")
      .reduce((sum, b) => sum + b.total_price, 0) || 0;

  // B. Ocupación Actual (Reservas activas hoy)
  const occupiedCount =
    bookings?.filter((b) => b.check_in <= today && b.check_out > today)
      .length || 0;
  const totalRooms = rooms?.length || 0;
  const freeRooms = totalRooms - occupiedCount;

  // C. Llegadas y Salidas de Hoy
  const arrivalsToday =
    bookings?.filter((b) => b.check_in === today).length || 0;

  // D. POR LIMPIAR (Salidas de hoy)
  const departuresToday = bookings?.filter((b) => b.check_out === today) || [];
  const cleaningCount = departuresToday.length;

  const getRoomName = (id: number) =>
    rooms?.find((r) => r.id === id)?.name || "Habitación desconocida";

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-stone-800 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-4xl font-serif font-bold text-rose-950 flex items-center gap-3">
            <User className="bg-rose-900 text-white p-2 rounded-xl" size={48} />
            Panel de Control
          </h1>
          {/* BOTÓN DE DESCARGA */}
          {bookings && <DownloadButton data={bookings} />}
        </div>

        {/* --- SECCIÓN 1: TARJETAS DE RESUMEN (KPIs) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Ganancias */}
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-stone-100 flex items-center gap-4">
            <div className="p-4 bg-emerald-100 text-emerald-700 rounded-full">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase">
                Ganancias Totales
              </p>
              <p className="text-2xl font-black text-stone-800">
                S/ {totalRevenue}
              </p>
            </div>
          </div>

          {/* Card 2: Habitaciones */}
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-stone-100 flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-700 rounded-full">
              <HomeIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase">
                Estado Hotel
              </p>
              <p className="text-sm font-bold">
                <span className="text-rose-600">{occupiedCount} Ocupadas</span>{" "}
                / <span className="text-emerald-600">{freeRooms} Libres</span>
              </p>
            </div>
          </div>

          {/* Card 3: Movimientos Hoy */}
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-stone-100 flex items-center gap-4">
            <div className="p-4 bg-purple-100 text-purple-700 rounded-full">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase">
                Movimientos Hoy
              </p>
              <div className="flex gap-3 text-sm font-bold">
                <span className="flex items-center gap-1 text-emerald-600">
                  <LogIn size={14} /> {arrivalsToday} Entran
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <LogOut size={14} /> {cleaningCount} Salen
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: LIMPIEZA */}
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-stone-100 flex items-center gap-4 relative overflow-hidden">
            {cleaningCount > 0 && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full animate-ping m-4"></div>
            )}
            <div className="p-4 bg-amber-100 text-amber-700 rounded-full">
              <Brush size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase">
                Por Limpiar
              </p>
              <p className="text-2xl font-black text-stone-800">
                {cleaningCount}{" "}
                <span className="text-xs font-normal text-stone-400">
                  Habitaciones
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN 2: ALERTA DE LIMPIEZA --- */}
        {cleaningCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center gap-4 shadow-sm">
            <div className="bg-amber-500 text-white p-3 rounded-full">
              <Brush size={24} />
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-amber-900 text-lg">
                ⚠️ Atención: Habitaciones requieren limpieza hoy
              </h3>
              <p className="text-amber-800 text-sm">
                Las siguientes habitaciones tienen salida programada para hoy (
                {today}):
              </p>
            </div>
            <div className="flex gap-2">
              {departuresToday.map((b) => (
                <span
                  key={b.id}
                  className="bg-white text-amber-900 font-bold px-4 py-2 rounded-lg border border-amber-200 shadow-sm"
                >
                  Hab. {getRoomName(b.room_id)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* --- SECCIÓN 3: GESTIÓN DE RESERVAS --- */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100 mb-12">
          <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
            <Calendar className="text-rose-600" /> Historial de Reservas
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                  <th className="p-4">Estado</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Habitación</th>
                  <th className="p-4">Fechas</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Método</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {bookings?.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-stone-50 hover:bg-stone-50 transition"
                  >
                    <td className="p-4">
                      {booking.status === "pagado" ||
                      booking.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle size={12} /> PAGADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          <Clock size={12} /> PENDIENTE
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-stone-700">
                      {booking.client_name}
                      <div className="text-[10px] text-stone-400 font-normal">
                        {booking.client_email}
                      </div>
                    </td>
                    <td className="p-4 text-rose-900 font-medium">
                      {getRoomName(booking.room_id)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-xs font-bold">
                        <span className="text-emerald-600">
                          IN: {booking.check_in}
                        </span>
                        <span className="text-rose-600">
                          OUT: {booking.check_out}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-black text-stone-700">
                      S/ {booking.total_price}
                    </td>
                    <td className="p-4 capitalize text-stone-500 text-xs">
                      {booking.payment_method === "online"
                        ? "💳 Web"
                        : booking.payment_method}
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      {booking.status !== "pagado" &&
                        booking.status !== "approved" && (
                          <form action={markAsPaid}>
                            <input
                              type="hidden"
                              name="bookingId"
                              value={booking.id}
                            />
                            <button
                              title="Marcar Pagado"
                              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow-sm"
                            >
                              <DollarSign size={16} />
                            </button>
                          </form>
                        )}
                      <form action={deleteBooking}>
                        <input
                          type="hidden"
                          name="bookingId"
                          value={booking.id}
                        />
                        <button
                          title="Eliminar"
                          className="p-2 bg-stone-200 text-stone-500 rounded-lg hover:bg-rose-500 hover:text-white transition shadow-sm"
                        >
                          <X size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- SECCIÓN 4: EDITAR HABITACIONES --- */}
        <section>
          <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
            <HomeIcon className="text-rose-600" /> Gestionar Habitaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="bg-white p-6 rounded-[2rem] shadow-lg border border-stone-100 flex flex-col gap-4"
              >
                <div className="relative h-40 rounded-xl overflow-hidden bg-stone-200">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                    ID: {room.id}
                  </div>
                </div>
                <h3 className="font-bold text-xl text-rose-900">{room.name}</h3>
                <form action={updateRoom} className="flex flex-col gap-3">
                  <input type="hidden" name="roomId" value={room.id} />
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Precio (S/)
                    </label>
                    <input
                      name="price"
                      defaultValue={room.price_per_night}
                      type="number"
                      className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 font-bold text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={room.description}
                      rows={3}
                      className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Actualizar Foto
                    </label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                    />
                  </div>
                  <button className="bg-stone-900 text-white font-bold py-3 rounded-xl mt-2 hover:bg-rose-900 transition">
                    Guardar Cambios
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
