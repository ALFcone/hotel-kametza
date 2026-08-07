import React from "react";

interface ThermalTicketProps {
  booking: any;
  type: "BOLETA" | "FACTURA";
  correlative: string;
}

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

  // Estructura oficial del código QR SUNAT
  const qrData = `10282984984|${type === 'FACTURA' ? '01' : '03'}|${correlative.split('-')[0]}|${correlative.split('-')[1]}|${igv}|${total.toFixed(2)}|${new Date().toISOString().split('T')[0]}|${type === 'FACTURA' ? '6' : '1'}|${booking.customer_document || '00000000'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  return (
    <div id="print-section" className="thermal-ticket hidden print:block text-black bg-white p-4 font-mono text-[11px] w-[302px] mx-auto absolute top-0 left-0 z-[99999] h-screen">
      {/* Header */}
      <div className="text-center mb-2 flex flex-col items-center">
        {/* LOGO DEL HOTEL */}
        <img src="/logoo.png" alt="Logo Kametza" className="w-32 -mb-2 -mt-4 grayscale contrast-200" />
        <h1 className="font-bold text-lg uppercase mb-1">Hotel Kametza</h1>
        <p>MARCELINA BERMUDO ESCALANTE DE RUA</p>
        <p>RUC: 10282984984</p>
        <p>Jir. Las Américas #154, Ayacucho</p>
      </div>

      <div className="border-t border-b border-dashed border-black py-2 mb-4 text-center">
        <h2 className="font-bold text-base uppercase">{type} ELECTRÓNICA</h2>
        <p className="font-bold text-lg tracking-widest">{correlative}</p>
      </div>

      {/* Info */}
      <div className="mb-4 space-y-1">
        <p><strong>FECHA:</strong> {currentDate}</p>
        <p><strong>CLIENTE:</strong> {booking.customer_name}</p>
        <p><strong>{type === "FACTURA" ? "RUC" : "DNI"}:</strong> {booking.customer_document || "00000000"}</p>
        <p><strong>HABITACIÓN:</strong> {booking.room_id}</p>
      </div>

      {/* Details */}
      <table className="w-full mb-4 text-[11px]">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left py-1 w-8">CANT</th>
            <th className="text-left py-1">DESCRIPCIÓN</th>
            <th className="text-right py-1">P.UNIT</th>
            <th className="text-right py-1">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {/* Fila Principal de Alojamiento */}
          <tr>
            <td className="py-2 align-top">{nights}</td>
            <td className="py-2">
              Noche(s) de Alojamiento
              <div className="text-[9px] mt-0.5 opacity-80 leading-tight">
                Del {checkIn.toLocaleDateString("es-PE")} al {checkOut.toLocaleDateString("es-PE")}
              </div>
            </td>
            <td className="text-right py-2 align-top">{(booking.base_price / nights).toFixed(2)}</td>
            <td className="text-right py-2 align-top">{booking.base_price.toFixed(2)}</td>
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
      <div className="border-t border-dashed border-black pt-2 mb-4 flex justify-end">
        <div className="w-full">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>S/ {subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>IGV (18%):</span>
            <span>S/ {igv}</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center mt-4 border-t border-dashed border-black pt-4">
        <img src={qrUrl} alt="QR SUNAT" className="w-28 h-28 mb-2" />
        <p className="text-[9px] text-center w-full break-all leading-tight">{qrData}</p>
      </div>

      <div className="text-center mt-4">
        <p className="font-bold text-sm">¡GRACIAS POR SU PREFERENCIA!</p>
        <p className="mt-2 text-[10px] leading-tight">Representación impresa de la {type} Electrónica.<br/>Consulte su comprobante en SUNAT.</p>
      </div>
    </div>
  );
}
