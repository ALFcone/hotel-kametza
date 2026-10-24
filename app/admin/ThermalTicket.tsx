import React from "react";
import QRCode from "react-qr-code";
import { HOTEL_RUC } from "@/lib/site";
import { codigoReserva } from "@/lib/reserva";
import {
  type Comprobante,
  NOMBRE_COMPROBANTE,
  NOMBRE_DOC_IDENTIDAD,
  numeroComprobante,
  qrComprobante,
} from "@/lib/cpe";

// Representación impresa de una boleta o factura de SUNAT registrada con su XML.
// Solo se imprime este documento: el hotel no entrega tickets internos.
interface ThermalTicketProps {
  booking: any; // datos de la reserva que no trae el XML (forma de pago, estancia, dirección)
  bookingId: number;
  comprobante: Comprobante;
}

const fechaPeru = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function ThermalTicket({ booking, bookingId, comprobante }: ThermalTicketProps) {

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

      <TicketOficial booking={booking} bookingId={bookingId} comprobante={comprobante} />
    </div>
  );
}

// Los datos fiscales (cliente, ítems, IGV, total) salen del XML de SUNAT.
function TicketOficial({ booking, bookingId, comprobante: c }: { booking: any; bookingId: number; comprobante: Comprobante }) {
  const nombre = NOMBRE_COMPROBANTE[c.tipo];
  const etiquetaDoc = (c.cliente_tipo_doc && NOMBRE_DOC_IDENTIDAD[c.cliente_tipo_doc]) || "DOC.";
  const moneda = c.moneda === "PEN" ? "S/" : c.moneda;

  // Las fechas de la estancia van bajo el ítem de hospedaje
  const estancia = booking.check_in && booking.check_out
    ? `Del ${fechaPeru(booking.check_in)} al ${fechaPeru(booking.check_out)}`
    : null;
  const itemEstancia = Math.max(0, c.items.findIndex((i) => /hosped|aloja|habitac/i.test(i.descripcion)));

  return (
    <>
      <div className="border-t border-b border-dashed border-black py-2 mb-4 text-center">
        <h2 className="font-bold text-base">{nombre}</h2>
        <p className="text-sm font-bold tracking-widest mt-1">{numeroComprobante(c)}</p>
        {bookingId > 0 && <p className="text-[10px] mt-1">RESERVA {codigoReserva(bookingId)}</p>}
      </div>

      <div className="mb-4 space-y-1">
        <p><strong>FECHA:</strong> {fechaPeru(c.fecha_emision)}</p>
        <p><strong>CLIENTE:</strong> {c.cliente_nombre || "CLIENTE VARIOS"}</p>
        {c.cliente_num_doc && <p><strong>{etiquetaDoc}:</strong> {c.cliente_num_doc}</p>}
        {booking.customer_address && <p><strong>DIRECCIÓN:</strong> {booking.customer_address}</p>}
        {/* Sin línea de habitación: el número ya viene en la descripción del XML */}
        {booking.payment_method && <p><strong>FORMA DE PAGO:</strong> {booking.payment_method}</p>}
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
              <td className="py-2 align-top font-bold">{item.cantidad}</td>
              <td className="py-2">
                <span className="font-bold uppercase">{item.descripcion}</span>
                {index === itemEstancia && estancia && (
                  <div className="text-[10px] mt-0.5 opacity-90 leading-tight">{estancia}</div>
                )}
              </td>
              <td className="text-right py-2 align-top">{item.precioUnitario.toFixed(2)}</td>
              <td className="text-right py-2 align-top font-bold">{item.total.toFixed(2)}</td>
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
        <div className="flex justify-between font-bold text-sm mt-1">
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
