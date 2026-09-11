import React from "react";
import QRCode from "react-qr-code";

interface ThermalTicketProps {
  booking: any;
  type: "BOLETA" | "FACTURA" | "NOTA DE CRÉDITO";
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
  const amountPaid = booking.amount_paid ?? total;
  const pendingBalance = Math.max(0, total - amountPaid);

  // Estructura oficial del código QR SUNAT
  let tipoComprobante = '03'; // Boleta
  if (type === 'FACTURA') tipoComprobante = '01';
  if (type === 'NOTA DE CRÉDITO') tipoComprobante = '07';

  let tipoDocumentoCliente = '1'; // DNI
  if (type === 'FACTURA') tipoDocumentoCliente = '6'; // RUC
  // Para nota de crédito asumimos DNI por defecto a menos que tenga 11 dígitos
  if (type === 'NOTA DE CRÉDITO' && booking.customer_document?.length === 11) tipoDocumentoCliente = '6';

  const qrData = `10282984984|${tipoComprobante}|${correlative.split('-')[0]}|${correlative.split('-')[1]}|${igv}|${total.toFixed(2)}|${new Date().toISOString().split('T')[0]}|${tipoDocumentoCliente}|${booking.customer_document || '00000000'}`;

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
        <h2 className="font-bold text-base">{type === "NOTA DE CRÉDITO" ? "NOTA DE CRÉDITO ELECTRÓNICA" : `${type} ELECTRÓNICA`}</h2>
        <p className="text-sm font-bold tracking-widest mt-1">{type === "NOTA DE CRÉDITO" && correlative.startsWith("B") ? correlative.replace("B", "BC") : type === "NOTA DE CRÉDITO" && correlative.startsWith("F") ? correlative.replace("F", "FC") : correlative}</p>
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
        <p><strong>FORMA DE PAGO:</strong> {booking.payment_method || "CONTADO"}</p>
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
          <div className="flex justify-between mt-1">
            <span>MONTO PAGADO:</span>
            <span>S/ {amountPaid.toFixed(2)}</span>
          </div>
          {pendingBalance > 0.009 && (
            <div className="flex justify-between font-bold">
              <span>SALDO PENDIENTE:</span>
              <span>S/ {pendingBalance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center mt-4 border-t border-dashed border-black pt-4">
        <div className="bg-white mb-2">
          <QRCode value={qrData} size={112} level="Q" />
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="font-bold text-sm">¡GRACIAS POR SU PREFERENCIA!</p>
        <p className="mt-2 text-[10px] leading-tight">Representación impresa de la {type} Electrónica.<br />Consulte su comprobante en SUNAT.</p>
      </div>
    </div>
  );
}
