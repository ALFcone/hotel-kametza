import React from "react";
import QRCode from "react-qr-code";
import { HOTEL_RUC } from "@/lib/site";
import { ZONA_PERU } from "@/lib/fecha-peru";
import {
  type Comprobante,
  NOMBRE_COMPROBANTE,
  NOMBRE_DOC_IDENTIDAD,
  numeroComprobante,
  qrComprobante,
} from "@/lib/cpe";

interface ThermalTicketProps {
  booking: any;
  bookingId: number;
  isCancelled?: boolean;
  // Con un comprobante registrado (XML de SUNAT) se imprime su representación impresa;
  // sin él, un comprobante interno que no se presenta como boleta ni factura.
  comprobante?: Comprobante | null;
}

const fechaPeru = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function ThermalTicket({ booking, bookingId, isCancelled = false, comprobante }: ThermalTicketProps) {
  if (!booking) return null;

  const now = new Date().toLocaleString("es-PE", { timeZone: ZONA_PERU });

  return (
    <div id="print-section" className="thermal-ticket hidden print:block text-black bg-white p-4 font-mono text-[11px] w-[302px] mx-auto absolute top-0 left-0 z-[99999] h-screen">
      {/* Header */}
      <div className="text-center mb-2 flex flex-col items-center">
        {/* LOGO DEL HOTEL */}
        <img src="/logoo.png" alt="Logo Kametza" className="w-32 grayscale" />
        <h1 className="font-bold text-lg uppercase mt-2 mb-1">Hotel Kametza</h1>
        <p>MARCELINA BERMUDO ESCALANTE DE RUA</p>
        <p>RUC: {HOTEL_RUC}</p>
        <p>Jr. Las Américas #154, Ayacucho</p>
      </div>

      {comprobante ? (
        <TicketOficial booking={booking} comprobante={comprobante} />
      ) : (
        <TicketInterno booking={booking} bookingId={bookingId} isCancelled={isCancelled} now={now} />
      )}
    </div>
  );
}

