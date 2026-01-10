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

  // --- VISTA PARA STAFF / ADMIN (COLORES DE TRABAJO) ---
  if (role === "admin" || role === "staff") {
    return (
      <div
        className={`min-h-screen ${
          role === "admin" ? "bg-slate-50" : "bg-blue-50"
        } p-6 md:p-12 font-sans`}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header de Gestión */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${
                  role === "admin" ? "bg-red-600" : "bg-blue-600"
                } text-white`}
              >
                {role === "admin" ? <ShieldCheck /> : <Briefcase />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Panel de {role === "admin" ? "Administración" : "Recepción"}
                </h1>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="/"
                className="p-3 hover:bg-slate-100 rounded-xl transition"
              >
                <Home size={20} />
              </a>
              <button
                onClick={handleLogout}
                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-700 mb-6 uppercase tracking-widest flex items-center gap-2">
            <Eye size={18} /> Todas las Reservas
          </h2>

          <div className="grid gap-4">
            {data.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={b.rooms?.image_url}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {b.client_name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {b.rooms?.name} • {b.check_in} al {b.check_out}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 uppercase">
                      S/ {b.total_price}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                        b.status === "pagado"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {b.status === "pagado" ? "PAGADO" : "PENDIENTE"}
                    </span>
                  </div>
                  {role === "admin" && (
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition">
                      <ShieldCheck size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
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
