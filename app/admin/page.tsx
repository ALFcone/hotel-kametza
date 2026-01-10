"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Users,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  LogOut,
  Home,
  Search,
  Filter,
} from "lucide-react";

export default function StaffAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Verificación básica: Si no hay usuario, fuera.
      // Podrías añadir: if (user.email !== 'tu-staff@mail.com') router.push('/')
      if (!user) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("bookings")
        .select("*, rooms(name)")
        .order("created_at", { ascending: false });

      if (data) setBookings(data);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const filteredBookings = bookings.filter(
    (b) =>
      b.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.document_number?.includes(searchTerm)
  );

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-bold">
        Cargando Panel Staff...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR IZQUIERDO */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-8">
          <h2 className="text-xl font-bold tracking-tighter">
            KAMETZA <span className="text-blue-400">STAFF</span>
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <div className="bg-blue-600 p-3 rounded-xl flex items-center gap-3 cursor-pointer">
            <LayoutDashboard size={20} />{" "}
            <span className="text-sm font-medium">Reservas</span>
          </div>
          <a
            href="/"
            className="p-3 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition text-slate-400"
          >
            <Home size={20} />{" "}
            <span className="text-sm font-medium">Ver Web</span>
          </a>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition"
          >
            <LogOut size={20} />{" "}
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Control de Reservas
            </h1>
            <p className="text-slate-500 text-sm">
              Gestiona los ingresos y pagos del día.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* TABLA DE RESERVAS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[11px] uppercase font-black text-slate-400 tracking-wider">
                <th className="px-6 py-4">Huésped</th>
                <th className="px-6 py-4">Habitación</th>
                <th className="px-6 py-4">Fechas</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700 text-sm">
                      {b.client_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {b.document_type}: {b.document_number}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {b.rooms?.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CalendarIcon size={14} className="text-blue-500" />
                      {b.check_in} - {b.check_out}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {b.status === "pagado" ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                        <CheckCircle size={12} /> Pagado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                        <Clock size={12} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    S/ {b.total_price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
            <div className="p-20 text-center text-slate-400 text-sm italic">
              No se encontraron reservas con esos datos.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
