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
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Pedimos 'room_number' para saber qué cuarto es
      const { data: bData } = await supabase
        .from("bookings")
        .select(`*, rooms(name, room_number)`)
        .order("created_at", { ascending: false });
      const { data: rData } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number"); // Ordenar por número

      if (bData) setBookings(bData);
      if (rData) setRooms(rData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Excel con Números de Habitación
  const downloadReport = () => {
    if (bookings.length === 0) return alert("Sin datos");
    const sep = ";";
    const headers = [
      "ID",
      "Cliente",
      "Email",
      "Habitación",
      "NUMERO",
      "Entrada",
      "Salida",
      "Total",
    ].join(sep);
    const rows = bookings.map((b) =>
      [
        b.id,
        `"${b.client_name || ""}"`,
        `"${b.client_email || ""}"`,
        `"${b.rooms?.name || ""}"`,
        b.rooms?.room_number, // Columna Clave
        b.check_in,
        b.check_out,
        b.total_price,
      ].join(sep)
    );
    const csv = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const activeBookings = bookings.filter(
    (b) =>
      b.check_in <= new Date().toISOString().split("T")[0] &&
      b.check_out >= new Date().toISOString().split("T")[0]
  );
  const occupiedIds = activeBookings.map((b) => b.room_id);
  const totalRev = bookings.reduce((a, c) => a + (c.total_price || 0), 0);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-rose-900 font-bold">
        Cargando Admin...
      </div>
    );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <nav className="bg-gradient-to-r from-rose-900 to-rose-800 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl flex items-center gap-2">
            <BedDouble /> KAMETZA MANAGER
          </h1>
          <Link
            href="/"
            className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30"
          >
            Ir a Web
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow border border-emerald-100">
            <div className="text-xs text-stone-400 font-bold">INGRESOS</div>
            <div className="text-xl font-bold text-emerald-700">
              S/ {totalRev}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-rose-100">
            <div className="text-xs text-stone-400 font-bold">OCUPACIÓN</div>
            <div className="text-xl font-bold text-rose-700">
              {Math.round((activeBookings.length / rooms.length) * 100)}%
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* GRID DE HABITACIONES (Con Números Gigantes) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow border border-stone-100 h-fit">
            <h2 className="font-bold mb-4 flex gap-2 items-center">
              <CheckCircle size={18} className="text-rose-700" /> Estado Actual
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {rooms.map((room) => {
                const isOccupied = occupiedIds.includes(room.id);
                return (
                  <div
                    key={room.id}
                    className={`p-2 rounded-lg border text-center ${
                      isOccupied
                        ? "bg-rose-100 border-rose-300"
                        : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <div className="text-lg font-black text-stone-800">
                      {room.room_number}
                    </div>
                    <div className="text-[9px] uppercase truncate text-stone-500">
                      {room.name.split(" ")[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLA DE RESERVAS */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow border border-stone-100 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold flex gap-2">
                <Clock size={18} className="text-rose-700" /> Reservas
              </h2>
              <button
                onClick={downloadReport}
                className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded flex gap-2"
              >
                <Download size={12} /> Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 text-[10px] uppercase text-stone-500 font-bold">
                  <tr>
                    <th className="p-4">Huésped</th>
                    <th className="p-4">Habitación</th>
                    <th className="p-4">Fechas</th>
                    <th className="p-4 text-right">$$$</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50">
                      <td className="p-4 font-bold">
                        {b.client_name || "Sin Nombre"}
                      </td>
                      <td className="p-4">
                        <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold border border-stone-300">
                          Hab. {b.rooms?.room_number}
                        </span>
                      </td>
                      <td className="p-4 text-xs">
                        Del {b.check_in} al {b.check_out}
                      </td>
                      <td className="p-4 text-right font-bold">
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
