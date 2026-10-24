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

// Una fila de la tabla public.comprobantes (sin el XML, que no hace falta para imprimir).
export interface Comprobante {
  id: number;
  booking_id: number | null;
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
  "id, booking_id, tipo, serie, numero, fecha_emision, emisor_ruc, cliente_tipo_doc, cliente_num_doc, cliente_nombre, moneda, total_gravado, igv, total, hash, items, created_at";

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
