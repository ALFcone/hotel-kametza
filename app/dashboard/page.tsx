"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  LogOut,
  Home,
  ShieldCheck,
  Briefcase,
  Eye,
} from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"cliente" | "staff" | "admin">("cliente");
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);

      // Determinar ROL
      const userRole =
        user.email === "alfesco86@gmail.com"
          ? "admin"
          : user.user_metadata?.role || "cliente";
      setRole(userRole);

      // Cargar Datos según ROL
      let query = supabase.from("bookings").select("*, rooms(name, image_url)");

      if (userRole === "cliente") {
        query = query.eq("user_id", user.id); // Solo sus reservas
      } else {
        query = query.order("created_at", { ascending: false }); // Todo para staff/admin
      }

      const { data: results } = await query;
      setData(results || []);
      setLoading(false);
    };

    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-rose-900 font-bold animate-pulse">
        Cargando Kametza...
      </div>
    );

  // --- VISTA PROFESIONAL PARA STAFF / ADMIN ---
  if (role === "admin" || role === "staff") {
    const totalMonto = data.reduce((acc, b) => acc + (b.total_price || 0), 0);
    const pendientes = data.filter(
      (b) => b.status !== "pagado" && b.status !== "approved"
    ).length;

    return (
      <div
        className={`min-h-screen ${
          role === "admin" ? "bg-[#f8fafc]" : "bg-[#f0f7ff]"
        } font-sans pb-20`}
      >
        {/* BARRA SUPERIOR */}
        <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  role === "admin" ? "bg-slate-900" : "bg-blue-600"
                } text-white shadow-lg`}
              >
                {role === "admin" ? (
                  <ShieldCheck size={22} />
                ) : (
                  <Briefcase size={22} />
                )}
              </div>
              <div>
                <h1 className="text-slate-900 font-bold leading-tight">
                  Kametza{" "}
                  <span className="text-slate-400 font-normal">
                    | Central de Reservas
                  </span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      role === "admin" ? "bg-red-500" : "bg-blue-500"
                    }`}
                  ></span>
                  {role} Mode
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
              >
                <Home size={20} />
              </a>
              <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg font-bold text-xs hover:bg-rose-100 transition"
              >
                <LogOut size={14} /> Salir
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-8 pt-10">
          {/* TARJETAS DE MÉTRICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider mb-2">
                Total Recaudado
              </p>
              <p className="text-3xl font-bold text-slate-900">
                S/ {totalMonto.toLocaleString()}
              </p>
              <div className="mt-2 text-xs text-emerald-600 font-bold">
                ↑ Ingresos totales
              </div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider mb-2">
                Reservas Totales
              </p>
              <p className="text-3xl font-bold text-slate-900">{data.length}</p>
              <div className="mt-2 text-xs text-slate-500 font-medium">
                En historial
              </div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-wider mb-2">
                Por Confirmar
              </p>
              <p className="text-3xl font-bold text-orange-600">{pendientes}</p>
              <div className="mt-2 text-xs text-orange-500 font-medium italic">
                Acción requerida
              </div>
            </div>
          </div>

          {/* TABLA DE GESTIÓN */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" /> Listado de
                Huéspedes
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar huésped..."
                  className="text-xs border border-slate-200 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Huésped</th>
                    <th className="px-6 py-4">Habitación</th>
                    <th className="px-6 py-4">Estancia</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">
                          {b.client_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {b.client_email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.rooms?.image_url}
                            className="w-8 h-8 rounded-lg object-cover shadow-sm"
                          />
                          <span className="text-xs font-medium text-slate-600">
                            {b.rooms?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {b.check_in} <br /> {b.check_out}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] font-black px-3 py-1 rounded-full ${
                            b.status === "pagado" || b.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {b.status?.toUpperCase() || "PENDIENTE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                        S/ {b.total_price}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // --- VISTA PARA CLIENTE (ESTRUCTURA ORIGINAL KAMETZA) ---
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans">
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-900 shadow-inner">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-rose-950">
                Hola, {user.user_metadata?.full_name || "Viajero"}
              </h1>
              <p className="text-stone-500 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="px-5 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-xs hover:bg-stone-200 transition flex items-center gap-2"
            >
              <Home size={14} /> Inicio
            </a>
            <button
              onClick={handleLogout}
              className="px-5 py-3 bg-rose-50 text-rose-900 rounded-xl font-bold text-xs hover:bg-rose-100 transition flex items-center gap-2"
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        <h2 className="text-xl font-serif font-bold text-stone-700 mb-6 flex items-center gap-2">
          <Calendar className="text-rose-900" size={20} /> Mis Estancias
        </h2>

        <div className="grid gap-6">
          {data.length > 0 ? (
            data.map((booking) => (
              <div
                key={booking.id}
                className="bg-white p-6 rounded-3xl shadow-md border border-stone-100 flex flex-col md:flex-row gap-6 hover:shadow-xl transition duration-300"
              >
                <div className="w-full md:w-40 h-32 rounded-2xl overflow-hidden relative bg-stone-200">
                  {booking.rooms?.image_url && (
                    <img
                      src={booking.rooms.image_url}
                      className="w-full h-full object-cover"
                      alt="Habitación"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-rose-950">
                      {booking.rooms?.name || "Habitación"}
                    </h3>
                    {booking.status === "pagado" ||
                    booking.status === "approved" ? (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle size={12} /> Confirmada
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Clock size={12} /> Pendiente
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-stone-500">
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Llegada
                      </p>
                      <p className="font-bold text-stone-700">
                        {booking.check_in}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Salida
                      </p>
                      <p className="font-bold text-stone-700">
                        {booking.check_out}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Total
                      </p>
                      <p className="font-bold text-rose-900">
                        S/ {booking.total_price}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-bold text-stone-300 mb-1">
                        Pago
                      </p>
                      <p className="capitalize font-medium">
                        {booking.payment_method}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-200">
              <p className="text-stone-400 font-bold mb-4 text-sm">
                Aún no tienes reservas registradas.
              </p>
              <a
                href="/#habitaciones"
                className="text-rose-900 font-bold hover:underline text-sm"
              >
                ¡Reserva ahora!
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
