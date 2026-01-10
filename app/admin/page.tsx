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
  LayoutDashboard,
  Filter,
} from "lucide-react";

// --- ACCIONES DE SERVIDOR ---
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];
  const filterDate = searchParams.date || today;

  // 1. ESTADÍSTICAS OPERATIVAS (Basadas en la fecha seleccionada o hoy)
  const occupiedCount =
    allBookings?.filter(
      (b) => b.check_in <= filterDate && b.check_out > filterDate
    ).length || 0;
  const arrivalsCount =
    allBookings?.filter((b) => b.check_in === filterDate).length || 0;
  const cleaningList =
    allBookings?.filter((b) => b.check_out === filterDate) || [];

  // 2. CIERRE DE CAJA (Específico de la fecha seleccionada)
  const salesOnDate =
    allBookings?.filter(
      (b) =>
        b.created_at.startsWith(filterDate) &&
        (b.status === "pagado" || b.status === "approved")
    ) || [];

  const totalIncome = salesOnDate.reduce((acc, b) => acc + b.total_price, 0);
  const cashIncome = salesOnDate
    .filter((b) => b.payment_method === "recepcion")
    .reduce((acc, b) => acc + b.total_price, 0);
  const digitalIncome = salesOnDate
    .filter((b) => b.payment_method === "online")
    .reduce((acc, b) => acc + b.total_price, 0);

  const getRoomNumber = (id: number) => {
    const r = rooms?.find((r) => r.id === id);
    return r?.room_number || r?.id || "#";
  };

  const getRoomStatus = (roomId: number) => {
    const leaving = allBookings?.find(
      (b) => b.room_id === roomId && b.check_out === filterDate
    );
    if (leaving) return { status: "checkout", guest: leaving.client_name };
    const occupied = allBookings?.find(
      (b) =>
        b.room_id === roomId &&
        b.check_in <= filterDate &&
        b.check_out > filterDate
    );
    if (occupied)
      return {
        status: "occupied",
        guest: occupied.client_name,
        paid: occupied.status === "pagado",
      };
    return { status: "free", guest: null };
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-stone-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER & FILTRO */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-rose-900 text-white p-3 rounded-2xl shadow-lg shadow-rose-200">
              <LayoutDashboard size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-rose-950">
                Panel Kametza
              </h1>
              <form className="flex items-center gap-2 mt-1">
                <Filter size={12} className="text-stone-400" />
                <input
                  type="date"
                  name="date"
                  defaultValue={filterDate}
                  onChange={(e) => e.target.form?.requestSubmit()}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-rose-800 outline-none cursor-pointer"
                />
              </form>
            </div>
          </div>
          <div className="flex gap-2">
            {allBookings && <DownloadButton data={allBookings} />}
          </div>
        </div>

        {/* ALERTA DE LIMPIEZA */}
        {cleaningList.length > 0 && filterDate === today && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-white p-2 rounded-lg">
                <Brush size={18} />
              </div>
              <div>
                <p className="text-amber-900 font-bold text-sm">
                  Atención: {cleaningList.length} salidas hoy
                </p>
                <p className="text-amber-700 text-[10px] uppercase font-medium">
                  Habitaciones:{" "}
                  {cleaningList.map((b) => getRoomNumber(b.room_id)).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
            <TrendingUp
              className="absolute right-4 top-4 text-white/5"
              size={80}
            />
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">
              Cierre de Caja ({filterDate})
            </p>
            <p className="text-4xl font-black">{formatMoney(totalIncome)}</p>
            <div className="flex gap-4 mt-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-[9px] text-stone-500 uppercase font-bold">
                  Efectivo
                </p>
                <p className="font-bold text-emerald-400">
                  {formatMoney(cashIncome)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-stone-500 uppercase font-bold">
                  Digital
                </p>
                <p className="font-bold text-sky-400">
                  {formatMoney(digitalIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
              <LogIn size={30} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                Check-In
              </p>
              <p className="text-3xl font-black">{arrivalsCount}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <BedDouble size={30} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                Ocupadas
              </p>
              <p className="text-3xl font-black">{occupiedCount}</p>
            </div>
          </div>
        </div>

        {/* MAPA VISUAL */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-10 bg-rose-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-stone-700 uppercase tracking-tight">
              Estado de Habitaciones
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rooms?.map((room) => {
              const info = getRoomStatus(room.id);
              const isOccupied = info.status === "occupied";
              const isCheckout = info.status === "checkout";

              return (
                <div
                  key={room.id}
                  className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between h-32 relative overflow-hidden ${
                    isOccupied
                      ? "bg-rose-950 text-white border-rose-950 shadow-lg shadow-rose-100"
                      : isCheckout
                      ? "bg-amber-100 text-amber-900 border-amber-200 border-dashed"
                      : "bg-white border-stone-100 text-stone-600"
                  }`}
                >
                  <span
                    className={`absolute -bottom-2 -right-2 text-7xl font-black tracking-tighter opacity-10 select-none`}
                  >
                    {room.room_number || room.id}
                  </span>
                  <div className="z-10">
                    <p className="font-black text-[10px] uppercase tracking-widest">
                      {room.name}
                    </p>
                    {info.guest && (
                      <p className="text-[10px] mt-1 font-medium italic opacity-80 truncate">
                        {info.guest}
                      </p>
                    )}
                  </div>
                  <div className="z-10">
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                        isOccupied
                          ? info.paid
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {info.status === "free"
                        ? "Libre"
                        : isCheckout
                        ? "Salida"
                        : info.paid
                        ? "Pagado"
                        : "Pendiente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TABLA DE RESERVAS */}
        <section className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden mb-10">
          <div className="p-8 border-b border-stone-50 flex justify-between items-center">
            <h2 className="font-bold text-xl text-stone-800">
              Historial Reciente
            </h2>
            <span className="text-[10px] font-black bg-stone-100 px-3 py-1 rounded-full text-stone-500 uppercase tracking-widest">
              Mostrando: {filterDate}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] bg-stone-50/50">
                  <th className="py-4 px-8">Huésped</th>
                  <th className="py-4 px-4 text-center">Hab</th>
                  <th className="py-4 px-4">Estancia</th>
                  <th className="py-4 px-4 text-right">Total</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-8 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {allBookings?.slice(0, 15).map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-stone-50 hover:bg-rose-50/30 transition-colors group"
                  >
                    <td className="py-5 px-8">
                      <div className="font-black text-stone-800 uppercase tracking-tight">
                        {booking.client_name}
                      </div>
                      <div className="text-[9px] text-stone-400 font-bold uppercase">
                        {booking.document_type}: {booking.document_number}
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className="font-black text-rose-900 bg-rose-50 px-2 py-1 rounded-lg">
                        #{getRoomNumber(booking.room_id)}
                      </span>
                    </td>
                    <td className="py-5 px-4">
                      <div className="font-bold text-[10px] flex items-center gap-1">
                        <span className="text-emerald-600">
                          {formatDate(booking.check_in)}
                        </span>
                        <span className="text-stone-300">→</span>
                        <span className="text-rose-600">
                          {formatDate(booking.check_out)}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right font-black text-stone-900">
                      {formatMoney(booking.total_price)}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {booking.status === "pagado" ||
                      booking.status === "approved" ? (
                        <CheckCircle
                          size={18}
                          className="text-emerald-500 mx-auto"
                        />
                      ) : (
                        <Clock
                          size={18}
                          className="text-amber-400 mx-auto animate-pulse"
                        />
                      )}
                    </td>
                    <td className="py-5 px-8 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
                                className="p-2 bg-emerald-500 text-white rounded-xl shadow-md"
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
                            className="p-2 bg-stone-100 text-stone-400 rounded-xl hover:bg-rose-600 hover:text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* GESTIÓN DE HABITACIONES */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 w-10 bg-stone-800 rounded-full"></div>
            <h2 className="text-lg font-bold text-stone-700 uppercase tracking-tight">
              Inventario de Habitaciones
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-[2.5rem] shadow-lg border border-stone-100 overflow-hidden group"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-2xl text-[10px] font-black shadow-sm">
                    #{room.room_number || room.id}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-black text-xl text-stone-800 mb-6 uppercase tracking-tighter">
                    {room.name}
                  </h3>
                  <form action={updateRoom} className="space-y-4">
                    <input type="hidden" name="roomId" value={room.id} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-2">
                          Precio Noche
                        </label>
                        <input
                          name="price"
                          defaultValue={room.price_per_night}
                          type="number"
                          className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-100 font-black text-rose-900 focus:ring-2 ring-rose-100 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest block mb-2">
                          Imagen URL
                        </label>
                        <input
                          name="image"
                          type="text"
                          defaultValue={room.image_url}
                          className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-100 text-[10px] outline-none"
                        />
                      </div>
                    </div>
                    <button className="w-full bg-stone-900 text-white font-black py-5 rounded-2xl hover:bg-rose-900 transition-all shadow-xl shadow-stone-200 text-[10px] uppercase tracking-[0.2em]">
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
