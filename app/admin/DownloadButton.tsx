"use client";

import { Download } from "lucide-react";

export default function DownloadButton({ data }: { data: any[] }) {
  const downloadReport = () => {
    // 1. Definir cabeceras
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

    // 2. Construir filas usando PUNTO Y COMA (;) para que Excel Perú lo lea bien
    const rows = data.map((b) => {
      // Limpiamos datos para evitar errores si tienen comillas o saltos de línea
      const cleanName = b.client_name ? b.client_name.replace(/"/g, '""') : "";

      return [
        b.id,
        `"${cleanName}"`, // Ponemos comillas por si el nombre tiene espacios
        b.client_email,
        b.room_id,
        b.check_in,
        b.check_out,
        b.total_price, // Excel reconocerá esto como número si tu sistema usa punto decimal
        b.payment_method,
        b.status,
      ].join(";"); // <--- IMPORTANTE: Separador punto y coma
    });

    // 3. Unir cabecera y filas con saltos de línea
    const csvContent = [headers.join(";"), ...rows].join("\n");

    // 4. Crear Blob con BOM (\uFEFF) para que salgan bien las TILDES y Ñ
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // 5. Crear enlace de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Reporte_Kametza_${new Date().toISOString().split("T")[0]}.csv`
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
      <Download size={18} /> Descargar Reporte Excel
    </button>
  );
}
