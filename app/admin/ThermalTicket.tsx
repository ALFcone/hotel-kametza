import React from "react";

interface ThermalTicketProps {
  booking: any;
  type: "BOLETA" | "FACTURA" | "NOTA DE CRÉDITO";
  correlative: string;
}

/**
 * Comprobante interno de pago (piloto). NO es una Boleta/Factura Electronica
 * SUNAT: no se emite ni se envia a SUNAT, es solo constancia de cobro del
 * hotel. Cuando se conecte un facturador electronico real, este ticket debe
 * reemplazarse por el comprobante que devuelva ese proveedor.
 */
export default function ThermalTicket({ booking, type, correlative }: ThermalTicketProps) {
  if (!booking) return null;

  const currentDate = new Date().toLocaleString("es-PE");

  // Calculate nights
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const total = booking.total_price || 0;
  const subtotal = (total / 1.18).toFixed(2);
  const igv = (total - Number(subtotal)).toFixed(2);

  return (
    <div id="print-section" className="thermal-ticket hidden print:block text-black bg-white p-4 font-mono text-[11px] w-[302px] mx-auto absolute top-0 left-0 z-[99999] h-screen">
      {/* Header */}
      <div className="text-center mb-2 flex flex-col items-center">
        {/* LOGO DEL HOTEL */}
        <img src="/logoo.png" alt="Logo Kametza" className="w-32 grayscale" />
        <h1 className="font-bold text-lg uppercase mt-2 mb-1">Hotel Kametza</h1>
        <p>MARCELINA BERMUDO ESCALANTE DE RUA</p>
        <p>RUC: 10282984984</p>
        <p>Jr. Las Américas #154, Ayacucho</p>
      </div>

      <div className="border-t border-b border-dashed border-black py-2 mb-4 text-center">
        <h2 className="font-bold text-base">{type}</h2>
        <p className="text-sm font-bold tracking-widest mt-1">{type === "NOTA DE CRÉDITO" && correlative.startsWith("B") ? correlative.replace("B", "BC") : type === "NOTA DE CRÉDITO" && correlative.startsWith("F") ? correlative.replace("F", "FC") : correlative}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider mt-1">Comprobante interno &middot; no es documento SUNAT</p>
      </div>

      {/* Info */}
      <div className="mb-4 space-y-1">
        <p><strong>FECHA EMISIÓN:</strong> {currentDate.split(",")[0]}</p>
        <p><strong>HORA EMISIÓN:</strong> {currentDate.split(",")[1] || ""}</p>
        <p><strong>CAJERO:</strong> ADMIN</p>
        <p><strong>CLIENTE:</strong> {booking.customer_name || booking.client_name || "CLIENTE GENERAL"}</p>
        <p><strong>{type === "FACTURA" ? "RUC" : "DNI"}:</strong> {booking.customer_document || booking.client_dni || "00000000"}</p>
        {booking.customer_address && <p><strong>DIRECCIÓN:</strong> {booking.customer_address}</p>}
        <p><strong>MONEDA:</strong> SOLES (PEN)</p>
        <p><strong>FORMA DE PAGO:</strong> CONTADO</p>
        <p><strong>HABITACIÓN:</strong> {booking.room_id} {booking.room_type ? `(${booking.room_type})` : ''}</p>
      </div>

      {/* Details */}
      <table className="w-full mb-4 text-[11px] table-fixed break-words">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left py-1 w-8">CANT</th>
            <th className="text-left py-1 w-auto">DESCRIPCIÓN</th>
            <th className="text-right py-1 w-12">P.UNIT</th>
            <th className="text-right py-1 w-12">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {/* Fila Principal de Alojamiento */}
          <tr>
            <td className="py-2 align-top font-bold">{nights}</td>
            <td className="py-2">
              <span className="font-bold uppercase">Servicio de Alojamiento</span>
              <div className="text-[9px] mt-0.5 opacity-90 leading-tight">
                Del {checkIn.toLocaleDateString("es-PE")} al {checkOut.toLocaleDateString("es-PE")}
              </div>
            </td>
            <td className="text-right py-2 align-top">{((booking.total_price || 0) / nights).toFixed(2)}</td>
            <td className="text-right py-2 align-top font-bold">{(booking.total_price || 0).toFixed(2)}</td>
          </tr>

          {/* Filas de Extras (si existen) */}
          {booking.extras && booking.extras.length > 0 && booking.extras.map((extra: any, index: number) => (
            <tr key={`extra-${index}`}>
              <td className="py-1 align-top">{extra.quantity}</td>
              <td className="py-1">{extra.item_name}</td>
              <td className="text-right py-1 align-top">{extra.price.toFixed(2)}</td>
              <td className="text-right py-1 align-top">{(extra.price * extra.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-dashed border-black pt-3 mb-4 flex justify-end">
        <div className="w-full space-y-1">
          <div className="flex justify-between">
            <span>OP. GRAVADAS:</span>
            <span>S/ {subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>IGV (18%):</span>
            <span>S/ {igv}</span>
          </div>
          <div className="flex justify-between">
            <span>OP. EXONERADAS:</span>
            <span>S/ 0.00</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-2 border-t border-black pt-1">
            <span>IMPORTE TOTAL:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 border-t border-dashed border-black pt-4">
        <p className="font-bold text-sm">¡GRACIAS POR SU PREFERENCIA!</p>
        <p className="mt-2 text-[10px] leading-tight">Comprobante interno de pago (piloto).<br />No reemplaza boleta/factura electrónica SUNAT.</p>
      </div>
    </div>
  );
}
