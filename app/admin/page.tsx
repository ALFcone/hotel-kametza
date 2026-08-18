/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/admin/page.tsx
 * PROPÓSITO: Panel de Administración del Hotel. Solo accesible para ti.
 *            Muestra los KPIs, estado de habitaciones, y el historial
 *            de todas las reservas del sistema.
 * ---------------------------------------------------------------------
 */
import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toggleRoomCleanliness, updateRoom, getUserRole } from "../actions";
import DownloadButton from "./DownloadButton";
import Link from "next/link";
import WalkInForm from "./WalkInForm";
import { AdminTableActions } from "./AdminTableActions";
import AdminProducts from "./AdminProducts";
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
  FileText,
  Globe,
  XCircle,
  Sparkles,
  CalendarCheck,
  CalendarDays,
  Users,
  Building,
  ShoppingCart,
} from "lucide-react";

// ==============================================================================
// 1. ACCIONES DE SERVIDOR (SERVER ACTIONS)
// ==============================================================================

async function markAsPaid(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");
  if (!bookingId) {
    console.log("No bookingId provided");
    return;
  }

  const { role, user } = await getUserRole();
  if (!role || !user) {
    console.log("Unauthorized or no user role");
    return;
  }
  const supabaseServer = await getSupabaseServer();

  const id = parseInt(bookingId.toString(), 10);
  console.log(`Attempting to mark booking ${id} as pagado for user ${user.email}`);

  const { data, error } = await supabaseServer
    .from("bookings")
    .update({ status: "pagado" })
    .eq("id", id)
    .select();

  console.log("Update response:", data, error);
  revalidatePath("/admin");
}

async function deleteBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");
  if (!bookingId) return;

  const supabaseServer = await getSupabaseServer();
  const { role } = await getUserRole();
  if (role !== "admin") return; // Only admin can delete bookings without PIN in this simplified action

  const id = parseInt(bookingId.toString(), 10);

  await supabaseServer.from("bookings").delete().eq("id", id);
  revalidatePath("/admin");
}

// ==============================================================================
// 2. UTILIDADES Y FORMATO
// ==============================================================================

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

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}

// ==============================================================================
// 3. COMPONENTE PRINCIPAL (PÁGINA DE ADMIN)
// ==============================================================================

