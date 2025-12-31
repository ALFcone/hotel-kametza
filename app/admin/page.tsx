"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { updateRoom } from "../actions"; // Importamos la función de servidor
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Users,
  BedDouble,
  Clock,
  Download,
  AlertCircle,
  Search,
  Edit3,
  Save,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Traer reservas
    const { data: bData } = await supabase
      .from("bookings")
      .select(`*, rooms(name, room_number)`)
      .order("created_at", { ascending: false });

    // 2. Traer habitaciones (ordenadas por número)
    const { data: rData } = await supabase
      .from("rooms")
      .select("*")
      .order("id"); // Ordenar por ID para que no salten al editar

    if (bData) setBookings(bData);
    if (rData) setRooms(rData);
    setLoading(false);
  };

  // --- LÓGICA DE FILTRADO Y CÁLCULOS ---
  const filteredBookings = bookings.filter((b) => {
    if (!startDate || !endDate) return true;
    return b.check_in >= startDate && b.check_in <= endDate;
  });

  const totalRevenue = filteredBookings.reduce(
    (acc, curr) => acc + (curr.total_price || 0),
    0
  );

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
    .toISOString()
    .split("T")[0];

  // Avisos de llegadas prontas (Hoy y Mañana)
  const upcomingArrivals = bookings.filter(
    (b) => b.check_in === today || b.check_in === tomorrow
  );

  const activeNow = bookings.filter(
    (b) => b.check_in <= today && b.check_out >= today
  );
  const occupiedIds = activeNow.map((b) => b.room_id);

  const downloadReport = () => {
    const sep = ";";
    const headers = [
      "Cliente",
      "Habitacion",
      "Entrada",
      "Salida",
      "Total",
    ].join(sep);
    const rows = filteredBookings.map((b) =>
      [
        `"${b.client_name}"`,
        b.rooms?.room_number,
        b.check_in,
        b.check_out,
        b.total_price,
      ].join(sep)
    );
    const csv = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.body.appendChild(document.createElement("a"));
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Kametza.csv`;
    link.click();
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-rose-900 font-bold animate-pulse">
        Cargando Gestión...
      </div>
    );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 pb-20">
      {/* NAVBAR ADMIN */}
      <nav className="bg-[#700824] text-white p-4 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl flex items-center gap-2 tracking-tighter">
            <BedDouble /> KAMETZA ADMIN
          </h1>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              className="text-xs bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition"
            >
              Actualizar Datos
            </button>
            <Link
              href="/"
              className="text-xs bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition font-bold"
            >
              Ver Web
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* FILTROS DE FECHA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-stone-400 uppercase mb-2">
              Desde (Check-in)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-stone-400 uppercase mb-2">
              Hasta (Check-in)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="p-2.5 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200"
          >
            <Clock size={18} />
          </button>
          <button
            onClick={downloadReport}
            className="bg-[#700824] text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-rose-900 shadow-lg shadow-rose-900/20"
          >
            <Download size={16} /> Descargar Filtrados
          </button>
        </div>

        {/* KPIs DINÁMICOS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <KpiCard
            title="Ingresos Filtrados"
            value={`S/ ${totalRevenue.toFixed(2)}`}
            icon={<CreditCard />}
            color="emerald"
          />
          <KpiCard
            title="Reservas en Periodo"
            value={filteredBookings.length}
            icon={<Calendar />}
            color="blue"
          />
          <KpiCard
            title="Huéspedes Hoy"
            value={activeNow.length}
            icon={<Users />}
            color="rose"
          />
          <KpiCard
            title="Ocupación"
            value={`${Math.round(
              (activeNow.length / (rooms.length || 1)) * 100
            )}%`}
            icon={<BedDouble />}
            color="amber"
          />
        </div>

        {/* --- NUEVA SECCIÓN: GESTIÓN DE HABITACIONES --- */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 text-[#700824] rounded-lg">
              <Edit3 size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#700824]">
              Gestión de Tarifas y Contenido
            </h2>
          </div>

          <div className="grid gap-4">
            {rooms.map((room) => (
              <form
                key={room.id}
                action={async (formData) => {
                  // Llamada a la Server Action
                  await updateRoom(formData);
                  // Feedback visual y recarga de datos locales
                  alert(
                    `Habitación ${room.room_number} actualizada correctamente.`
                  );
                  fetchData();
                }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-wrap items-end gap-4 hover:shadow-md transition-shadow"
              >
                <input type="hidden" name="roomId" value={room.id} />

                {/* Info Básica */}
                <div className="w-40 pb-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase mb-1">
                    Habitación
                  </p>
                  <p className="font-bold text-lg text-rose-900">{room.name}</p>
                  <p className="text-xs text-stone-500 font-bold bg-stone-100 inline-block px-2 py-0.5 rounded">
                    Nº {room.room_number}
                  </p>
                </div>

                {/* Precio */}
                <div className="w-32">
                  <label className="text-[10px] font-black text-stone-400 uppercase block mb-1">
                    Precio (S/)
                  </label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={room.price_per_night}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-emerald-700 focus:ring-2 focus:ring-[#700824] outline-none"
                  />
                </div>

                {/* Descripción */}
                <div className="flex-1 min-w-[300px]">
                  <label className="text-[10px] font-black text-stone-400 uppercase block mb-1">
                    Descripción Web
                  </label>
                  <textarea
                    name="description"
                    defaultValue={room.description}
                    rows={1}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-[#700824] outline-none resize-none"
                  />
                </div>

                {/* Botón de Acción */}
                <button
                  type="submit"
                  className="bg-stone-800 text-white px-6 py-3.5 rounded-xl text-xs font-bold hover:bg-[#700824] transition shadow-lg flex items-center gap-2"
                >
                  <Save size={16} /> Guardar
                </button>
              </form>
            ))}
          </div>
        </section>

        {/* SECCIÓN INFORMATIVA (MAPA Y TABLA) */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA: LLEGADAS Y ESTADO */}
          <div className="space-y-8">
            {/* PRÓXIMAS LLEGADAS */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-amber-700">
                <AlertCircle size={18} /> Llegadas Próximas
              </h2>
              <div className="space-y-3">
                {upcomingArrivals.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">
                    No hay llegadas para hoy ni mañana.
                  </p>
                ) : (
                  upcomingArrivals.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-bold text-stone-800">
                          {b.client_name}
                        </p>
                        <p className="text-[10px] text-amber-600 font-bold uppercase">
                          {b.check_in === today ? "Llega Hoy" : "Llega Mañana"}
                        </p>
                      </div>
                      <span className="bg-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                        Hab. {b.rooms?.room_number}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* GRID DE HABITACIONES (MAPA VISUAL) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-[#700824]" /> Mapa Visual
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-2 rounded-lg border text-center transition ${
                      occupiedIds.includes(room.id)
                        ? "bg-rose-100 border-rose-300"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <div className="text-sm font-black text-stone-800">
                      {room.room_number}
                    </div>
                    <div
                      className={`w-1.5 h-1.5 mx-auto rounded-full mt-1 ${
                        occupiedIds.includes(room.id)
                          ? "bg-rose-500 animate-pulse"
                          : "bg-emerald-500"
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE RESERVAS */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-4 border-b bg-stone-50 flex justify-between items-center">
              <h3 className="font-bold text-sm">Historial de Reservas</h3>
              <span className="text-[10px] bg-stone-200 px-2 py-1 rounded-full font-bold text-stone-500">
                {filteredBookings.length} Resultados
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 text-[10px] uppercase text-stone-400 font-black border-b">
                  <tr>
                    <th className="p-4">Huésped</th>
                    <th className="p-4">Habitación</th>
                    <th className="p-4">Fechas</th>
                    <th className="p-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-bold text-stone-800">
                          {b.client_name}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {b.client_email}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold bg-stone-100 border px-2 py-1 rounded">
                          H-{b.rooms?.room_number}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-medium">
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                          IN: {b.check_in}
                        </div>
                        <div className="flex items-center gap-1 text-rose-600 font-bold">
                          OUT: {b.check_out}
                        </div>
                      </td>
                      <td className="p-4 text-right font-black text-stone-700">
                        S/ {b.total_price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ title, value, icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div
      className={`bg-white p-5 rounded-2xl border-b-4 ${colors[color]} shadow-sm`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
      </div>
      <div className="text-2xl font-black text-stone-800">{value}</div>
    </div>
  );
}
