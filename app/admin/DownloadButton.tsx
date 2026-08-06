"use client";

import { Download } from "lucide-react";

export default function DownloadButton({ data, extrasData }: { data: any[], extrasData?: any[] }) {
  const downloadReport = () => {
    // 1. Definir cabeceras (Agregamos "Documento")
    const headers = [
      "ID",
      "Cliente",
      "Documento",
      "Email",
      "Habitacion",
      "Entrada",
      "Salida",
      "Noches",
      "Costo_Habitacion",
      "Consumos_Extras",
      "Total_Reserva",
      "Monto_Abonado",
      "Saldo_Pendiente",
      "Metodo",
      "Estado",
    ];

    // 2. Construir filas
    const rows = data.map((b) => {
      const cleanName = b.client_name ? b.client_name.replace(/"/g, '""') : "";

      // Calcular noches para el reporte
      const start = new Date(b.check_in);
      const end = new Date(b.check_out);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      // Formatear documento (Ej: "DNI: 12345678")
      const docString = b.document_number
        ? `${b.document_type || "DNI"}: ${b.document_number}`
        : "No registrado";
        
      // Calcular totales
      const bookingExtras = extrasData?.filter((e) => e.booking_id === b.id) || [];
      const extrasTotal = bookingExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
      const grandTotal = (b.total_price || 0) + extrasTotal;
      const amountPaid = b.amount_paid || 0;
      
      // Ajustar abono si el estado era pagado antiguo
      const finalPaid = (b.status === "pagado" || b.status === "approved" || grandTotal <= amountPaid) ? grandTotal : amountPaid;
      const balance = grandTotal - finalPaid;

      return [
        b.id,
        `"${cleanName}"`,
        `"${docString}"`, // <--- NUEVA COLUMNA
        b.client_email || "N/A",
        b.room_id,
        b.check_in,
        b.check_out,
        nights,
        b.total_price || 0,
        extrasTotal,
        grandTotal,
        finalPaid,
        balance,
        b.payment_method || "N/A",
        b.status,
      ].join(";");
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

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
      className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-black transition shadow-md font-bold text-xs"
    >
      <Download size={16} /> Descargar Reporte Excel
    </button>
  );
}
