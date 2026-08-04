import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toggleRoomCleanliness, updateRoom } from "../actions";
import DownloadButton from "./DownloadButton";
import Link from "next/link";
import WalkInForm from "./WalkInForm";
import { AdminTableActions } from "./AdminTableActions";
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
  Users,
  Building,
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

  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.email !== "alfesco86@gmail.com") {
    console.log("Unauthorized or no user:", user?.email);
    return;
  }

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
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.email !== "alfesco86@gmail.com") return;

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
  const supabaseServer = await getSupabaseServer();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (!user || authError) {
    redirect("/login");
  }

  if (user.email !== "alfesco86@gmail.com") {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || "resumen";

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
  const { data: allBookings } = await supabaseServer
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: allExtras } = await supabaseServer
    .from("booking_extras")
    .select("*")
    .order("created_at", { ascending: false });

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
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <Link href="/" className="flex items-center justify-center gap-2 bg-white/10 text-white/90 py-3 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-all border border-white/10 w-full">
            <Globe size={14} /> Volver a la Web
          </Link>
          <div className="text-[9px] text-amber-300/40 text-center uppercase tracking-widest">
            Hecho con ❤️ en Ayacucho
          </div>
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
                      className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl ${
                        isOccupied
                          ? "bg-gradient-to-br from-stone-900 to-[#d97706] text-white border-stone-900 shadow-lg shadow-amber-900/10"
                          : isCheckout
                          ? "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 border-amber-200 border-dashed"
                          : isDirty
                          ? "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-900/20"
                          : "bg-white border-stone-200/60 text-stone-600 hover:border-amber-900/30"
                      }`}
                    >
                      <span className="absolute -bottom-3 -right-3 text-8xl font-black tracking-tighter opacity-[0.05] select-none group-hover:opacity-[0.1] transition-opacity">
                        {room.room_number || room.id}
                      </span>
                      
                      <div className="z-10 flex justify-between items-start">
                        <div>
                          <p className={`font-bold text-xs uppercase tracking-wider truncate ${isDirty ? "text-white" : ""}`}>
                            {room.name}
                          </p>
                          {info.guest && (
                            <p className={`text-[10px] mt-2 font-semibold italic opacity-85 truncate max-w-[90%] ${isDirty ? "text-white" : ""}`}>
                              {info.guest}
                            </p>
                          )}
                        </div>
                        
                        {/* Botón de Limpieza */}
                        <form action={toggleRoomCleanliness} className="shrink-0 ml-2">
                          <input type="hidden" name="roomId" value={room.id} />
                          {/* Si está sucia (isDirty=true), el nuevo valor debe ser true (limpia). Si está limpia (isDirty=false), el nuevo valor debe ser false (sucia). */}
                          <input type="hidden" name="isClean" value={isDirty.toString()} />
                          <button
                            type="submit"
                            title={isDirty ? "Marcar como Limpia" : "Marcar como Sucia"}
                            className={`p-1.5 rounded-full transition-colors ${
                              isDirty 
                                ? "bg-white text-rose-600 hover:bg-emerald-500 hover:text-white shadow-sm" 
                                : "bg-stone-100 text-stone-400 hover:bg-rose-500 hover:text-white"
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m15 5 4 4" />
                              <path d="M13 14l-8.5 8.5a2.12 2.12 0 0 1-3-3L10 11l4-4 5.5-5.5a2.12 2.12 0 0 1 3 3L17 10l-4 4Z" />
                            </svg>
                          </button>
                        </form>
                      </div>
                      
                      <div className="z-10 mt-4 flex items-center justify-between">
                        <span
                          className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                            info.status === "free" && !isDirty
                              ? "bg-stone-100 text-stone-500"
                              : info.status === "free" && isDirty
                              ? "bg-white text-rose-700 shadow-sm"
                              : isCheckout
                              ? "bg-amber-400 text-stone-900 shadow-sm"
                              : info.paid
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-amber-500 text-white shadow-sm"
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
                <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-white to-stone-50/30">
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
                              <div className="font-mono text-[9px] text-stone-400">SYS-{booking.id}</div>
                              <div className={`font-black text-xs ${isCancelled ? "text-stone-500 line-through" : "text-[#d97706]"}`}>
                                RES-{formatTicket(booking.id)}
                              </div>
                            </td>
                            <td className="py-5 px-6 font-bold text-stone-900 uppercase">
                              {booking.client_name}
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-stone-400 uppercase">{booking.document_type || "DOC"}</span>
                                <span className="font-bold text-stone-850 mt-0.5">{booking.document_number}</span>
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex flex-col gap-0.5 text-[10px]">
                                <span className="text-stone-500 flex items-center gap-1"><Mail size={10} /> {booking.client_email || "—"}</span>
                                <span className="text-emerald-700 font-bold flex items-center gap-1"><Phone size={10} /> {booking.client_phone || "—"}</span>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-[10px] border border-indigo-100">
                                {noches} {noches === 1 ? "noche" : "noches"}
                              </span>
                            </td>
                            <td className="py-5 px-4 text-center font-bold text-stone-900">
                              <span className="bg-stone-100 px-2.5 py-1 rounded-md text-[10px]">
                                #{getRoomNumber(booking.room_id)}
                              </span>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex flex-col font-bold text-[9px] uppercase tracking-wider gap-0.5">
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                  {formatDateShort(booking.check_in)}
                                </span>
                                <span className="text-amber-600 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-amber-500" />
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
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full ${
                                      booking.status === "pagado" || booking.status === "approved" || grandTotal <= (booking.amount_paid || 0)
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        : booking.status === "parcial"
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : "bg-amber-100 text-amber-600 border border-amber-200"
                                    }`}
                                  >
                                    {booking.status === "pagado" || booking.status === "approved" || grandTotal <= (booking.amount_paid || 0) 
                                      ? "Pagado" 
                                      : booking.status === "parcial" 
                                      ? "Parcial" 
                                      : "Pendiente"}
                                  </span>
                                  <span className="text-[9px] font-bold text-stone-500">
                                    Pagado: S/ {(booking.amount_paid || 0).toFixed(2)}
                                  </span>
                                </div>
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
                                onDelete={deleteBooking}
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
                    className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200/60 overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={room.image_url}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      />
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm">
                        #{room.room_number || room.id}
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <h3 className="font-bold text-lg text-stone-900 mb-6 uppercase tracking-tight">
                        {room.name}
                      </h3>
                      
                      <form action={updateRoom} className="space-y-5">
                        <input type="hidden" name="roomId" value={room.id} />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase text-stone-400 block mb-1">
                              Precio por Noche
                            </label>
                            <input
                              name="price"
                              defaultValue={room.price_per_night}
                              type="number"
                              className="w-full p-3.5 bg-stone-50 rounded-xl border border-stone-250 font-bold focus:ring-2 focus:ring-[#d97706]/10 focus:border-[#d97706] outline-none transition text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-stone-400 block mb-1">
                              Cambiar Imagen
                            </label>
                            <input type="hidden" name="oldImage" value={room.image_url || ""} />
                            <input
                              name="image"
                              type="file"
                              accept="image/*"
                              className="w-full bg-stone-50 rounded-xl border border-stone-250 text-[10px] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 outline-none transition"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[9px] font-black uppercase text-stone-400 block mb-1">
                            Descripción
                          </label>
                          <textarea
                            name="description"
                            defaultValue={room.description}
                            className="w-full p-3.5 bg-stone-50 rounded-xl border border-stone-250 text-xs h-24 resize-none focus:ring-2 focus:ring-[#d97706]/10 focus:border-[#d97706] outline-none transition"
                            placeholder="Descripción de la habitación..."
                          />
                        </div>
                        
                        <button className="btn-shimmer w-full bg-stone-900 text-white font-black py-4 rounded-xl hover:bg-[#d97706] transition-all text-[10px] uppercase tracking-widest shadow-md">
                          Guardar Cambios
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
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-stone-950 text-white border-t border-stone-800 flex justify-between items-center px-6 py-4 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <Link href={`/admin?tab=resumen&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "resumen" ? "text-amber-500" : "text-stone-400"}`}>
          <TrendingUp size={20} />
          <span className="text-[8px] font-black uppercase">Resumen</span>
        </Link>
        <Link href={`/admin?tab=estado&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "estado" ? "text-amber-500" : "text-stone-400"}`}>
          <LayoutDashboard size={20} />
          <span className="text-[8px] font-black uppercase">Estado</span>
        </Link>
        <Link href={`/admin?tab=historial&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "historial" ? "text-amber-500" : "text-stone-400"}`}>
          <FileText size={20} />
          <span className="text-[8px] font-black uppercase">Historial</span>
        </Link>
        <Link href={`/admin?tab=inventario&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "inventario" ? "text-amber-500" : "text-stone-400"}`}>
          <BedDouble size={20} />
          <span className="text-[8px] font-black uppercase">Cuartos</span>
        </Link>
        <Link href={`/admin?tab=registrar&from=${dateFrom}&to=${dateTo}`} className={`flex flex-col items-center gap-1 ${activeTab === "registrar" ? "text-amber-500" : "text-stone-400"}`}>
          <CalendarCheck size={20} />
          <span className="text-[8px] font-black uppercase">Registro</span>
        </Link>
      </nav>
    </div>
  );
}
