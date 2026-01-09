import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { updateRoom } from "../actions";
import DownloadButton from "./DownloadButton";
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
  BedDouble,
  AlertCircle,
  Bed,
} from "lucide-react";

// --- SERVER ACTIONS ---
async function markAsPaid(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");
  const { error } = await supabase
    .from("bookings")
    .update({ status: "pagado" })
    .eq("id", bookingId);
  if (error) console.error(error);
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

  // 2. ESTADÍSTICAS
  const today = new Date().toISOString().split("T")[0];

  const occupiedCount =
    bookings?.filter((b) => b.check_in <= today && b.check_out > today)
      .length || 0;
  const arrivalsCount =
    bookings?.filter((b) => b.check_in === today).length || 0;
  const confirmedCount =
    bookings?.filter((b) => b.status === "pagado" || b.status === "approved")
      .length || 0;
  const cleaningList = bookings?.filter((b) => b.check_out === today) || [];
  const cleaningCount = cleaningList.length;

  const getRoomName = (id: number) =>
    rooms?.find((r) => r.id === id)?.name || "Habitación desconocida";

  // Función para saber el estado de UNA habitación específica hoy
  const getRoomStatus = (roomId: number) => {
    // 1. ¿Sale hoy? (Limpieza)
    const leaving = bookings?.find(
      (b) => b.room_id === roomId && b.check_out === today
    );
    if (leaving) return { status: "checkout", guest: leaving.client_name };

    // 2. ¿Está ocupada hoy?
    const occupied = bookings?.find(
      (b) => b.room_id === roomId && b.check_in <= today && b.check_out > today
    );
    if (occupied)
      return {
        status: "occupied",
        guest: occupied.client_name,
        paid: occupied.status === "pagado" || occupied.status === "approved",
      };

    // 3. Libre
    return { status: "free", guest: null };
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-stone-800 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-4xl font-serif font-bold text-rose-950 flex items-center gap-3">
            <User className="bg-rose-900 text-white p-2 rounded-xl" size={48} />
            Panel de Control
          </h1>
          {bookings && <DownloadButton data={bookings} />}
        </div>

        {/* --- 1. KPIs (RESUMEN) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border-b-4 border-blue-500 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BedDouble size={80} />
            </div>
            <div className="p-4 bg-blue-100 text-blue-700 rounded-2xl">
              <HomeIcon size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
                Ocupadas
              </p>
              <p className="text-4xl font-black text-blue-900">
                {occupiedCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border-b-4 border-purple-500 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <LogIn size={80} />
            </div>
            <div className="p-4 bg-purple-100 text-purple-700 rounded-2xl">
              <LogIn size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
                Llegadas
              </p>
              <p className="text-4xl font-black text-purple-900">
                {arrivalsCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border-b-4 border-emerald-500 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle size={80} />
            </div>
            <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl">
              <CheckCircle size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
                Confirmadas
              </p>
              <p className="text-4xl font-black text-emerald-900">
                {confirmedCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border-b-4 border-amber-500 flex items-center gap-4 relative overflow-hidden">
            {cleaningCount > 0 && (
              <span className="absolute top-4 right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
            <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl">
              <Brush size={32} />
            </div>
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
                Salidas / Limpieza
              </p>
              <p className="text-4xl font-black text-amber-900">
                {cleaningCount}
              </p>
            </div>
          </div>
        </div>

        {/* --- NUEVO: MAPA DE HABITACIONES (GRID VISUAL) --- */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
            <Bed className="text-rose-600" /> Mapa de Habitaciones (Hoy)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {rooms?.map((room) => {
              const info = getRoomStatus(room.id);

              // Definir colores según estado
              let cardClass = "bg-white border-stone-200 text-stone-600"; // Libre
              let statusText = "Libre";
              let icon = <CheckCircle size={16} className="text-emerald-400" />;

              if (info.status === "occupied") {
                cardClass = "bg-rose-900 text-white border-rose-950"; // Ocupada
                statusText = info.paid ? "Pagado" : "Pendiente Pago";
                icon = <User size={16} className="text-rose-200" />;
              } else if (info.status === "checkout") {
                cardClass = "bg-amber-100 text-amber-900 border-amber-300"; // Salida
                statusText = "Salida Hoy";
                icon = <LogOut size={16} className="text-amber-600" />;
              }

              return (
                <div
                  key={room.id}
                  className={`p-4 rounded-2xl border-2 shadow-sm flex flex-col justify-between h-32 transition hover:scale-105 ${cardClass}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-black text-lg leading-tight">
                      {room.name}
                    </span>
                    {icon}
                  </div>
                  <div>
                    {info.status === "free" ? (
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                        Disponible
                      </span>
                    ) : (
                      <>
                        <p className="text-sm font-bold truncate">
                          {info.guest}
                        </p>
                        <p className="text-[10px] uppercase font-bold opacity-70">
                          {statusText}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- ALERTA DE LIMPIEZA DETALLADA --- */}
        {cleaningCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-10 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="bg-amber-500 text-white p-4 rounded-full shadow-lg animate-pulse">
              <Brush size={32} />
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="font-bold text-amber-900 text-xl mb-1">
                ⚠️ Prioridad: Limpieza
              </h3>
              <p className="text-amber-800 text-sm opacity-80">
                Habitaciones que se liberan hoy ({today}).
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {cleaningList.map((b) => (
                <div
                  key={b.id}
                  className="bg-white text-amber-900 font-bold px-6 py-3 rounded-xl border-2 border-amber-100 shadow-sm flex items-center gap-2"
                >
                  <HomeIcon size={16} /> {getRoomName(b.room_id)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- HISTORIAL (TABLA) --- */}
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
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle size={12} /> PAGADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
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
                      <div className="flex flex-col text-xs font-bold gap-1">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                          IN: {booking.check_in}
                        </span>
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md w-fit">
                          OUT: {booking.check_out}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-black text-stone-700 text-base">
                      S/ {booking.total_price}
                    </td>
                    <td className="p-4 capitalize text-stone-500 text-xs font-bold">
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
                              type="submit"
                              title="Confirmar Pago"
                              className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition shadow-lg hover:-translate-y-1"
                            >
                              <DollarSign size={18} />
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
                          type="submit"
                          title="Eliminar"
                          className="p-2 bg-white border border-stone-200 text-stone-400 rounded-xl hover:bg-rose-500 hover:text-white transition shadow-sm hover:-translate-y-1"
                        >
                          <X size={18} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- EDITAR HABITACIONES --- */}
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
                <div className="relative h-40 rounded-xl overflow-hidden bg-stone-200 group">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                </div>
                <h3 className="font-bold text-xl text-rose-900">{room.name}</h3>
                <form action={updateRoom} className="flex flex-col gap-3">
                  <input type="hidden" name="roomId" value={room.id} />
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Precio
                    </label>
                    <input
                      name="price"
                      defaultValue={room.price_per_night}
                      type="number"
                      className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Desc
                    </label>
                    <textarea
                      name="description"
                      defaultValue={room.description}
                      rows={2}
                      className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Foto
                    </label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="w-full text-xs text-stone-500"
                    />
                  </div>
                  <button className="bg-stone-900 text-white font-bold py-3 rounded-xl mt-2 hover:bg-rose-900 transition shadow-lg">
                    Guardar
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
