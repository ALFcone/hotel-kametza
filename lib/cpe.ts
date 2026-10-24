// Comprobantes de pago electrónicos (CPE) emitidos en SUNAT y registrados en el sistema.
// Este archivo no depende del lector de XML, así que también lo puede usar el ticket en el navegador.

export type TipoComprobante = "01" | "03" | "07" | "08";

export const NOMBRE_COMPROBANTE: Record<TipoComprobante, string> = {
  "01": "FACTURA ELECTRÓNICA",
  "03": "BOLETA DE VENTA ELECTRÓNICA",
  "07": "NOTA DE CRÉDITO ELECTRÓNICA",
  "08": "NOTA DE DÉBITO ELECTRÓNICA",
};

// Catálogo 06 de SUNAT (tipo de documento de identidad), solo los que usa un hotel.
export const NOMBRE_DOC_IDENTIDAD: Record<string, string> = {
  "0": "DOC",
  "1": "DNI",
  "4": "C.E.",
  "6": "RUC",
  "7": "PASAPORTE",
};

export interface ItemComprobante {
  descripcion: string;
  cantidad: number;
  precioUnitario: number; // con IGV
  total: number; // con IGV
}

// Una fila de la tabla public.comprobantes (sin el XML, que no hace falta para imprimir),
// con las reservas que cubre (una boleta puede pagar varias habitaciones).
export interface Comprobante {
  id: number;
  reservas: number[];
  tipo: TipoComprobante;
  serie: string;
  numero: number;
  fecha_emision: string;
  emisor_ruc: string;
  cliente_tipo_doc: string | null;
  cliente_num_doc: string | null;
  cliente_nombre: string | null;
  moneda: string;
  total_gravado: number | null;
  igv: number;
  total: number;
  hash: string | null;
  items: ItemComprobante[];
  created_at: string;
}

export const COLUMNAS_COMPROBANTE =
  "id, tipo, serie, numero, fecha_emision, emisor_ruc, cliente_tipo_doc, cliente_num_doc, cliente_nombre, moneda, total_gravado, igv, total, hash, items, created_at, comprobante_reservas(booking_id)";

// Convierte una fila leída con COLUMNAS_COMPROBANTE al tipo Comprobante.
export function aComprobante({ comprobante_reservas, ...fila }: any): Comprobante {
  const reservas = (comprobante_reservas || []).map((r: { booking_id: number }) => r.booking_id);
  return { ...fila, reservas: reservas.sort((a: number, b: number) => a - b) };
}

// Lo que se imprime en el ticket además del XML: datos de las reservas enlazadas.
export interface ComprobanteImpreso extends Comprobante {
  habitaciones: string[];
  formaPago: string; // vacío si no está enlazado a ninguna reserva
  estancias: string[]; // "Del 23/10/2026 al 26/10/2026"; si las fechas difieren, "Hab. 301: del …" por habitación
  totalReservas: number; // suma de las reservas enlazadas (habitación + consumos)
}

export function numeroComprobante(c: Pick<Comprobante, "serie" | "numero">) {
  return `${c.serie}-${String(c.numero).padStart(8, "0")}`;
}

// Contenido del QR de la representación impresa (formato de SUNAT):
// RUC | tipo | serie | número | IGV | total | fecha | tipo doc. cliente | n.° doc. cliente | valor resumen (hash) |
export function qrComprobante(c: Comprobante) {
  return [
    c.emisor_ruc,
    c.tipo,
    c.serie,
    c.numero,
    Number(c.igv).toFixed(2),
    Number(c.total).toFixed(2),
    c.fecha_emision,
    c.cliente_tipo_doc ?? "",
    c.cliente_num_doc ?? "",
    c.hash ?? "",
  ].join("|") + "|";
}
