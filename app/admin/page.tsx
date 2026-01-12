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

export default async function AdminPage(props: any) {
  const searchParams = props.searchParams;
  const today = new Date().toISOString().split("T")[0];

  // Filtro de Rango
  const dateFrom = searchParams?.from || today;
  const dateTo = searchParams?.to || today;

  const { data: rooms } = await supabase.from("rooms").select("*").order("id");
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  // Filtrado de Reservas por Rango
  const filteredBookings = allBookings?.filter((b) => {
    return b.check_in >= dateFrom && b.check_in <= dateTo;
  });

  const getRoomNumber = (id: number) => {
    const r = rooms?.find((r) => r.id === id);
    return r?.room_number || r?.id || "#";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-stone-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER CON FILTRO DE RANGO PROFESIONAL */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="bg-rose-900 text-white p-4 rounded-3xl shadow-lg shadow-rose-200">
              <LayoutDashboard size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-rose-950 text-center lg:text-left">
                Panel Kametza
              </h1>
              <p className="text-stone-400 text-[10px] uppercase font-black tracking-[0.2em]">
                Control Maestro
              </p>
            </div>
          </div>

          <form className="flex flex-wrap items-end gap-3 justify-center">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2">
                Desde
              </label>
              <input
                type="date"
                name="from"
                defaultValue={dateFrom}
                className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 ring-rose-200"
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
                className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 ring-rose-200"
              />
            </div>
            <button
              type="submit"
              className="bg-rose-950 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-800 transition-all"
            >
              Filtrar Rango
            </button>
          </form>
        </div>

        {/* TABLA DE RESERVAS MAESTRA */}
        <section className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden mb-10">
          <div className="p-8 border-b border-stone-50">
            <h2 className="font-bold text-xl text-stone-800">
              Historial de Ingresos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] bg-stone-50/50">
                  <th className="py-4 px-8">Ticket ID</th>
                  <th className="py-4 px-4">Huésped / Contacto</th>
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
                      <td className="py-5 px-8 font-mono font-black text-rose-900">
                        #{formatTicket(booking.id)}
                      </td>
                      <td className="py-5 px-4">
                        <div className="font-black text-stone-800 uppercase text-[11px] mb-1">
                          {booking.client_name}
                        </div>
                        <div className="flex flex-col gap-0.5 text-[9px] font-bold text-stone-500">
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {booking.client_phone}
                          </span>
                          <span className="flex items-center gap-1 text-blue-500">
                            <Mail size={10} /> {booking.client_email}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-black text-[10px]">
                          {noches} {noches === 1 ? "Día" : "Días"}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center font-black">
                        #{getRoomNumber(booking.room_id)}
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col font-bold text-[9px] uppercase">
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
                          className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${
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
                      <td className="py-5 px-8">
                        <div className="flex gap-2 justify-center">
                          {booking.status !== "pagado" && (
                            <form action={markAsPaid}>
                              <input
                                type="hidden"
                                name="bookingId"
                                value={booking.id}
                              />
                              <button
                                type="submit"
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-[9px] uppercase"
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
                              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-400 rounded-xl font-bold text-[9px] uppercase hover:text-rose-600"
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
              <div className="p-20 text-center text-stone-400 italic">
                No hay reservas en este rango de fechas.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