function TicketOficial({ booking, comprobante: c }: { booking: any; comprobante: Comprobante }) {
  const nombre = NOMBRE_COMPROBANTE[c.tipo];
  const etiquetaDoc = (c.cliente_tipo_doc && NOMBRE_DOC_IDENTIDAD[c.cliente_tipo_doc]) || "DOC";
  const moneda = c.moneda === "PEN" ? "S/" : c.moneda;

  return (
    <>
      <div className="border-t border-b border-dashed border-black py-2 mb-4 text-center">
        <h2 className="font-bold text-base">{nombre}</h2>
        <p className="text-sm font-bold tracking-widest mt-1">{numeroComprobante(c)}</p>
      </div>

      <div className="mb-4 space-y-1">
        <p><strong>FECHA EMISIÓN:</strong> {fechaPeru(c.fecha_emision)}</p>
        <p><strong>CLIENTE:</strong> {c.cliente_nombre || "CLIENTE VARIOS"}</p>
        {c.cliente_num_doc && <p><strong>{etiquetaDoc}:</strong> {c.cliente_num_doc}</p>}
        <p><strong>MONEDA:</strong> {c.moneda === "PEN" ? "SOLES (PEN)" : c.moneda}</p>
        {booking.room_id && <p><strong>HABITACIÓN:</strong> {booking.room_id}</p>}
      </div>

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
          {c.items.map((item, index) => (
            <tr key={index}>
              <td className="py-1 align-top">{item.cantidad}</td>
              <td className="py-1 uppercase">{item.descripcion}</td>
              <td className="text-right py-1 align-top">{item.precioUnitario.toFixed(2)}</td>
              <td className="text-right py-1 align-top">{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black pt-3 mb-4 space-y-1">
        {c.total_gravado !== null && (
          <div className="flex justify-between">
            <span>OP. GRAVADAS:</span>
            <span>{moneda} {Number(c.total_gravado).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>IGV:</span>
          <span>{moneda} {Number(c.igv).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-2 border-t border-black pt-1">
          <span>IMPORTE TOTAL:</span>
          <span>{moneda} {Number(c.total).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col items-center mt-4 border-t border-dashed border-black pt-4">
        <div className="bg-white mb-2">
          <QRCode value={qrComprobante(c)} size={112} level="Q" />
        </div>
        {c.hash && <p className="text-[10px] break-all text-center">Resumen: {c.hash}</p>}
      </div>

      <div className="text-center mt-4">
        <p className="font-bold text-sm">¡GRACIAS POR SU PREFERENCIA!</p>
        <p className="mt-2 text-[10px] leading-tight">
          Representación impresa de la {nombre.toLowerCase()}.<br />
          Consulte su validez en www.sunat.gob.pe
        </p>
      </div>
    </>
  );
}

function TicketInterno({ booking, bookingId, isCancelled, now }: { booking: any; bookingId: number; isCancelled: boolean; now: string }) {
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = Math.ceil(Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;

  const total = booking.total_price || 0;
  const roomTotal = booking.base_price ?? total;
  const amountPaid = booking.amount_paid ?? total;
  const pendingBalance = Math.max(0, total - amountPaid);

  return (
    <>
      <div className="border-t border-b border-dashed border-black py-2 mb-4 text-center">
        <h2 className="font-bold text-base">COMPROBANTE INTERNO DE PAGO</h2>
        <p className="text-[10px] mt-1">NO VÁLIDO COMO BOLETA NI FACTURA</p>
        <p className="text-sm font-bold tracking-widest mt-1">RESERVA N.° {bookingId.toString().padStart(6, "0")}</p>
        {isCancelled && <p className="font-bold mt-1">RESERVA ANULADA</p>}
      </div>

      <div className="mb-4 space-y-1">
        <p><strong>FECHA:</strong> {now.split(",")[0]}</p>
        <p><strong>HORA:</strong> {now.split(",")[1] || ""}</p>
        <p><strong>CLIENTE:</strong> {booking.customer_name || "CLIENTE GENERAL"}</p>
        {booking.customer_document && <p><strong>DOC.:</strong> {booking.customer_document}</p>}
        {booking.customer_address && <p><strong>DIRECCIÓN:</strong> {booking.customer_address}</p>}
        <p><strong>FORMA DE PAGO:</strong> {booking.payment_method || "CONTADO"}</p>
        <p><strong>HABITACIÓN:</strong> {booking.room_id} {booking.room_type ? `(${booking.room_type})` : ""}</p>
      </div>

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
          <tr>
            <td className="py-2 align-top font-bold">{nights}</td>
            <td className="py-2">
              <span className="font-bold uppercase">Servicio de Alojamiento</span>
              <div className="text-[10px] mt-0.5 opacity-90 leading-tight">
                {/* check_in/check_out son fechas sin hora (medianoche UTC): se muestran en UTC para no restar un día */}
                Del {checkIn.toLocaleDateString("es-PE", { timeZone: "UTC" })} al {checkOut.toLocaleDateString("es-PE", { timeZone: "UTC" })}
              </div>
            </td>
            <td className="text-right py-2 align-top">{(roomTotal / nights).toFixed(2)}</td>
            <td className="text-right py-2 align-top font-bold">{Number(roomTotal).toFixed(2)}</td>
          </tr>
          {booking.extras?.map((extra: any, index: number) => (
            <tr key={`extra-${index}`}>
              <td className="py-1 align-top">{extra.quantity}</td>
              <td className="py-1">{extra.item_name}</td>
              <td className="text-right py-1 align-top">{Number(extra.price).toFixed(2)}</td>
              <td className="text-right py-1 align-top">{(extra.price * extra.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black pt-3 mb-4 space-y-1">
        <div className="flex justify-between font-bold text-sm">
          <span>IMPORTE TOTAL:</span>
          <span>S/ {Number(total).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>MONTO PAGADO:</span>
          <span>S/ {Number(amountPaid).toFixed(2)}</span>
        </div>
        {pendingBalance > 0.009 && (
          <div className="flex justify-between font-bold">
            <span>SALDO PENDIENTE:</span>
            <span>S/ {pendingBalance.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="text-center mt-4">
        <p className="font-bold text-sm">¡GRACIAS POR SU PREFERENCIA!</p>
        <p className="mt-2 text-[10px] leading-tight">Solicite su boleta o factura electrónica en recepción.</p>
      </div>
    </>
  );
}
