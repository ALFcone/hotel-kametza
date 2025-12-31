"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Users,
  BedDouble,
  Clock,
  Download,
  Search,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos al entrar
  useEffect(() => {
    const fetchData = async () => {
      // Traer Reservas
      const { data: bData } = await supabase
        .from("bookings")
        .select(`*, rooms(name)`)
        .order("created_at", { ascending: false });

      // Traer Habitaciones
      const { data: rData } = await supabase
        .from("rooms")
        .select("*")
        .order("id");

      if (bData) setBookings(bData);
      if (rData) setRooms(rData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // 2. Lógica para Descargar Excel/CSV
   const downloadReport = () => {
    if (bookings.length === 0) return alert("No hay datos para descargar");

    // Usamos PUNTO Y COMA (;) que es lo que Excel en español detecta para columnas
    const separator = ";";
    
    // Encabezados
    const headers = [
      "ID Reserva", 
      "Nombre Huesped", 
      "Email", 
      "Habitacion", 
      "Entrada", 
      "Salida", 
      "Total Pago", 
      "Fecha Creacion"
    ].join(separator);
    
    // Filas de datos
    const rows = bookings.map(b => {
      // Limpiamos los datos para evitar errores si son nulos
      const nombre = b.guest_name ? b.guest_name.replace(/;/g, "") : "Sin Nombre";
      const email = b.email ? b.email : "Sin Email";
      const habitacion = b.rooms?.name ? b.rooms.name : "Hab. General";
      
      return [
        b.id,
        `"${nombre}"`,      // Entre comillas por si tiene espacios
        `"${email}"`,
        `"${habitacion}"`,
        b.check_in,
        b.check_out,
        b.total_price,
        b.created_at
      ].join(separator);
    });

    // Unir todo con el BOM (\uFEFF) para que Excel reconozca tildes y ñ
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Reporte_Kametza_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

    // Cabeceras del CSV
    const headers = [
      "ID Reserva, Nombre Huesped, Email, Habitacion, Entrada, Salida, Total Pago, Fecha Creacion",
    ];

    // Filas de datos
    const rows = bookings.map(
      (b) =>
        `${b.id},"${b.guest_name}","${b.email}","${b.rooms?.name || "N/A"}",${
          b.check_in
        },${b.check_out},${b.total_price},${b.created_at}`
    );

    // Unir todo y crear archivo blob
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Crear link invisible y dar click
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Reporte_Kametza_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Cálculos de KPIs
  const totalRevenue = bookings.reduce(
    (acc, curr) => acc + (curr.total_price || 0),
    0
  );
  const today = new Date().toISOString().split("T")[0];
  const activeBookings = bookings.filter(
    (b) => b.check_in <= today && b.check_out >= today
  );
  const occupiedRoomIds = activeBookings.map((b) => b.room_id);

  const roomStatusList = rooms.map((room) => ({
    ...room,
    status: occupiedRoomIds.includes(room.id) ? "occupied" : "available",
  }));

  const occupancyRate =
    rooms.length > 0
      ? Math.round((activeBookings.length / rooms.length) * 100)
      : 0;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-rose-900">
        <div className="animate-pulse flex flex-col items-center">
          <BedDouble size={48} />
          <p className="mt-4 font-bold">Cargando Sistema...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-20">
      {/* --- HEADER PREMIUM CON DEGRADADO --- */}
      <nav className="bg-gradient-to-r from-rose-900 to-rose-800 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                <BedDouble size={28} className="text-rose-100" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-xl tracking-wide">
                  KAMETZA
                </h1>
                <p className="text-[10px] text-rose-200 uppercase tracking-widest font-semibold">
                  Manager Console
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">Administrador</p>
                <p className="text-xs text-rose-200">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <Link
                href="/"
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition backdrop-blur-sm border border-white/10"
              >
                Ir a Web Pública &rarr;
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* --- KPI SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <KpiCard
            title="Ingresos Totales"
            value={`S/ ${totalRevenue}`}
            icon={<CreditCard size={24} />}
            color="emerald"
          />
          <KpiCard
            title="Reservas Totales"
            value={bookings.length}
            icon={<Calendar size={24} />}
            color="blue"
          />
          <KpiCard
            title="Ocupación Hoy"
            value={`${occupancyRate}%`}
            icon={<BedDouble size={24} />}
            color="rose"
          />
          <KpiCard
            title="Huéspedes Activos"
            value={activeBookings.length}
            icon={<Users size={24} />}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- ESTADO VISUAL DE HABITACIONES --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100">
              <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-md">
                  <CheckCircle size={18} />
                </div>
                Estado Actual
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {roomStatusList.map((room) => (
                  <div
                    key={room.id}
                    className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 group ${
                      room.status === "occupied"
                        ? "border-rose-200 bg-rose-50"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    {/* Indicador visual de estado */}
                    <div
                      className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        room.status === "occupied"
                          ? "bg-rose-500 animate-pulse"
                          : "bg-emerald-500"
                      }`}
                    ></div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                        room.status === "occupied"
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {room.status === "occupied" ? "Ocupada" : "Disponible"}
                    </span>
                    <span className="font-bold text-stone-800 text-lg">
                      {room.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- TABLA DE RESERVAS --- */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-md">
                  <Clock size={18} />
                </div>
                Historial de Reservas
              </h2>

              {/* BOTÓN FUNCIONAL DE DESCARGA */}
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl hover:bg-stone-800 transition shadow-lg hover:shadow-xl active:scale-95 text-sm font-bold"
              >
                <Download size={16} />
                Descargar Excel
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider border-b border-stone-100">
                    <tr>
                      <th className="px-6 py-4">Huésped</th>
                      <th className="px-6 py-4">Habitación</th>
                      <th className="px-6 py-4">Estadía</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-stone-400"
                        >
                          No hay reservas registradas aún.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="hover:bg-rose-50/30 transition duration-150 group"
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold text-stone-800 group-hover:text-rose-900 transition">
                              {booking.guest_name}
                            </p>
                            <p className="text-stone-400 text-xs truncate max-w-[150px]">
                              {booking.email}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-lg text-xs font-semibold border border-stone-200">
                              {booking.rooms?.name || "Hab. General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-stone-600">
                            <div className="flex flex-col text-xs font-medium gap-1">
                              <span className="flex items-center gap-1 text-emerald-600">
                                IN: {booking.check_in}
                              </span>
                              <span className="flex items-center gap-1 text-rose-600">
                                OUT: {booking.check_out}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Confirmada
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-stone-800 text-base">
                            S/ {booking.total_price}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente pequeño para las Tarjetas KPI
function KpiCard({ title, value, icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-stone-200/40 border border-stone-100 hover:-translate-y-1 transition duration-300 flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-stone-800">{value}</h3>
      </div>
    </div>
  );
}