export default async function AdminPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // VALIDACIÓN
  // VALIDACIÓN DE ROL
  const { user, role } = await getUserRole();

  if (!user) {
    redirect("/login");
  }

  if (!role) {
    // Si no tiene rol (admin o receptionist), es un cliente regular
    redirect("/dashboard");
  }

  const supabaseServer = await getSupabaseServer();
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || (role === "admin" ? "resumen" : "estado");

  // A. FECHAS Y PARÁMETROS
  const today = new Date().toISOString().split("T")[0];
  const dateFrom = searchParams.from || today;
  const dateTo = searchParams.to || today;
  const filterDate = dateFrom;
  const rangeLabel = dateFrom === dateTo ? dateFrom : `${dateFrom} al ${dateTo}`;

  const todayFormatted = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // B. CONSULTAS
  const { data: rooms } = await supabaseServer.from("rooms").select("*").order("id");
  const { data: rawBookings } = await supabaseServer
    .from("bookings")
    .select("*, clients(*)")
    .order("created_at", { ascending: false });

  // Mapear la nueva estructura relacional a la estructura plana original
  // para no romper la compatibilidad con el resto del panel y componentes.
  // Usamos un fallback a b.client_name antiguo por si el cache de Supabase
  // aún no detecta la relación Foránea (Foreign Key).
  const allBookings = rawBookings?.map((b: any) => ({
    ...b,
    client_name: b.clients?.name || b.client_name || null,
    client_email: b.clients?.email || b.client_email || null,
    client_phone: b.clients?.phone || b.client_phone || null,
    client_country: b.clients?.country || b.client_country || null,
    document_type: b.clients?.document_type || b.document_type || null,
    document_number: b.clients?.document_number || b.document_number || null,
  })) || [];
  const { data: allExtras } = await supabaseServer
    .from("booking_extras")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: products } = await supabaseServer
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  // C. FILTRADO (Reservas creadas o que inician en el rango de fechas)
  const filteredBookings = allBookings?.filter((b) => {
    const checkInDate = b.check_in ? b.check_in.toString().substring(0, 10) : "";
    const createdAtDate = b.created_at ? b.created_at.toString().substring(0, 10) : "";
    
    const isCheckInInRange = checkInDate >= dateFrom && checkInDate <= dateTo;
    const isCreatedInRange = createdAtDate >= dateFrom && createdAtDate <= dateTo;
    
    return isCheckInInRange || isCreatedInRange;
  });

  // D. KPIs
  // Ocupación: Foto diaria específica para la fecha inicial (filterDate)
  const occupiedCount =
    allBookings?.filter(
      (b) =>
        b.check_in &&
        b.check_out &&
        b.check_in <= filterDate &&
        b.check_out > filterDate &&
        b.status !== "cancelled" &&
        b.status !== "cancelada"
    ).length || 0;

  // Llegadas acumuladas dentro de todo el rango de fechas
  const arrivalsCount =
    allBookings?.filter(
      (b) =>
        b.check_in &&
        b.check_in >= dateFrom &&
        b.check_in <= dateTo &&
        b.status !== "cancelled" &&
        b.status !== "cancelada"
    ).length || 0;

  // Salidas (para limpieza) acumuladas dentro de todo el rango de fechas
  const cleaningList =
    allBookings?.filter(
      (b) =>
        b.check_out &&
        b.check_out >= dateFrom &&
        b.check_out <= dateTo &&
        b.status !== "cancelled" &&
        b.status !== "cancelada"
    ) || [];

  // Ventas creadas dentro del rango de fechas (Consideramos los abonos reales: 'pagado', 'approved', 'parcial')
  const salesInRange =
    allBookings?.filter((b) => {
      if (!b.created_at) return false;
      const createdAtDate = b.created_at.substring(0, 10);
      return (
        createdAtDate >= dateFrom &&
        createdAtDate <= dateTo &&
        (b.status === "pagado" || b.status === "approved" || b.status === "parcial")
      );
    }) || [];

  const getPaidAmount = (b: any) => {
    if (b.amount_paid !== null && b.amount_paid !== undefined) return Number(b.amount_paid);
    // Fallback para reservas antiguas antes de agregar la columna
    if (b.status === "pagado" || b.status === "approved") return Number(b.total_price || 0);
    return 0;
  };

  const totalIncome = salesInRange.reduce(
    (acc, b) => acc + getPaidAmount(b),
    0
  );

  const cashIncome = salesInRange
    .filter((b) => b.payment_method === "recepcion" || b.payment_method === "efectivo")
    .reduce((acc, b) => acc + getPaidAmount(b), 0);

  const digitalIncome = salesInRange
    .filter((b) => b.payment_method === "online" || b.payment_method === "yape" || b.payment_method === "tarjeta")
    .reduce((acc, b) => acc + getPaidAmount(b), 0);

  const totalRooms = rooms?.length || 0;
  const freeRooms = totalRooms - occupiedCount;

  // Habitaciones más populares (por noches reservadas en el rango)
  const roomPopularity = rooms?.map(room => {
    const nights = allBookings?.filter(b => 
      b.room_id === room.id && 
      b.status !== "cancelled" && b.status !== "cancelada" &&
      b.check_in >= dateFrom && b.check_in <= dateTo
    ).reduce((acc, b) => acc + calculateNights(b.check_in, b.check_out), 0) || 0;
    
    return { name: room.name, number: room.room_number || room.id, nights };
  }).sort((a, b) => b.nights - a.nights).slice(0, 4) || [];

  // F. CÁLCULO DE TENDENCIA DE VENTAS (ÚLTIMOS 7 DÍAS)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const salesTrend = last7Days.map((dateStr) => {
    const daySales = allBookings?.filter(
      (b) =>
        b.created_at &&
        b.created_at.startsWith(dateStr) &&
        (b.status === "pagado" || b.status === "approved" || b.status === "parcial")
    ) || [];
    const total = daySales.reduce((acc, b) => acc + getPaidAmount(b), 0);
    
    const dayName = new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
      weekday: "short",
    });
    return { date: dateStr, dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1), total };
  });

  const maxSales = Math.max(...salesTrend.map((s) => s.total), 100);

  const points = salesTrend.map((s, i) => {
    const x = Math.round(40 + i * (520 / 6));
    const y = Math.round(160 - (s.total / maxSales) * 140);
    return { x, y, ...s };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},160 L${points[0].x},160 Z`;

  // E. HELPERS
  const getRoomNumber = (id: number) =>
    rooms?.find((r) => r.id === id)?.room_number ||
    rooms?.find((r) => r.id === id)?.id ||
    "#";

  const getRoomType = (id: number) =>
    rooms?.find((r) => r.id === id)?.name || "";

  const getRoomStatus = (roomId: number) => {
    const leaving = allBookings?.find(
      (b) =>
        b.room_id === roomId &&
        b.check_out === filterDate &&
        b.status !== "cancelled"
    );
    if (leaving) return { status: "checkout", guest: leaving.client_name };

    const occupied = allBookings?.find(
      (b) =>
        b.room_id === roomId &&
        b.check_in <= filterDate &&
        b.check_out > filterDate &&
        b.status !== "cancelled" &&
        b.status !== "cancelada"
    );

    if (occupied)
      return {
        status: "occupied",
        guest: occupied.client_name,
        paid: occupied.status === "pagado" || occupied.status === "approved",
      };
    return { status: "free", guest: null };
  };

  // ==============================================================================
  // 4. RENDERIZADO
  // ==============================================================================

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-800 font-sans flex">
      {/* --- SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-stone-950 text-white p-6 border-r border-stone-800 shrink-0 sticky top-0 h-screen justify-between z-50">
        <div className="space-y-8">
          {/* Logo & Hotel Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/10">
            <div className="bg-white/10 text-amber-300 p-2.5 rounded-2xl border border-white/10 shadow-lg">
              <Building size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-white leading-tight">Kametza</h2>
              <span className="text-[10px] text-amber-300/70 uppercase tracking-widest font-black">Panel Admin</span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex flex-col gap-1.5">
            {role === "admin" && (
              <Link
                href={`/admin?tab=resumen&from=${dateFrom}&to=${dateTo}`}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === "resumen"
                    ? "bg-white text-[#d97706] shadow-md"
                    : "text-amber-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <TrendingUp size={16} /> Resumen y Ventas
              </Link>
            )}
            <Link
              href={`/admin?tab=estado&from=${dateFrom}&to=${dateTo}`}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "estado"
                  ? "bg-white text-[#d97706] shadow-md"
                  : "text-amber-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <LayoutDashboard size={16} /> Estado de Habitaciones
            </Link>
            <Link
              href={`/admin?tab=historial&from=${dateFrom}&to=${dateTo}`}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "historial"
                  ? "bg-white text-[#d97706] shadow-md"
                  : "text-amber-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FileText size={16} /> Historial de Reservas
            </Link>
            <Link
              href={`/admin?tab=calendario&from=${dateFrom}&to=${dateTo}`}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "calendario"
                  ? "bg-white text-[#d97706] shadow-md"
                  : "text-amber-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CalendarDays size={16} /> Calendario Visual
            </Link>
            <Link
              href={`/admin?tab=inventario&from=${dateFrom}&to=${dateTo}`}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "inventario"
                  ? "bg-white text-[#d97706] shadow-md"
                  : "text-amber-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <BedDouble size={16} /> Inventario
            </Link>
            <Link
              href={`/admin?tab=registrar&from=${dateFrom}&to=${dateTo}`}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "registrar"
                  ? "bg-white text-[#d97706] shadow-md"
                  : "text-amber-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CalendarCheck size={16} /> Registrar Reserva
            </Link>
            <Link
              href={`/admin?tab=almacen&from=${dateFrom}&to=${dateTo}`}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "almacen"
                  ? "bg-white text-[#d97706] shadow-md"
                  : "text-amber-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <ShoppingCart size={16} /> Almacén / Minibar
            </Link>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <Link href="/" className="flex items-center justify-center gap-2 bg-white/10 text-white/90 py-3 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all border border-white/10 w-full">
            <Globe size={14} /> Volver a la Web
          </Link>
        </div>
      </aside>
      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 p-6 md:p-12 pb-24 lg:pb-12 overflow-y-auto w-full relative">
        <div className="w-full">
          {/* TOP BAR / FILTROS */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 border-b border-stone-200/60 pb-8">
            <div className="flex justify-between w-full xl:w-auto items-start">
              <div>
                <span className="text-[#d97706] text-xs font-black uppercase tracking-widest bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-100">
                  Administración
                </span>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mt-3">
                  Panel de Control
                </h1>
                <p className="text-stone-500 text-xs mt-1 font-medium capitalize">
                  {todayFormatted}
                </p>
              </div>
              <Link href="/" className="lg:hidden flex items-center justify-center bg-stone-900 text-white w-12 h-12 rounded-full shadow-md hover:bg-amber-600 transition-colors">
                <Globe size={20} />
              </Link>
            </div>

            {/* Filtros de Fecha */}
            <div className="flex items-end gap-3 flex-wrap w-full xl:w-auto">
              <form className="flex items-end gap-2 bg-white p-3 rounded-2xl border border-stone-200/60 shadow-sm flex-wrap w-full sm:w-auto" method="get">
                {/* Mantener la pestaña activa al filtrar */}
                <input type="hidden" name="tab" value={activeTab} />
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase text-stone-400 ml-2">Desde</span>
                  <input
                    type="date"
                    name="from"
                    defaultValue={dateFrom}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase text-stone-400 ml-2">Hasta</span>
                  <input
                    type="date"
                    name="to"
                    defaultValue={dateTo}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#d97706] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider h-[38px] transition shadow-md"
                >
                  Filtrar
                </button>
              </form>
              <div className="flex gap-2">
                {allBookings && <DownloadButton data={allBookings} />}
              </div>
            </div>
          </div>

          {/* --- TAB: RESUMEN GENERAL --- */}
          {activeTab === "resumen" && (
            <div className="space-y-10 animate-fade-in-up">
              {/* --- ALERTAS DE LIMPIEZA --- */}
              {cleaningList.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 p-5 rounded-3xl flex items-center justify-between shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-3 rounded-2xl shadow-lg">
                      <Brush size={20} />
                    </div>
                    <div>
                      <p className="text-amber-950 font-bold text-base">
                        Salidas para Limpieza hoy: {cleaningList.length} habitaciones
                      </p>
                      <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mt-0.5">
                        Habitaciones a desinfectar:{" "}
                        {cleaningList.map((b) => getRoomNumber(b.room_id)).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div id="resumen" className="scroll-mt-24 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1.5 w-8 bg-[#d97706] rounded-full" />
                  <h2 className="text-xl font-bold text-stone-900 tracking-tight">Resumen General</h2>
                </div>
                
                {/* Cards KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Card Ventas */}
                  <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-[0_4px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500">
                    <Wallet size={120} className="absolute -right-6 -bottom-6 text-stone-50 opacity-50 group-hover:scale-110 group-hover:text-amber-50 transition-all duration-500" />
                    <div className="relative z-10">
                      <div className="bg-stone-900 text-amber-400 p-3.5 rounded-2xl w-fit mb-5 shadow-md group-hover:scale-110 transition-transform duration-500">
                        <Wallet size={20} />
                      </div>
                      <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Ventas ({rangeLabel})</span>
                      <p className="text-3xl font-bold text-stone-900 mt-2 font-serif">{formatMoney(totalIncome)}</p>
                      <div className="flex gap-6 mt-6 border-t border-stone-100 pt-4">
                        <div>
                          <p className="text-[9px] text-stone-400 uppercase font-black">Efectivo</p>
                          <p className="font-bold text-stone-800 text-sm mt-0.5">{formatMoney(cashIncome)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-stone-400 uppercase font-black">Digital</p>
                          <p className="font-bold text-[#d97706] text-sm mt-0.5">{formatMoney(digitalIncome)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Llegadas */}
                  <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-[0_4px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500">
                    <CalendarCheck size={120} className="absolute -right-6 -bottom-6 text-stone-50 opacity-50 group-hover:scale-110 group-hover:text-amber-50 transition-all duration-500" />
                    <div className="relative z-10">
                      <div className="bg-stone-900 text-amber-400 p-3.5 rounded-2xl w-fit mb-5 shadow-md group-hover:scale-110 transition-transform duration-500">
                        <CalendarCheck size={20} />
                      </div>
                      <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Llegadas ({rangeLabel})</span>
                      <p className="text-3xl font-bold text-stone-900 mt-2 font-serif">{arrivalsCount}</p>
                      <p className="text-stone-500 text-[10px] font-medium mt-1 uppercase tracking-wider">Huéspedes Registrados</p>
                    </div>
                  </div>

                  {/* Card Ocupación */}
                  <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-[0_4px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500">
                    <Building size={120} className="absolute -right-6 -bottom-6 text-stone-50 opacity-50 group-hover:scale-110 group-hover:text-amber-50 transition-all duration-500" />
                    <div className="relative z-10">
                      <div className="bg-stone-900 text-amber-400 p-3.5 rounded-2xl w-fit mb-5 shadow-md group-hover:scale-110 transition-transform duration-500">
                        <Building size={20} />
                      </div>
                      <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Ocupadas ({filterDate})</span>
                      <p className="text-3xl font-bold text-stone-900 mt-2 font-serif">{occupiedCount}</p>
                      <p className="text-stone-500 text-[10px] font-medium mt-1 uppercase tracking-wider">
                        {freeRooms} libres de {totalRooms}
                      </p>
                    </div>
                  </div>

                  {/* Card Salidas */}
                  <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-[0_4px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500">
                    <Brush size={120} className="absolute -right-6 -bottom-6 text-stone-50 opacity-50 group-hover:scale-110 group-hover:text-amber-50 transition-all duration-500" />
                    <div className="relative z-10">
                      <div className="bg-stone-900 text-amber-400 p-3.5 rounded-2xl w-fit mb-5 shadow-md group-hover:scale-110 transition-transform duration-500">
                        <Brush size={20} />
                      </div>
                      <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Salidas ({rangeLabel})</span>
                      <p className="text-3xl font-bold text-stone-900 mt-2 font-serif">{cleaningList.length}</p>
                      <p className="text-stone-500 text-[10px] font-medium mt-1 uppercase tracking-wider">Para Limpieza / Salida</p>
                    </div>
                  </div>
                </div>

                {/* Gráficos Visuales */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* 1. Gráfico de Líneas de Ventas */}
                  <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-stone-200/60 p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-base text-stone-900">Tendencia de Ventas</h3>
                        <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Últimos 7 días de ingresos (S/)</p>
                      </div>
                    </div>
                    <div className="w-full overflow-hidden">
                      <svg viewBox="0 0 600 200" className="w-full h-auto max-h-56" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.15"/>
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Grid Lines */}
                        <line x1="40" y1="20" x2="560" y2="20" stroke="#F1F5F9" strokeWidth="2" strokeDasharray="4" />
                        <line x1="40" y1="90" x2="560" y2="90" stroke="#F1F5F9" strokeWidth="2" strokeDasharray="4" />
                        <line x1="40" y1="160" x2="560" y2="160" stroke="#E2E8F0" strokeWidth="1" />

                        {/* Area Fill */}
                        <path d={areaPath} fill="url(#salesGrad)" />

                        {/* Line */}
                        <path d={linePath} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Points */}
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke="#d97706" strokeWidth="3" />
                            <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-bold fill-stone-800">
                              S/ {Math.round(p.total)}
                            </text>
                            <text x={p.x} y="180" textAnchor="middle" className="text-[9px] font-black uppercase tracking-wider fill-stone-400">
                              {p.dayName}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* 2. Ocupación y Distribución */}
                  <div className="bg-white rounded-[2.5rem] border border-stone-200/60 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-stone-900 mb-6">Ocupación y Métodos</h3>
                      
                      {/* Doughnut de Ocupación */}
                      <div className="flex items-center gap-6 mb-8 border-b border-stone-100 pb-6">
                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle cx="48" cy="48" r="38" stroke="#F5F5F4" strokeWidth="8" fill="transparent" />
                            {/* Progress Circle */}
                            <circle
                              cx="48"
                              cy="48"
                              r="38"
                              stroke="#d97706"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 38}
                              strokeDashoffset={2 * Math.PI * 38 - (2 * Math.PI * 38 * (occupiedCount / (totalRooms || 1)))}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-stone-900">
                              {Math.round((occupiedCount / (totalRooms || 1)) * 100)}%
                            </span>
                            <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Ocupado</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-stone-850">Distribución Física</h4>
                          <p className="text-stone-400 text-[10px] mt-1 font-medium">
                            {occupiedCount} habitaciones ocupadas de {totalRooms} totales.
                          </p>
                        </div>
                      </div>

                      {/* Proporción de Métodos de Pago */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                            <span className="text-stone-500">🏨 Efectivo / Recepción</span>
                            <span className="text-stone-900">{formatMoney(cashIncome)}</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-stone-850 h-full rounded-full"
                              style={{ width: `${totalIncome > 0 ? (cashIncome / totalIncome) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                            <span className="text-stone-500">💳 Digital / Online</span>
                            <span className="text-[#d97706]">{formatMoney(digitalIncome)}</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#d97706] h-full rounded-full"
                              style={{ width: `${totalIncome > 0 ? (digitalIncome / totalIncome) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nuevos Gráficos Analíticos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Habitaciones Populares */}
                  <div className="bg-white rounded-[2.5rem] border border-stone-200/60 p-8 shadow-sm">
                    <h3 className="font-bold text-base text-stone-900 mb-6">Top Habitaciones (Demandadas)</h3>
                    <div className="space-y-4">
                      {roomPopularity.map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                            <span className="text-stone-500">#{r.number} - {r.name}</span>
                            <span className="text-stone-900">{r.nights} noches</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-stone-900 h-full rounded-full"
                              style={{ width: `${roomPopularity[0]?.nights > 0 ? (r.nights / roomPopularity[0].nights) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Distribución por Medio de Pago (Pie Chart visual) */}
                  <div className="bg-white rounded-[2.5rem] border border-stone-200/60 p-8 shadow-sm">
                     <h3 className="font-bold text-base text-stone-900 mb-6">Ingresos Totales (Composición)</h3>
                     {totalIncome > 0 ? (
                       <div className="flex items-center gap-6">
                         <div className="relative w-28 h-28 shrink-0">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                             {/* Fondo Efectivo (Gris) */}
                             <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E5E7EB" strokeWidth="20" />
                             {/* Frente Digital (Naranja) */}
                             <circle
                               cx="50" cy="50" r="40" fill="transparent"
                               stroke="#d97706" strokeWidth="20"
                               strokeDasharray={`${(digitalIncome/totalIncome) * 251.2} 251.2`}
                               className="transition-all duration-1000 ease-out"
                             />
                           </svg>
                         </div>
                         <div className="flex flex-col justify-center gap-4 w-full">
                           <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                             <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full bg-stone-200" />
                               <span className="text-[10px] font-black uppercase text-stone-500">Efectivo</span>
                             </div>
                             <span className="text-xs font-bold text-stone-900">{Math.round((cashIncome/totalIncome)*100)}%</span>
                           </div>
                           <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                             <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full bg-[#d97706]" />
                               <span className="text-[10px] font-black uppercase text-stone-700">Digital</span>
                             </div>
                             <span className="text-xs font-bold text-[#d97706]">{Math.round((digitalIncome/totalIncome)*100)}%</span>
                           </div>
                         </div>
                       </div>
                     ) : (
                       <div className="text-center text-stone-400 text-xs italic mt-8">Sin datos de ingresos en este rango</div>
                     )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* --- TAB: ESTADO ACTUAL HABITACIONES --- */}
          {activeTab === "estado" && (
            <div id="estado-actual" className="scroll-mt-24 mb-12 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-8 bg-[#d97706] rounded-full" />
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">Estado de Habitaciones</h2>
                <div className="flex items-center gap-4 ml-auto text-[9px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white border border-stone-300" /> Libre</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#d97706]" /> Ocupada</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /> Salida</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600" /> Sucia</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                {rooms?.map((room) => {
                  const info = getRoomStatus(room.id);
                  const isOccupied = info.status === "occupied";
                  const isCheckout = info.status === "checkout";
                  const isDirty = room.is_clean === false;

                  return (
                    <div
                      key={room.id}
                      className={`p-5 rounded-[1.5rem] border transition-all duration-500 flex flex-col justify-between h-40 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl ${
                        isOccupied
                          ? "bg-gradient-to-br from-stone-900 to-stone-800 text-white border-stone-800 shadow-[0_8px_30px_rgba(217,119,6,0.15)] ring-1 ring-inset ring-[#d97706]/20"
                          : isCheckout
                          ? "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 border-amber-200 shadow-lg shadow-amber-100/50"
                          : isDirty
                          ? "bg-gradient-to-br from-rose-50 to-white border-rose-200 shadow-md shadow-rose-100/50"
                          : "bg-white border-stone-200/60 text-stone-600 shadow-sm hover:border-stone-300"
                      }`}
                    >
                      {/* Gran Número de Fondo */}
                      <span className={`absolute -bottom-4 -right-2 text-[6.5rem] font-serif italic tracking-tighter select-none transition-all duration-500 ${
                        isOccupied ? "text-white opacity-[0.03] group-hover:opacity-[0.08]" 
                        : isDirty ? "text-rose-900 opacity-[0.03] group-hover:opacity-[0.06]"
                        : isCheckout ? "text-amber-900 opacity-[0.04] group-hover:opacity-[0.08]"
                        : "text-stone-900 opacity-[0.03] group-hover:opacity-[0.05]"
                      }`}>
                        {room.room_number || room.id}
                      </span>
                      
                      {/* Top Accent Line for specific states */}
                      {isOccupied && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d97706] to-amber-300 opacity-80" />}
                      {isDirty && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600 opacity-80" />}
                      
                      <div className="z-10 flex justify-between items-start w-full gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs uppercase tracking-wider truncate ${isDirty ? "text-rose-950" : ""}`}>
                            {room.name}
                          </p>
                          {info.guest && (
                            <p className={`text-[10px] mt-1.5 font-medium truncate ${isOccupied ? "text-stone-300" : isCheckout ? "text-amber-700/80" : "text-stone-500"}`}>
                              {info.guest}
                            </p>
                          )}
                        </div>
                        
                        {/* Botón de Limpieza */}
                        <form action={toggleRoomCleanliness} className="shrink-0 relative z-20">
                          <input type="hidden" name="roomId" value={room.id} />
                          <input type="hidden" name="isClean" value={isDirty.toString()} />
                          <button
                            type="submit"
                            title={isDirty ? "Marcar como Limpia" : "Marcar como Sucia"}
                            className={`p-2.5 rounded-full transition-all duration-300 shadow-sm border ${
                              isDirty 
                                ? "bg-white text-rose-500 border-rose-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-md" 
                                : isOccupied
                                ? "bg-white/10 text-stone-300 border-white/5 hover:bg-white hover:text-[#d97706] hover:shadow-md"
                                : "bg-stone-50 text-stone-400 border-stone-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 hover:shadow-md"
                            }`}
                          >
                            <Brush size={14} strokeWidth={2.5} />
                          </button>
                        </form>
                      </div>
                      
                      <div className="z-10 mt-4 flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-sm border ${
                            info.status === "free" && !isDirty
                              ? "bg-white text-stone-500 border-stone-200"
                              : info.status === "free" && isDirty
                              ? "bg-rose-500 text-white border-rose-600"
                              : isCheckout
                              ? "bg-amber-400 text-amber-950 border-amber-500"
                              : info.paid
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-sm"
                              : "bg-[#d97706]/20 text-amber-300 border-[#d97706]/30 backdrop-blur-sm"
                          }`}
                        >
                          {info.status === "free"
                            ? (isDirty ? "Sucia" : "Libre")
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
            </div>
          )}

          {/* --- TAB: HISTORIAL DE RESERVAS (TABLA) --- */}
          {activeTab === "historial" && (
            <div id="historial" className="scroll-mt-24 mb-12 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-8 bg-[#d97706] rounded-full" />
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">Historial de Reservas</h2>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200/60 overflow-hidden">
                <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-white to-stone-50/30 flex-wrap gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900">Historial Completo</h3>
                    <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                      Mostrando reservas de <span className="text-[#d97706]">{dateFrom}</span> a <span className="text-[#d97706]">{dateTo}</span>
                      {filteredBookings && (
                        <span className="ml-2 bg-stone-100 px-2 py-0.5 rounded-full text-stone-500 text-[9px]">
                          {filteredBookings.length} registros
                        </span>
                      )}
                    </p>
                  </div>
                  {filteredBookings && filteredBookings.length > 0 && (
                    <DownloadButton data={filteredBookings} extrasData={allExtras || []} />
                  )}
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-50 border-b border-stone-100">
                        <th className="py-5 px-6">Reserva / Ticket</th>
                        <th className="py-5 px-6">Huésped</th>
                        <th className="py-5 px-4">Documento</th>
                        <th className="py-5 px-4">Contacto</th>
                        <th className="py-5 px-4 text-center">Noches</th>
                        <th className="py-5 px-4 text-center">Hab.</th>
                        <th className="py-5 px-4">Estancia</th>
                        <th className="py-5 px-4 text-right">Total</th>
                        <th className="py-5 px-4 text-center">Estado</th>
                        <th className="py-5 px-8 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredBookings?.map((booking) => {
                        const noches = calculateNights(booking.check_in, booking.check_out);
                        const isCancelled = booking.status === "cancelled" || booking.status === "cancelada";
                        
                        const bookingExtras = allExtras?.filter((e) => e.booking_id === booking.id) || [];
                        const extrasTotal = bookingExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
                        const grandTotal = booking.total_price + extrasTotal;

                        return (
                          <tr
                            key={booking.id}
                            className={`border-b border-stone-100 transition-all duration-200 ${
                              isCancelled ? "bg-stone-50/50 opacity-60" : "hover:bg-amber-50/20"
                            }`}
                          >
                            <td className="py-5 px-6">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center justify-center px-2 py-1.5 rounded-lg text-[10px] font-black tracking-[0.1em] shadow-sm border ${isCancelled ? "bg-stone-50 text-stone-400 border-stone-200 line-through" : "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200"}`}>
                                  RES-{formatTicket(booking.id)}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-[10px] uppercase shadow-inner shrink-0">
                                  {booking.client_name ? booking.client_name.charAt(0) : "?"}
                                </div>
                                <span className="font-bold text-stone-900 uppercase text-[10px] truncate max-w-[120px]">
                                  {booking.client_name || "Sin Nombre"}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="bg-stone-100 text-stone-500 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">{booking.document_type || "DOC"}</span>
                                <span className="font-bold text-stone-850 text-[10px] font-mono">{booking.document_number}</span>
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex flex-col gap-1 text-[9px]">
                                <a href={`mailto:${booking.client_email}`} className="text-stone-500 hover:text-amber-600 flex items-center gap-1 transition-colors">
                                  <span className="bg-stone-100 p-1 rounded-full"><Mail size={8} /></span> 
                                  <span className="truncate max-w-[100px]">{booking.client_email || "Sin email"}</span>
                                </a>
                                <a href={`tel:${booking.client_phone}`} className="text-emerald-700 font-bold flex items-center gap-1 transition-colors">
                                  <span className="bg-emerald-50 p-1 rounded-full"><Phone size={8} /></span> 
                                  {booking.client_phone || "Sin teléfono"}
                                </a>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <span className="bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 px-2 py-1 rounded-lg font-bold text-[9px] border border-indigo-100/50 shadow-sm">
                                {noches} {noches === 1 ? "noche" : "noches"}
                              </span>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <span className="inline-flex items-center justify-center bg-stone-900 text-amber-400 px-2 py-0.5 rounded-md font-black text-[10px] shadow-sm">
                                #{getRoomNumber(booking.room_id)}
                              </span>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex flex-col bg-stone-50 p-1.5 rounded-lg border border-stone-100 gap-1 w-fit">
                                <span className="text-emerald-600 flex items-center gap-1 font-bold text-[8px] uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                  {formatDateShort(booking.check_in)}
                                </span>
                                <span className="text-amber-600 flex items-center gap-1 font-bold text-[8px] uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                  {formatDateShort(booking.check_out)}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-right font-bold text-stone-900">
                              {formatMoney(grandTotal)}
                              {extrasTotal > 0 && (
                                <div className="text-[8px] text-stone-400 mt-0.5">Incluye {formatMoney(extrasTotal)} extras</div>
                              )}
                            </td>
                            <td className="py-5 px-4 text-center">
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border border-red-200">
                                  <XCircle size={10} /> Cancelada
                                </span>
                              ) : (
                                (() => {
                                  const effectiveAmountPaid = (booking.amount_paid !== null && booking.amount_paid !== undefined) 
                                    ? booking.amount_paid 
                                    : ((booking.status === "pagado" || booking.status === "approved") ? booking.total_price : 0);
                                  const balance = grandTotal - effectiveAmountPaid;
                                  const effectiveStatus = balance <= 0 ? "pagado" : ((effectiveAmountPaid > 0 || booking.status === "parcial") ? "parcial" : "pendiente");

                                  return (
                                    <div className="flex flex-col items-center gap-1">
                                      <span
                                        className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full ${
                                          effectiveStatus === "pagado"
                                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                            : effectiveStatus === "parcial"
                                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                                            : "bg-amber-100 text-amber-600 border border-amber-200"
                                        }`}
                                      >
                                        {effectiveStatus === "pagado" ? "Pagado" : effectiveStatus === "parcial" ? "Parcial" : "Pendiente"}
                                      </span>
                                      <span className="text-[9px] font-bold text-stone-500">
                                        Pagado: S/ {(effectiveAmountPaid).toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })()
                              )}
                            </td>
                            <td className="py-5 px-6 text-center">
                              <AdminTableActions 
                                bookingId={booking.id}
                                status={booking.status}
                                totalPrice={booking.total_price}
                                amountPaid={booking.amount_paid || 0}
                                isCancelled={isCancelled}
                                checkIn={booking.check_in}
                                checkOut={booking.check_out}
                                extras={bookingExtras}
                                guestName={booking.client_name || "Huésped"}
                                roomName={getRoomNumber(booking.room_id).toString()}
                                roomType={getRoomType(booking.room_id)}
                                guestPhone={booking.client_phone || undefined}
                                guestDocument={booking.document_number || undefined}
                                onDelete={deleteBooking}
                                products={products || []}
                                userRole={role}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredBookings?.length === 0 && (
                    <div className="p-12 text-center text-stone-400 italic text-sm">
                      No se encontraron reservas en este rango de fechas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: INVENTARIO DE HABITACIONES --- */}
          {activeTab === "inventario" && (
            <div id="inventario" className="scroll-mt-24 mb-12 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-8 bg-[#d97706] rounded-full" />
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">Gestión de Inventario</h2>
                <span className="text-[10px] bg-stone-100 text-stone-500 px-3 py-1 rounded-full font-bold">
                  {rooms?.length} habitaciones
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms?.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100 overflow-hidden group hover:shadow-2xl hover:shadow-stone-200/60 hover:-translate-y-1.5 transition-all duration-500"
                  >
                    <div className="h-52 overflow-hidden relative">
                      <img
                        src={room.image_url}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-1000 ease-in-out"
                      />
                      {/* Gradient Overlay for smooth transition */}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-lg font-black shadow-lg shadow-black/20">
                        #{room.room_number || room.id}
                      </div>
                      
                      {/* Título integrado en la imagen */}
                      <div className="absolute bottom-4 left-6 right-6">
                        <h3 className="font-serif italic text-2xl text-white drop-shadow-md tracking-tight">
                          {room.name}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <form action={updateRoom} className="space-y-5">
                        <input type="hidden" name="roomId" value={room.id} />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="group/input">
                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1.5 group-focus-within/input:text-[#d97706] transition-colors">
                              Precio Noche
                            </label>
                            <div className="relative w-28">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-[10px]">S/</span>
                              <input
                                name="price"
                                defaultValue={room.price_per_night}
                                type="number"
                                className="w-full pl-7 pr-2 py-2 bg-stone-50/50 rounded-lg border border-stone-200 font-bold text-stone-700 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] outline-none transition-all text-xs shadow-inner shadow-stone-100/50"
                              />
                            </div>
                          </div>
                          <div className="group/input">
                            <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1.5 group-focus-within/input:text-[#d97706] transition-colors">
                              Cambiar Imagen
                            </label>
                            <input type="hidden" name="oldImage" value={room.image_url || ""} />
                            <input
                              name="image"
                              type="file"
                              accept="image/*"
                              className="w-full bg-stone-50/50 rounded-xl border border-stone-200 text-[10px] file:mr-3 file:py-3 file:px-4 file:border-0 file:text-[9px] file:font-black file:uppercase file:tracking-wider file:bg-stone-200 file:text-stone-700 hover:file:bg-[#d97706] hover:file:text-white file:transition-colors outline-none transition-all shadow-inner shadow-stone-100/50 focus:border-[#d97706] focus:bg-white"
                            />
                          </div>
                        </div>
                        
                        <div className="group/input">
                          <label className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1.5 group-focus-within/input:text-[#d97706] transition-colors">
                            Descripción
                          </label>
                          <textarea
                            name="description"
                            defaultValue={room.description}
                            className="w-full p-3.5 bg-stone-50/50 rounded-xl border border-stone-200 text-xs h-20 resize-none font-medium text-stone-600 focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 focus:border-[#d97706] outline-none transition-all shadow-inner shadow-stone-100/50"
                            placeholder="Descripción de la habitación..."
                          />
                        </div>
                        
                        <button className="relative overflow-hidden w-full bg-stone-900 text-amber-500 font-black py-3.5 rounded-xl transition-all duration-300 text-[10px] uppercase tracking-widest shadow-lg hover:shadow-[#d97706]/20 hover:-translate-y-0.5 group/btn">
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            Guardar Cambios
                          </span>
                          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB: REGISTRAR RESERVA (WALK-IN CLIENT SIDE FORM) --- */}
          {activeTab === "registrar" && rooms && (
            <div className="animate-fade-in-up">
              <WalkInForm rooms={rooms} />
            </div>
          )}

          {/* --- TAB: CALENDARIO (GANTT) --- */}
          {activeTab === "calendario" && (
            <div className="animate-fade-in-up bg-white rounded-[2rem] p-6 md:p-8 border border-stone-100 shadow-xl shadow-stone-200/40 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-8 bg-[#d97706] rounded-full" />
                  <h2 className="text-xl font-bold text-stone-900 tracking-tight">Calendario Visual (Gantt)</h2>
                </div>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" /> Pagado</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" /> Parcial</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#d97706] shadow-sm" /> Pendiente</span>
                </div>
              </div>
              
              <div className="overflow-x-auto w-full pb-4">
                {(() => {
                  const calendarStartDate = new Date(dateFrom + "T00:00:00");
                  let calendarEndDate = new Date(dateTo + "T00:00:00");
                  
                  // Ensure at least 14 days
                  const diffTime = calendarEndDate.getTime() - calendarStartDate.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays < 14) {
                    calendarEndDate = new Date(calendarStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
                  }
                  
                  const totalDays = Math.ceil((calendarEndDate.getTime() - calendarStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  const calendarDays: Date[] = [];
                  const curr = new Date(calendarStartDate);
                  while (curr <= calendarEndDate) {
                    calendarDays.push(new Date(curr));
                    curr.setDate(curr.getDate() + 1);
                  }

                  return (
                    <div className="min-w-[800px]">
                      {/* Cabecera de fechas */}
                      <div className="flex border-b-2 border-stone-100 mb-4 pb-2 sticky top-0 bg-white/85 backdrop-blur-md z-40 w-fit">
                        <div className="w-36 shrink-0 py-2 px-4 font-black text-[10px] uppercase text-stone-400 flex items-end sticky left-0 bg-white/90 backdrop-blur-md z-50 border-r border-stone-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          Habitación
                        </div>
                        <div className="flex">
                          {calendarDays.map((d, i) => {
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const isToday = d.toDateString() === new Date().toDateString();
                            return (
                              <div key={i} className={`flex flex-col items-center justify-center py-2 border-l border-stone-200 w-[55px] shrink-0 ${isToday ? "bg-blue-50/80 rounded-t-lg border-blue-200" : isWeekend ? "bg-stone-50/80 rounded-t-lg" : ""}`}>
                                <span className={`text-[9px] font-bold uppercase ${isToday ? "text-blue-600" : isWeekend ? "text-[#d97706]" : "text-stone-400"}`}>
                                  {d.toLocaleDateString("es-PE", { weekday: "short" }).replace(".","")}
                                </span>
                                <span className={`text-sm font-black ${isToday ? "text-blue-700 bg-blue-100/50 px-2 rounded-md" : isWeekend ? "text-[#d97706]" : "text-stone-800"}`}>
                                  {d.getDate()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Filas de habitaciones */}
                      <div className="flex flex-col gap-2">
                        {rooms?.map((room) => {
                          // Filtrar reservas que se cruzan con este rango en esta habitación
                          const roomBookings = allBookings?.filter(b => 
                            b.room_id === room.id && 
                            b.status !== "cancelled" && b.status !== "cancelada" &&
                            new Date(b.check_in + "T00:00:00") <= calendarEndDate &&
                            new Date(b.check_out + "T00:00:00") >= calendarStartDate
                          ) || [];

                          return (
                            <div key={room.id} className="flex items-center bg-white rounded-xl border border-stone-100 relative group h-14 hover:border-stone-200 transition-colors shadow-sm mb-1.5 w-fit">
                              {/* Nombre Habitación */}
                              <div className="w-36 shrink-0 px-4 font-bold text-xs text-stone-800 border-r border-stone-200 bg-white h-full rounded-l-xl flex flex-col justify-center z-30 sticky left-0 shadow-[2px_0_10px_rgba(0,0,0,0.03)] group-hover:bg-stone-50/50 transition-colors">
                                <span className="truncate">{room.name}</span>
                                <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 mt-0.5">#{room.room_number || room.id}</span>
                              </div>
                              
                              {/* Track de Días */}
                              <div className="flex h-full relative">
                                {calendarDays.map((d, i) => {
                                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                  const isToday = d.toDateString() === new Date().toDateString();
                                  return (
                                    <div key={i} className={`border-r border-stone-200 w-[55px] shrink-0 transition-colors relative ${isToday ? "bg-blue-50/20" : isWeekend ? "bg-stone-50/50" : "hover:bg-stone-50/30"}`}>
                                      {isToday && (
                                        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)] z-20 pointer-events-none" />
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Bloques de Reservas */}
                                {roomBookings.map(booking => {
                                  const bIn = new Date(booking.check_in + "T00:00:00");
                                  const bOut = new Date(booking.check_out + "T00:00:00");
                                  
                                  const startOffset = Math.max(0, (bIn.getTime() - calendarStartDate.getTime()) / (1000 * 60 * 60 * 24));
                                  const endOffset = Math.min(totalDays, (bOut.getTime() - calendarStartDate.getTime()) / (1000 * 60 * 60 * 24));
                                  
                                  const leftPx = startOffset * 55;
                                  const widthPx = (endOffset - startOffset) * 55;
                                  
                                  const isPaid = booking.status === "pagado" || booking.status === "approved" || booking.total_price <= (booking.amount_paid || 0);

                                  return (
                                    <div
                                      key={booking.id}
                                      className={`absolute top-2 bottom-2 rounded-full flex items-center gap-2 px-1.5 shadow-md overflow-hidden transition-all duration-300 hover:z-30 hover:scale-[1.03] hover:-translate-y-0.5 cursor-pointer border border-white/30 backdrop-blur-sm ${
                                        isPaid 
                                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-emerald-500/30" 
                                          : booking.status === "parcial"
                                          ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-blue-500/30"
                                          : "bg-gradient-to-r from-[#d97706] to-amber-500 text-white shadow-amber-500/30"
                                      }`}
                                      style={{ left: `calc(${leftPx}px + 6px)`, width: `calc(${widthPx}px - 12px)` }}
                                      title={`Huésped: ${booking.client_name} | Ingreso: ${booking.check_in} | Salida: ${booking.check_out}`}
                                    >
                                      {/* Avatar circular con la inicial */}
                                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                                        <span className="text-[9px] font-black">{booking.client_name ? booking.client_name.charAt(0).toUpperCase() : "?"}</span>
                                      </div>
                                      <span className="text-[10px] font-bold tracking-wide truncate drop-shadow-sm leading-none">
                                        {booking.client_name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* --- TAB: ALMACEN / PRODUCTOS --- */}
          {activeTab === "almacen" && (
            <div id="almacen" className="scroll-mt-24 mb-12 animate-fade-in-up">
              <AdminProducts products={products || []} userRole={role} />
            </div>
          )}
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-stone-950 text-white border-t border-stone-800 flex justify-between items-center px-6 py-4 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        {role === "admin" && (
          <Link href={`/admin?tab=resumen&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "resumen" ? "text-amber-500" : "text-stone-400"}`}>
            <TrendingUp size={20} />
            <span className="text-[8px] font-black uppercase">Resumen</span>
          </Link>
        )}
        <Link href={`/admin?tab=estado&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "estado" ? "text-amber-500" : "text-stone-400"}`}>
          <LayoutDashboard size={20} />
          <span className="text-[8px] font-black uppercase">Estado</span>
        </Link>
        <Link href={`/admin?tab=historial&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "historial" ? "text-amber-500" : "text-stone-400"}`}>
          <FileText size={20} />
          <span className="text-[8px] font-black uppercase">Historial</span>
        </Link>
        <Link href={`/admin?tab=calendario&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "calendario" ? "text-amber-500" : "text-stone-400"}`}>
          <CalendarDays size={20} />
          <span className="text-[8px] font-black uppercase">Calendario</span>
        </Link>
        <Link href={`/admin?tab=inventario&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "inventario" ? "text-amber-500" : "text-stone-400"}`}>
          <BedDouble size={20} />
          <span className="text-[8px] font-black uppercase">Cuartos</span>
        </Link>
        <Link href={`/admin?tab=registrar&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "registrar" ? "text-amber-500" : "text-stone-400"}`}>
          <CalendarCheck size={20} />
          <span className="text-[8px] font-black uppercase">Registro</span>
        </Link>
        <Link href={`/admin?tab=almacen&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "almacen" ? "text-amber-500" : "text-stone-400"}`}>
          <ShoppingCart size={20} />
          <span className="text-[8px] font-black uppercase">Almacén</span>
        </Link>
      </nav>
    </div>
  );
}
