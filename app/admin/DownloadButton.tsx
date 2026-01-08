"use client";

import { Download } from "lucide-react";

export default function DownloadButton({ data }: { data: any[] }) {
  const downloadReport = () => {
    // Convertir datos a CSV
    const headers = [
      "ID",
      "Cliente",
      "Email",
      "Habitacion",
      "Entrada",
      "Salida",
      "Total",
      "Metodo",
      "Estado",
    ];
    const rows = data.map((b) => [
      b.id,
      `"${b.client_name}"`, // Comillas para evitar errores con tildes/comas
      b.client_email,
      b.room_id,
      b.check_in,
      b.check_out,
      b.total_price,
      b.payment_method,
      b.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `reporte_hotel_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={downloadReport}
      className="flex items-center gap-2 bg-stone-800 text-white px-5 py-3 rounded-xl hover:bg-black transition shadow-lg font-bold text-sm"
    >
      <Download size={18} /> Descargar Reporte Completo
    </button>
  );
}
