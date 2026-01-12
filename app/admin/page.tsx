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
  LayoutDashboard,
  Filter,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";

// --- ACCIONES DE SERVIDOR ---
async function markAsPaid(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");
  if (!bookingId) return;
  await supabase
    .from("bookings")
    .update({ status: "pagado" })
    .eq("id", bookingId);
  revalidatePath("/admin");
}

async function deleteBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");
  if (!bookingId) return;
  await supabase.from("bookings").delete().eq("id", bookingId);
  revalidatePath("/admin");
}

// --- UTILIDADES ---
const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    amount
  );

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
}

const formatTicket = (id: number) => {
  return (100 + id).toString().padStart(5, "0");
};

// --- COMPONENTE PRINCIPAL ---
export default async function AdminPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // 1. Corrección CRÍTICA para Next.js 15: Esperar los parámetros
  const searchParams = await props.searchParams;

  const today = new Date().toISOString().split("T")[0];

  // 2. Leemos las fechas (Si no existen, usa hoy)
  const dateFrom = searchParams.from || today;
  const dateTo = searchParams.to || today;

  // Referencia para los KPIs superiores (usa la fecha 'Desde')
  const filterDate = dateFrom;

  // 3. Carga de datos
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  // 4. LÓGICA DE FILTRADO ROBUSTA
  // Comparamos solo la parte de la fecha YYYY-MM-DD para evitar errores de horas
  const filteredBookings = allBookings?.filter((b) => {
    // Aseguramos que sea string y tomamos los primeros 10 caracteres (la fecha)
    const checkInDate = b.check_in
      ? b.check_in.toString().substring(0, 10)
      : "";
    return checkInDate >= dateFrom && checkInDate <= dateTo;
  });

  // --- KPIs y Lógica Auxiliar ---
  const occupiedCount =
    allBookings?.filter(
      (b) =>
        b.check_in &&
        b.check_out &&
        b.check_in <= filterDate &&
        b.check_out > filterDate
    ).length || 0;

  const arrivalsCount =
    allBookings?.filter((b) => b.check_in === filterDate).length || 0;

  const cleaningList =
    allBookings?.filter((b) => b.check_out === filterDate) || [];

  const salesOnDate =
    allBookings?.filter(
      (b) =>
        b.created_at &&
        b.created_at.startsWith(filterDate) &&
        (b.status === "pagado" || b.status === "approved")
    ) || [];

  const totalIncome = salesOnDate.reduce(
    (acc, b) => acc + (b.total_price || 0),
    0
  );
  const cashIncome = salesOnDate
    .filter((b) => b.payment_method === "recepcion")
    .reduce((acc, b) => acc + (b.total_price || 0), 0);
  const digitalIncome = salesOnDate
    .filter((b) => b.payment_method === "online")
    .reduce((acc, b) => acc + (b.total_price || 0), 0);

  const getRoomName = (id: number) =>
    rooms?.find((r) => r.id === id)?.name || "Habitación";
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
        paid: occupied.status === "pagado" || occupied.status === "approved",
      };
    return { status: "free", guest: null };
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-stone-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER CON FILTRO FUNCIONAL */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="bg-rose-900 text-white p-3 rounded-2xl shadow-lg shadow-rose-200">
              <LayoutDashboard size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-rose-950">
                Panel Kametza
              </h1>
              <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest">
                Control de Reservas
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            {/* IMPORTANTE: method="get" envía los datos a la URL */}
            <form className="flex items-end gap-2" method="get">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">
                  Desde
                </label>
                <input
                  type="date"
                  name="from"
                  defaultValue={dateFrom}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-rose-900 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">
                  Hasta
                </label>
                <input
                  type="date"
                  name="to"
                  defaultValue={dateTo}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-rose-900 outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-rose-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest h-[34px]"
              >
                Filtrar
              </button>
            </form>
            {allBookings && <DownloadButton data={allBookings} />}
          </div>
        </div>

        {/* INDICADOR DE LIMPIEZA DINÁMICO */}
        {cleaningList.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-white p-2 rounded-lg">
                <Brush size={18} />
              </div>
              <div>
                <p className="text-amber-900 font-bold text-sm">
                  Salidas para Limpieza: {cleaningList.length}
                </p>
                <p className="text-amber-700 text-[10px] uppercase font-medium">
                  Habitaciones:{" "}
                  {cleaningList.map((b) => getRoomNumber(b.room_id)).join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPIs OPERATIVOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
            <TrendingUp
              className="absolute right-4 top-4 text-white/5"
              size={80}
            />
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              Ventas del día ({filterDate})
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
                Llegadas ({filterDate})
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
                En Casa
              </p>
              <p className="text-3xl font-black">{occupiedCount}</p>
            </div>
          </div>
        </div>

        {/* MAPA DE HABITACIONES */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-10 bg-rose-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-stone-700 uppercase tracking-tight">
              Estado Actual
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
                      ? "bg-rose-950 text-white border-rose-950 shadow-lg"
                      : isCheckout
                      ? "bg-amber-100 text-amber-900 border-amber-200 border-dashed"
                      : "bg-white border-stone-100 text-stone-600"
                  }`}
                >
                  <span className="absolute -bottom-2 -right-2 text-7xl font-black tracking-tighter opacity-10 select-none">
                    {room.room_number || room.id}
                  </span>
                  <div className="z-10">
                    <p className="font-black text-[10px] uppercase tracking-widest truncate">
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
                        info.status === "free"
                          ? "bg-stone-100 text-stone-400"
                          : isCheckout
                          ? "bg-amber-500 text-white"
                          : info.paid
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
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

        {/* TABLA DE RESERVAS (HISTORIAL DE INGRESOS) */}
        <section className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden mb-10">
          <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-white">
            <div>
              <h2 className="font-bold text-xl text-stone-800">
                Historial de Ingresos
              </h2>
              <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                Del <span className="text-rose-700">{dateFrom}</span> al{" "}
                <span className="text-rose-700">{dateTo}</span>
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] bg-stone-50/50">
                  <th className="py-4 px-6">Ticket ID</th>
                  <th className="py-4 px-6">Huésped & Contacto</th>
                  <th className="py-4 px-4 text-center">Noches</th>
                  <th className="py-4 px-4 text-center">Hab</th>
                  <th className="py-4 px-4">Estancia</th>
                  <th className="py-4 px-4 text-right">Total</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-8 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredBookings?.map((booking) => {
                  const noches = calculateNights(
                    booking.check_in,
                    booking.check_out
                  );
                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-stone-50 hover:bg-rose-50/20 transition-colors group"
                    >
                      <td className="py-5 px-6 font-mono font-black text-rose-900 text-[11px]">
                        #{formatTicket(booking.id)}
                      </td>
                      <td className="py-5 px-6">
                        <div className="font-black text-stone-800 uppercase text-[11px] mb-1">
                          {booking.client_name}
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] font-bold text-stone-500">
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <Phone size={10} /> {booking.client_phone || "S/N"}
                          </span>
                          <span className="flex items-center gap-1.5 text-blue-600 lowercase font-medium">
                            <Mail size={10} /> {booking.client_email || "S/E"}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black text-[10px] border border-blue-100">
                          {noches} {noches === 1 ? "Día" : "Días"}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="font-black text-stone-800">
                          #{getRoomNumber(booking.room_id)}
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col font-bold text-[9px] uppercase tracking-tighter">
                          <span className="text-emerald-600">
                            IN: {booking.check_in}
                          </span>
                          <span className="text-rose-600">
                            OUT: {booking.check_out}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-right font-black text-stone-900">
                        {formatMoney(booking.total_price)}
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                            booking.status === "pagado" ||
                            booking.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {booking.status === "pagado" ||
                          booking.status === "approved"
                            ? "Pagado"
                            : "Pendiente"}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-center">
                        <div className="flex gap-2 justify-center">
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
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-[9px] uppercase hover:bg-emerald-700"
                                >
                                  <DollarSign size={12} /> Cobrar
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
                              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-400 rounded-xl font-bold text-[9px] uppercase hover:border-rose-200 hover:text-rose-600"
                            >
                              <X size={12} /> Anular
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBookings?.length === 0 && (
              <div className="p-12 text-center text-stone-400 italic text-sm">
                No se encontraron reservas que ingresen entre el {dateFrom} y el{" "}
                {dateTo}.
              </div>
            )}
          </div>
        </section>

        {/* INVENTARIO */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 w-10 bg-stone-800 rounded-full"></div>
            <h2 className="text-lg font-bold text-stone-700 uppercase tracking-tight">
              Inventario
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-[2.5rem] shadow-lg border border-stone-100 overflow-hidden group"
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-xl text-[10px] font-black">
                    #{room.room_number || room.id}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-lg text-stone-800 mb-4 uppercase">
                    {room.name}
                  </h3>
                  <form action={updateRoom} className="space-y-4">
                    <input type="hidden" name="roomId" value={room.id} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 block mb-1">
                          Precio
                        </label>
                        <input
                          name="price"
                          defaultValue={room.price_per_night}
                          type="number"
                          className="w-full p-3 bg-stone-50 rounded-xl border border-stone-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-stone-400 block mb-1">
                          Imagen URL
                        </label>
                        <input
                          name="image"
                          type="text"
                          defaultValue={room.image_url}
                          className="w-full p-3 bg-stone-50 rounded-xl border border-stone-100 text-[10px]"
                        />
                      </div>
                    </div>
                    <button className="w-full bg-stone-900 text-white font-black py-4 rounded-xl hover:bg-rose-900 transition-all text-[10px] uppercase tracking-widest">
                      Guardar Cambios
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
