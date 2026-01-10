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
  Wallet,
  CreditCard,
  Coins,
  AlertCircle,
} from "lucide-react";

// --- ACCIONES DE SERVIDOR (Mantenidas) ---
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

// --- UTILIDADES ---
function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    amount
  );

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date
    .toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
    .replace(".", "");
};

export default async function AdminPage() {
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  // 1. ESTADÍSTICAS GENERALES
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

  // 2. LÓGICA DE CIERRE DE CAJA
  const salesToday =
    bookings?.filter(
      (b) =>
        b.created_at.startsWith(today) &&
        (b.status === "pagado" || b.status === "approved")
    ) || [];

  const totalIncome = salesToday.reduce((acc, b) => acc + b.total_price, 0);
  const cashIncome = salesToday
    .filter((b) => b.payment_method === "recepcion")
    .reduce((acc, b) => acc + b.total_price, 0);
  const digitalIncome = salesToday
    .filter((b) => b.payment_method === "online")
    .reduce((acc, b) => acc + b.total_price, 0);

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
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-rose-900 text-white p-3 rounded-2xl shadow-lg">
              <LayoutDashboard size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-rose-950">
                Panel Administrativo
              </h1>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">
                {today}
              </p>
            </div>
          </div>
          {bookings && <DownloadButton data={bookings} />}
        </div>

        {/* ALERTA DE LIMPIEZA DINÁMICA */}
        {cleaningCount > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-white p-2 rounded-lg">
                <Brush size={18} />
              </div>
              <div>
                <p className="text-amber-900 font-bold text-sm">
                  Habitaciones por limpiar hoy: {cleaningCount}
                </p>
                <p className="text-amber-700 text-[10px] font-medium">
                  Salidas de:{" "}
                  {cleaningList.map((b) => b.client_name).join(", ")}
                </p>
              </div>
            </div>
            <AlertCircle className="text-amber-400" size={20} />
          </div>
        )}

        {/* 1. KPIs OPERATIVOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-blue-500 flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <HomeIcon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Ocupación
              </p>
              <p className="text-2xl font-black text-blue-900">
                {occupiedCount}{" "}
                <span className="text-sm text-blue-300">/ {rooms?.length}</span>
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-purple-500 flex items-center gap-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <LogIn size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Check-In Hoy
              </p>
              <p className="text-2xl font-black text-purple-900">
                {arrivalsCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-emerald-500 flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Confirmadas
              </p>
              <p className="text-2xl font-black text-emerald-900">
                {confirmedCount}
              </p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-amber-500 flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Brush size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                Limpieza
              </p>
              <p className="text-2xl font-black text-amber-900">
                {cleaningCount}
              </p>
            </div>
          </div>
        </div>

        {/* 2. SECCIÓN FINANCIERA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <TrendingUp
              className="absolute right-4 top-4 text-white/10"
              size={80}
            />
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              Cierre de Caja Diario
            </p>
            <p className="text-4xl font-black">{formatMoney(totalIncome)}</p>
            <p className="text-[10px] text-stone-500 mt-2 font-mono italic">
              Ventas generadas hoy
            </p>
          </div>

          <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Coins size={28} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                Efectivo (Recepción)
              </p>
              <p className="text-2xl font-black text-stone-800">
                {formatMoney(cashIncome)}
              </p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl">
              <CreditCard size={28} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                Banco (Web/Yape)
              </p>
              <p className="text-2xl font-black text-stone-800">
                {formatMoney(digitalIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* 3. MAPA DE HABITACIONES */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
            <Bed className="text-rose-600" size={20} /> Mapa de Ocupación
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rooms?.map((room) => {
              const info = getRoomStatus(room.id);
              let cardClass = "bg-white border-stone-200 text-stone-600";
              let numClass = "text-stone-100";
              if (info.status === "occupied") {
                cardClass =
                  "bg-rose-900 text-white border-rose-950 shadow-rose-200 shadow-lg";
                numClass = "text-rose-800 opacity-40";
              } else if (info.status === "checkout") {
                cardClass =
                  "bg-amber-100 text-amber-900 border-amber-300 border-dashed";
                numClass = "text-amber-200";
              }
              return (
                <div
                  key={room.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between h-28 relative overflow-hidden transition-all hover:-translate-y-1 ${cardClass}`}
                >
                  <span
                    className={`absolute -bottom-2 -right-1 text-6xl font-black tracking-tighter select-none ${numClass}`}
                  >
                    {room.room_number || room.id}
                  </span>
                  <div className="z-10">
                    <span className="font-bold text-[11px] uppercase tracking-wider block leading-tight">
                      {room.name}
                    </span>
                    {info.guest && (
                      <p className="text-[10px] font-medium mt-1 truncate opacity-90">
                        {info.guest}
                      </p>
                    )}
                  </div>
                  <div className="z-10">
                    {info.status === "free" ? (
                      <span className="text-[8px] font-black uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-400">
                        Libre
                      </span>
                    ) : (
                      <span
                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          info.paid
                            ? "bg-emerald-500 text-white"
                            : "bg-white text-stone-800"
                        }`}
                      >
                        {info.status === "checkout"
                          ? "Salida Hoy"
                          : info.paid
                          ? "Pagado"
                          : "Pendiente"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. TABLA DE RESERVAS (MEJORADA) */}
        <section className="bg-white p-6 rounded-[2rem] shadow-xl border border-stone-100 mb-8 overflow-hidden">
          <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2 italic">
            <Calendar className="text-rose-900" size={22} /> Historial de
            Movimientos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-50">
                  <th className="pb-4 px-2 text-center">Estado</th>
                  <th className="pb-4 px-4">Huésped</th>
                  <th className="pb-4 px-4">Habitación</th>
                  <th className="pb-4 px-4">Estancia</th>
                  <th className="pb-4 px-4 text-right">Total</th>
                  <th className="pb-4 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {bookings?.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-stone-50 hover:bg-stone-50/80 transition even:bg-stone-50/30"
                  >
                    <td className="py-4 px-2 text-center">
                      {booking.status === "pagado" ||
                      booking.status === "approved" ? (
                        <div className="flex justify-center">
                          <CheckCircle size={18} className="text-emerald-500" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <Clock
                            size={18}
                            className="text-amber-500 animate-pulse"
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-black text-stone-800 uppercase text-[11px]">
                        {booking.client_name}
                      </div>
                      <div className="text-[9px] text-stone-400 font-bold">
                        {booking.document_type}: {booking.document_number}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-rose-900 bg-rose-50 px-2 py-1 rounded-lg">
                        #{getRoomNumber(booking.room_id)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 font-bold text-[10px]">
                        <span className="text-emerald-600">
                          {formatDate(booking.check_in)}
                        </span>
                        <span className="text-stone-300">→</span>
                        <span className="text-rose-600">
                          {formatDate(booking.check_out)}
                        </span>
                        <span className="ml-2 bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded text-[9px]">
                          {calculateNights(booking.check_in, booking.check_out)}
                          n
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-stone-900 text-sm">
                      {formatMoney(booking.total_price)}
                    </td>
                    <td className="py-4 px-4 flex gap-2 justify-center">
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
                              className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-100"
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
                          className="p-2 bg-white border border-stone-100 text-stone-300 rounded-xl hover:bg-rose-600 hover:text-white transition shadow-sm"
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

        {/* 5. GESTIÓN DE HABITACIONES */}
        <section>
          <h2 className="text-xl font-bold text-stone-700 mb-6 flex items-center gap-2">
            <HomeIcon className="text-rose-600" size={20} /> Inventario de
            Habitaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-[2rem] shadow-lg border border-stone-100 overflow-hidden group"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-black shadow-sm">
                    #{room.room_number || room.id}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-stone-800 mb-4">
                    {room.name}
                  </h3>
                  <form action={updateRoom} className="space-y-4">
                    <input type="hidden" name="roomId" value={room.id} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                          Tarifa (S/)
                        </label>
                        <input
                          name="price"
                          defaultValue={room.price_per_night}
                          type="number"
                          className="w-full p-3 bg-stone-50 rounded-2xl border border-stone-100 font-black text-rose-900 focus:ring-2 focus:ring-rose-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                          Imagen URL
                        </label>
                        <input
                          name="image"
                          type="text"
                          defaultValue={room.image_url}
                          className="w-full p-3 bg-stone-50 rounded-2xl border border-stone-100 text-[10px] focus:ring-2 focus:ring-rose-500/20 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-1">
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        defaultValue={room.description}
                        rows={2}
                        className="w-full p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs focus:ring-2 focus:ring-rose-500/20 outline-none resize-none"
                      />
                    </div>
                    <button className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl hover:bg-rose-900 transition-all shadow-xl shadow-stone-200 text-xs uppercase tracking-widest">
                      Actualizar Habitación
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
