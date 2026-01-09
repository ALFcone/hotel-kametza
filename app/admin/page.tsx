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
  Bed,
} from "lucide-react";

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

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default async function AdminPage() {
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

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
    rooms?.find((r) => r.id === id)?.name || "Habitación";
  const getRoomNumber = (id: number) => {
    const r = rooms?.find((r) => r.id === id);
    return r?.room_number || r?.id || "#";
  };

  const getRoomStatus = (roomId: number) => {
    const leaving = bookings?.find(
      (b) => b.room_id === roomId && b.check_out === today
    );
    if (leaving) return { status: "checkout", guest: leaving.client_name };
    const occupied = bookings?.find(
      (b) => b.room_id === roomId && b.check_in <= today && b.check_out > today
    );
    if (occupied)
      return {
        status: "occupied",
        guest: occupied.client_name,
        paid: occupied.status === "pagado" || occupied.status === "approved",
      };
    return { status: "free", guest: null };
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-stone-800 p-4 md:p-8 font-sans">
      {" "}
      {/* Padding reducido */}
      <div className="max-w-7xl mx-auto">
        {/* HEADER MÁS COMPACTO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-serif font-bold text-rose-950 flex items-center gap-2">
            {" "}
            {/* Texto más pequeño */}
            <User className="bg-rose-900 text-white p-2 rounded-lg" size={40} />
            Panel de Control
          </h1>
          {bookings && <DownloadButton data={bookings} />}
        </div>

        {/* --- 1. KPIs (RESUMEN) COMPACTOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {" "}
          {/* Gap reducido */}
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-blue-500 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <BedDouble size={60} />
            </div>
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <HomeIcon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Ocupadas
              </p>
              <p className="text-3xl font-black text-blue-900">
                {occupiedCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-purple-500 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <LogIn size={60} />
            </div>
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <LogIn size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Llegadas
              </p>
              <p className="text-3xl font-black text-purple-900">
                {arrivalsCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-emerald-500 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <CheckCircle size={60} />
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Confirmadas
              </p>
              <p className="text-3xl font-black text-emerald-900">
                {confirmedCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-amber-500 flex items-center gap-3 relative overflow-hidden">
            {cleaningCount > 0 && (
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Brush size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Limpieza
              </p>
              <p className="text-3xl font-black text-amber-900">
                {cleaningCount}
              </p>
            </div>
          </div>
        </div>

        {/* --- 2. MAPA DE HABITACIONES --- */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-stone-700 flex items-center gap-2">
              <Bed className="text-rose-600" size={20} /> Mapa (Hoy)
            </h2>
            <div className="flex gap-3 text-[10px] font-bold uppercase bg-white px-3 py-1.5 rounded-lg shadow-sm border border-stone-200">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-white border border-stone-300"></div>{" "}
                Libre
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-900"></div> Ocupada
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-100 border border-amber-300"></div>{" "}
                Limpieza
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rooms?.map((room) => {
              const info = getRoomStatus(room.id);
              let cardClass = "bg-white border-stone-200 text-stone-600";
              let numClass = "text-stone-300";
              let icon = null;

              if (info.status === "occupied") {
                cardClass = "bg-rose-900 text-white border-rose-950";
                numClass = "text-rose-800 opacity-50";
                icon = <User size={14} className="text-rose-200" />;
              } else if (info.status === "checkout") {
                cardClass = "bg-amber-100 text-amber-900 border-amber-300";
                numClass = "text-amber-800 opacity-20";
                icon = <LogOut size={14} className="text-amber-600" />;
              }

              return (
                <div
                  key={room.id}
                  className={`p-3 rounded-xl border shadow-sm flex flex-col justify-between h-24 relative overflow-hidden transition hover:scale-105 ${cardClass}`}
                >
                  <span
                    className={`absolute -bottom-2 -right-1 text-5xl font-black tracking-tighter select-none ${numClass}`}
                  >
                    {room.room_number || room.id}
                  </span>
                  <div className="flex justify-between items-start z-10">
                    <span className="font-bold text-xs leading-tight truncate w-full">
                      {room.name}
                    </span>
                    {icon}
                  </div>
                  <div className="z-10 mt-auto">
                    {info.status === "free" ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                        Libre
                      </span>
                    ) : (
                      <>
                        <p className="text-[10px] font-bold truncate mb-0.5">
                          {info.guest}
                        </p>
                        {info.status === "occupied" && (
                          <span
                            className={`text-[8px] uppercase font-bold px-1 py-0.5 rounded ${
                              info.paid
                                ? "bg-emerald-500/20 text-emerald-100"
                                : "bg-white/20 text-white"
                            }`}
                          >
                            {info.paid ? "Pagado" : "Pendiente"}
                          </span>
                        )}
                        {info.status === "checkout" && (
                          <span className="text-[8px] uppercase font-bold text-amber-700">
                            Salida Hoy
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- 3. TABLA DE RESERVAS (COMPACTA) --- */}
        <section className="bg-white p-6 rounded-3xl shadow-lg border border-stone-100 mb-8">
          <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
            <Calendar className="text-rose-600" size={20} /> Reservas Recientes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                  <th className="p-3">Estado</th>
                  <th className="p-3">Cliente / DNI</th>
                  <th className="p-3">Habitación</th>
                  <th className="p-3">Fechas</th>
                  <th className="p-3">Noches</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Método</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {bookings?.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-stone-50 hover:bg-stone-50 transition"
                  >
                    <td className="p-3">
                      {booking.status === "pagado" ||
                      booking.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle size={10} /> PAGADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <Clock size={10} /> PENDIENTE
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-stone-700">
                        {booking.client_name}
                      </div>
                      {booking.document_number && (
                        <div className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded w-fit mt-0.5 border border-rose-100 uppercase">
                          {booking.document_type}: {booking.document_number}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-rose-900 font-medium">
                      <span className="font-bold mr-1">
                        #{getRoomNumber(booking.room_id)}
                      </span>{" "}
                      {getRoomName(booking.room_id)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-emerald-600 font-bold">
                          IN: {booking.check_in}
                        </span>
                        <span className="text-rose-600 font-bold">
                          OUT: {booking.check_out}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-stone-500 font-bold">
                      {calculateNights(booking.check_in, booking.check_out)} n.
                    </td>
                    <td className="p-3 font-black text-stone-700">
                      S/ {booking.total_price}
                    </td>
                    <td className="p-3 capitalize text-stone-500 font-bold">
                      {booking.payment_method === "online"
                        ? "Web"
                        : booking.payment_method}
                    </td>
                    <td className="p-3 flex gap-1 justify-center">
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
                              className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow"
                            >
                              <DollarSign size={14} />
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
                          className="p-1.5 bg-white border border-stone-200 text-stone-400 rounded-lg hover:bg-rose-500 hover:text-white transition shadow"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- 4. EDITAR HABITACIONES (COMPACTO) --- */}
        <section>
          <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
            <HomeIcon className="text-rose-600" size={20} /> Habitaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="bg-white p-4 rounded-2xl shadow-md border border-stone-100 flex flex-col gap-3"
              >
                <div className="relative h-32 rounded-lg overflow-hidden bg-stone-200 group">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-white/90 text-stone-800 font-black px-2 py-0.5 rounded text-xs">
                    #{room.room_number || room.id}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-rose-900 leading-tight">
                  {room.name}
                </h3>
                <form action={updateRoom} className="flex flex-col gap-2">
                  <input type="hidden" name="roomId" value={room.id} />
                  <div className="flex gap-2">
                    <div className="w-1/3">
                      <label className="text-[10px] font-bold uppercase text-stone-400">
                        Precio
                      </label>
                      <input
                        name="price"
                        defaultValue={room.price_per_night}
                        type="number"
                        className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 font-bold text-sm"
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="text-[10px] font-bold uppercase text-stone-400">
                        Foto
                      </label>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        className="w-full text-[10px] text-stone-500 mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-400">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={room.description}
                      rows={2}
                      className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs resize-none"
                    />
                  </div>
                  <button className="bg-stone-900 text-white font-bold py-2 rounded-lg mt-1 hover:bg-rose-900 transition text-xs shadow">
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
