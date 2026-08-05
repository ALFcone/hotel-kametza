"use client";
/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/dashboard/page.tsx
 * PROPÓSITO: Panel Privado del Huésped (Cliente). Aquí ven sus reservas
 *            pasadas y futuras, pueden cancelarlas y ver el estado de
 *            sus pagos.
 * ---------------------------------------------------------------------
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cancelBooking } from "../actions";
import {
  CalendarDays,
  CreditCard,
  Clock,
  ArrowRight,
  LogOut,
  BedDouble,
  Home,
  XCircle,
  Ban,
  TrendingUp,
  Moon,
  Wallet,
  CalendarCheck,
  Filter,
  Sparkles,
  MapPin,
  AlertTriangle,
  X,
} from "lucide-react";

// ==============================================================================
// HELPERS
// ==============================================================================

/** Saludo dinámico según hora del día */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

/** Nombre corto del usuario */
function getDisplayName(user: any): string {
  if (!user) return "Viajero";
  const rawName = user.user_metadata?.full_name || user.email || "Viajero";
  const firstName = rawName.split(" ")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

/** Inicial del usuario para el avatar */
function getInitial(user: any): string {
  return getDisplayName(user).charAt(0).toUpperCase();
}

/** Fecha actual formateada */
function getTodayFormatted(): string {
  return new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Formatear fecha corta */
function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Calcular estadísticas de las reservas */
function getStats(bookings: any[]) {
  const active = bookings.filter((b) => b.status !== "cancelled");
  const totalSpent = active.reduce((sum, b) => sum + (b.total_price || 0), 0);

  // Calcular noches totales
  const totalNights = active.reduce((sum, b) => {
    if (b.check_in && b.check_out) {
      const diff =
        new Date(b.check_out).getTime() - new Date(b.check_in).getTime();
      return sum + Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return sum + 1;
  }, 0);

  // Próximo check-in
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = active
    .filter((b) => new Date(b.check_in) >= now)
    .sort(
      (a, b) =>
        new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
    );

  let nextCheckIn: string | null = null;
  let daysUntil: number | null = null;
  if (upcoming.length > 0) {
    nextCheckIn = upcoming[0].check_in;
    daysUntil = Math.ceil(
      (new Date(upcoming[0].check_in).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  return {
    total: bookings.length,
    active: active.length,
    totalSpent,
    totalNights,
    nextCheckIn,
    daysUntil,
  };
}

/** Color & texto por estado */
function getStatusConfig(status: string) {
  switch (status) {
    case "confirmed":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        label: "Confirmada",
      };
    case "pendiente":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        label: "Pendiente",
      };
    case "cancelled":
      return {
        bg: "bg-amber-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-amber-500",
        label: "Cancelada",
      };
    default:
      return {
        bg: "bg-stone-50",
        text: "text-stone-600",
        border: "border-stone-200",
        dot: "bg-stone-400",
        label: status,
      };
  }
}

// ==============================================================================
// SUB-COMPONENTS
// ==============================================================================

/** Skeleton Loader Premium */
function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full animate-shimmer" />
            <div>
              <div className="h-4 w-24 rounded-full animate-shimmer mb-3" />
              <div className="h-8 w-56 rounded-full animate-shimmer mb-2" />
              <div className="h-3 w-40 rounded-full animate-shimmer" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-11 w-28 rounded-full animate-shimmer" />
            <div className="h-11 w-24 rounded-full animate-shimmer" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl animate-shimmer"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-28 rounded-full animate-shimmer" />
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-[2rem] animate-shimmer"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tarjeta de Estadística */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  delay,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  delay: number;
}) {
  return (
    <div
      className={`animate-fade-in-up relative overflow-hidden rounded-2xl p-5 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${gradient}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm p-2 rounded-xl">
            <Icon size={18} className="text-amber-400" />
          </div>
        </div>
        <p className="text-2xl md:text-3xl font-black text-amber-50 mb-0.5">
          {value}
        </p>
        <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">
          {label}
        </p>
        {sub && (
          <p className="text-[10px] text-amber-400/50 mt-1 font-medium">{sub}</p>
        )}
      </div>
    </div>
  );
}

/** Filtro Tabs */
function FilterTabs({
  active,
  onChange,
  counts,
}: {
  active: string;
  onChange: (filter: string) => void;
  counts: { all: number; active: number; pending: number; cancelled: number };
}) {
  const tabs = [
    { key: "all", label: "Todas", count: counts.all },
    { key: "active", label: "Activas", count: counts.active },
    { key: "pending", label: "Pendientes", count: counts.pending },
    { key: "cancelled", label: "Canceladas", count: counts.cancelled },
  ];

  return (
    <div className="animate-fade-in-up flex flex-wrap gap-2 mb-8" style={{ animationDelay: "350ms" }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            active === tab.key
              ? "bg-amber-600 text-amber-50 shadow-lg shadow-amber-900/20"
              : "bg-white text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-700"
          }`}
        >
          {tab.label}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              active === tab.key
                ? "bg-white/20 text-amber-50"
                : "bg-stone-100 text-stone-400"
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Modal de Cancelación Personalizado */
function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  roomName,
  isProcessing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roomName: string;
  isProcessing: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-overlay">
      <div className="modal-content bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-stone-100 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-rose-600" />
        </div>
        <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">
          ¿Cancelar reserva?
        </h3>
        <p className="text-stone-500 text-sm mb-1">
          Estás por cancelar tu reserva en:
        </p>
        <p className="text-amber-600 font-bold text-sm mb-6">{roomName}</p>
        <p className="text-stone-400 text-xs mb-8">
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-5 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
          >
            {isProcessing ? "Procesando..." : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Estado Vacío Premium */
function EmptyState() {
  return (
    <div className="animate-fade-in-up bg-white rounded-[2.5rem] p-12 md:p-16 text-center shadow-xl border border-stone-100 relative overflow-hidden">
      {/* Decorative gradient circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-100/50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="animate-float w-28 h-28 rounded-full bg-gradient-to-br from-rose-100 to-amber-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
          <BedDouble size={48} className="text-amber-600/40" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-800 mb-3">
          Tu próxima aventura te espera
        </h2>
        <p className="text-stone-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Aún no tienes reservas. Explora nuestras habitaciones y vive la
          experiencia Kametza en el corazón de Ayacucho.
        </p>
        <Link
          href="/#habitaciones"
          className="btn-shimmer inline-flex items-center gap-3 bg-amber-600 text-amber-50 px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl hover:shadow-amber-900/30 hover:-translate-y-0.5"
        >
          <Sparkles size={16} />
          Explorar Habitaciones
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ==============================================================================
// MAIN DASHBOARD COMPONENT
// ==============================================================================
export default function Dashboard() {
  const router = useRouter();

  // Estado
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    bookingId: number | null;
    roomName: string;
  }>({ open: false, bookingId: null, roomName: "" });

  // Cargar datos
  useEffect(() => {
    const getData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }
      setUser(user);

      if (user.email === "alfesco86@gmail.com") {
        router.push("/admin");
        return;
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*, rooms(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsData) setBookings(bookingsData);
      setLoading(false);
    };

    getData();
  }, [router]);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Abrir modal de cancelación
  const openCancelModal = (bookingId: number, roomName: string) => {
    setCancelModal({ open: true, bookingId, roomName });
  };

  // Confirmar cancelación
  const confirmCancel = async () => {
    if (!cancelModal.bookingId || !user?.id) return;
    setCancellingId(cancelModal.bookingId);

    const res = await cancelBooking(cancelModal.bookingId);

    if (res?.success) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelModal.bookingId ? { ...b, status: "cancelled" } : b
        )
      );
    } else {
      alert("Error: " + (res?.error || "Desconocido"));
    }
    setCancellingId(null);
    setCancelModal({ open: false, bookingId: null, roomName: "" });
  };

  // Filtrar reservas
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return b.status === "confirmed";
    if (activeFilter === "pending") return b.status === "pendiente";
    if (activeFilter === "cancelled") return b.status === "cancelled";
    return true;
  });

  const filterCounts = {
    all: bookings.length,
    active: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pendiente").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  // ==============================================================================
  // RENDER
  // ==============================================================================
  if (loading) return <SkeletonLoader />;

  const stats = getStats(bookings);

  return (
    <div className="min-h-screen font-sans text-stone-800 relative bg-[#FDFBF7]">
      {/* Fondo Decorativo */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/86/Retablo_ayacuchano.jpg"
          alt="Fondo Textura"
          className="w-full h-full object-cover object-center opacity-[0.08] scale-105 blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF5]/95 via-[#FFFDF5]/90 to-[#FFFDF5]/95" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-16">
        {/* ================================================================
            HEADER: Perfil + Navegación
           ================================================================ */}
        <div className="animate-fade-in-up flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/20 flex-shrink-0">
              <span className="text-white font-black text-2xl">
                {getInitial(user)}
              </span>
            </div>
            <div>
              <span className="text-amber-600 font-bold tracking-widest text-[10px] uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-100 inline-block mb-2">
                Panel de Huésped
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-medium text-stone-900">
                {getGreeting()},{" "}
                <span className="text-amber-600">{getDisplayName(user)}</span>
              </h1>
              <p className="text-stone-400 mt-1 text-sm font-light capitalize">
                {getTodayFormatted()}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 px-5 py-3 rounded-full hover:bg-stone-50 hover:border-stone-300 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm"
            >
              <Home size={16} /> Inicio
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-stone-900 text-amber-50 px-5 py-3 rounded-full hover:bg-amber-600 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-amber-900/20"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        {/* ================================================================
            ESTADÍSTICAS (KPIs)
           ================================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={TrendingUp}
            label="Total Reservas"
            value={stats.total}
            sub={`${stats.active} activa(s)`}
            gradient="bg-gradient-to-br from-amber-500 to-rose-700"
            delay={100}
          />
          <StatCard
            icon={CalendarCheck}
            label="Próximo Check-in"
            value={
              stats.daysUntil !== null
                ? stats.daysUntil === 0
                  ? "¡Hoy!"
                  : `${stats.daysUntil}d`
                : "—"
            }
            sub={
              stats.nextCheckIn ? formatDate(stats.nextCheckIn) : "Sin próximas"
            }
            gradient="bg-gradient-to-br from-stone-900 to-stone-950"
            delay={180}
          />
          <StatCard
            icon={Moon}
            label="Noches Totales"
            value={stats.totalNights}
            sub="Noches reservadas"
            gradient="bg-gradient-to-br from-stone-900 to-stone-950"
            delay={260}
          />
          <StatCard
            icon={Wallet}
            label="Total Invertido"
            value={`S/ ${stats.totalSpent}`}
            sub="En estancias"
            gradient="bg-gradient-to-br from-stone-900 to-stone-950"
            delay={340}
          />
        </div>

        {/* ================================================================
            FILTROS + LISTA DE RESERVAS
           ================================================================ */}
        {bookings.length > 0 ? (
          <>
            <FilterTabs
              active={activeFilter}
              onChange={setActiveFilter}
              counts={filterCounts}
            />

            {filteredBookings.length > 0 ? (
              <div className="grid gap-5">
                {filteredBookings.map((booking, index) => {
                  const statusConf = getStatusConfig(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${400 + index * 80}ms` }}
                    >
                      <div
                        className={`group bg-white rounded-[2rem] p-5 md:p-7 shadow-lg border border-stone-100/80 flex flex-col md:flex-row gap-6 items-center relative overflow-hidden transition-all duration-500 ${
                          booking.status === "cancelled"
                            ? "opacity-70 grayscale-[0.3]"
                            : "hover:shadow-xl hover:-translate-y-0.5 hover:border-stone-200"
                        }`}
                      >
                        {/* Accent line */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[2rem] ${
                            booking.status === "confirmed"
                              ? "bg-emerald-500"
                              : booking.status === "pendiente"
                              ? "bg-amber-500"
                              : "bg-stone-300"
                          }`}
                        />

                        {/* Imagen Habitación */}
                        <div className="w-full md:w-44 h-32 rounded-2xl overflow-hidden shadow-md relative z-10 flex-shrink-0">
                          {booking.rooms?.image_url ? (
                            <img
                              src={booking.rooms.image_url}
                              alt={booking.rooms?.name || "Habitación"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                              <BedDouble className="text-stone-300" size={36} />
                            </div>
                          )}
                          {booking.status === "cancelled" && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Ban className="text-amber-50/80" size={28} />
                            </div>
                          )}
                        </div>

                        {/* Detalles Reserva */}
                        <div className="flex-1 w-full relative z-10">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                            <div>
                              <h3 className="text-lg md:text-xl font-serif font-bold text-amber-600 mb-0.5">
                                {booking.rooms?.name || "Habitación"}
                              </h3>
                              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                                TICKET: RES-
                                {(booking.id + 100)
                                  .toString()
                                  .padStart(5, "0")}
                              </p>
                            </div>
                            {/* Status Badge */}
                            <span
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}
                              />
                              {statusConf.label}
                            </span>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 mt-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-stone-50 p-2 rounded-xl text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors duration-300">
                                <CalendarDays size={16} />
                              </div>
                              <div>
                                <p className="text-[10px] text-stone-400 font-bold uppercase">
                                  Llegada
                                </p>
                                <p className="text-sm font-bold text-stone-700">
                                  {formatDate(booking.check_in)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="bg-stone-50 p-2 rounded-xl text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors duration-300">
                                <Clock size={16} />
                              </div>
                              <div>
                                <p className="text-[10px] text-stone-400 font-bold uppercase">
                                  Salida
                                </p>
                                <p className="text-sm font-bold text-stone-700">
                                  {formatDate(booking.check_out)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                              <div className="bg-stone-50 p-2 rounded-xl text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors duration-300">
                                <CreditCard size={16} />
                              </div>
                              <div>
                                <p className="text-[10px] text-stone-400 font-bold uppercase">
                                  Total
                                </p>
                                <p className="text-lg font-black text-amber-600">
                                  S/ {booking.total_price}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Botón Cancelar */}
                          {booking.status !== "cancelled" && (
                            <div className="mt-5 border-t border-stone-100 pt-4 flex justify-end">
                              <button
                                onClick={() =>
                                  openCancelModal(
                                    booking.id,
                                    booking.rooms?.name || "Habitación"
                                  )
                                }
                                disabled={cancellingId === booking.id}
                                className="flex items-center gap-2 text-rose-600 hover:text-amber-50 border border-rose-200 hover:bg-rose-600 hover:border-rose-600 px-4 py-2.5 rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group/cancel"
                              >
                                <XCircle
                                  size={14}
                                  className="group-hover/cancel:rotate-90 transition-transform duration-300"
                                />
                                Cancelar Reserva
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Sin resultados para el filtro */
              <div className="animate-fade-in-up bg-white rounded-[2rem] p-12 text-center shadow-lg border border-stone-100">
                <Filter size={36} className="text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 font-medium">
                  No tienes reservas con este estado.
                </p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-4 text-amber-600 text-xs font-bold uppercase tracking-wider hover:underline"
                >
                  Ver todas las reservas
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Modal de Cancelación */}
      <CancelModal
        isOpen={cancelModal.open}
        onClose={() =>
          setCancelModal({ open: false, bookingId: null, roomName: "" })
        }
        onConfirm={confirmCancel}
        roomName={cancelModal.roomName}
        isProcessing={cancellingId !== null}
      />
    </div>
  );
}
