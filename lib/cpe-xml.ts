import "server-only";
import { XMLParser } from "fast-xml-parser";
import type { ItemComprobante, TipoComprobante } from "./cpe";

// Lee el XML (UBL 2.1) que entrega SUNAT al emitir en el portal SEE-SOL.
// Solo extrae datos: la validez del comprobante la da SUNAT, no este lector.

export interface DatosXmlComprobante {
  tipo: TipoComprobante;
  serie: string;
  numero: number;
  fechaEmision: string;
  emisorRuc: string;
  emisorNombre: string | null;
  clienteTipoDoc: string | null;
  clienteNumDoc: string | null;
  clienteNombre: string | null;
  moneda: string;
  totalGravado: number | null;
  igv: number;
  total: number;
  hash: string | null;
  items: ItemComprobante[];
}

const MAX_XML_BYTES = 512 * 1024;
const TIPOS: TipoComprobante[] = ["01", "03", "07", "08"];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  removeNSPrefix: true,
  // Sin convertir a número: RUC, DNI y series pueden tener ceros a la izquierda
  parseTagValue: false,
  parseAttributeValue: false,
  htmlEntities: false,
  isArray: (name) => ["InvoiceLine", "CreditNoteLine", "DebitNoteLine", "TaxTotal", "TaxSubtotal"].includes(name),
});

type Nodo = any;

const primero = (v: Nodo) => (Array.isArray(v) ? v[0] : v);

function texto(v: Nodo): string | null {
  v = primero(v);
  if (v === undefined || v === null) return null;
  if (typeof v === "object") v = v["#text"];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function numero(v: Nodo): number | null {
  const s = texto(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// La firma de SUNAT está anidada en UBLExtensions; se busca el primer DigestValue.
function buscar(v: Nodo, clave: string): Nodo {
  if (!v || typeof v !== "object") return undefined;
  if (clave in v) return v[clave];
  for (const hijo of Object.values(v)) {
    const encontrado = buscar(hijo, clave);
    if (encontrado !== undefined) return encontrado;
  }
  return undefined;
}

export function leerXmlComprobante(xml: string): { data: DatosXmlComprobante } | { error: string } {
  if (!xml || Buffer.byteLength(xml, "utf8") > MAX_XML_BYTES) {
    return { error: "El archivo está vacío o es demasiado grande para ser un comprobante." };
  }
  // Un XML de SUNAT nunca declara DOCTYPE ni entidades; rechazarlos evita trucos de expansión.
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) {
    return { error: "El archivo no es un XML de comprobante de SUNAT." };
  }

  let doc: Nodo;
  try {
    doc = parser.parse(xml);
  } catch {
    return { error: "No se pudo leer el archivo. ¿Es el XML descargado de SUNAT?" };
  }

  const raiz = (["Invoice", "CreditNote", "DebitNote"] as const).find((n) => doc?.[n]);
  if (!raiz) return { error: "El XML no es una factura, boleta ni nota electrónica." };
  const r = doc[raiz];

  const tipo = (raiz === "CreditNote" ? "07" : raiz === "DebitNote" ? "08" : texto(r.InvoiceTypeCode)) as TipoComprobante;
  if (!TIPOS.includes(tipo)) return { error: "Tipo de comprobante no reconocido." };

  const id = texto(r.ID);
  const partes = id?.match(/^([A-Z0-9]{4})-(\d{1,8})$/);
  if (!partes) return { error: "El XML no tiene una serie y número válidos." };

  const fechaEmision = texto(r.IssueDate);
  if (!fechaEmision || !/^\d{4}-\d{2}-\d{2}$/.test(fechaEmision)) {
    return { error: "El XML no tiene una fecha de emisión válida." };
  }

  const emisor = primero(r.AccountingSupplierParty);
  const emisorParty = primero(emisor?.Party);
  const emisorRuc = texto(primero(emisorParty?.PartyIdentification)?.ID) ?? texto(emisor?.CustomerAssignedAccountID);
  if (!emisorRuc) return { error: "El XML no indica el RUC del emisor." };

  const cliente = primero(r.AccountingCustomerParty);
  const clienteParty = primero(cliente?.Party);
  const clienteId = primero(primero(clienteParty?.PartyIdentification)?.ID);
  const clienteNumDoc = texto(clienteId) ?? texto(cliente?.CustomerAssignedAccountID);
  const clienteTipoDoc =
    (clienteId && typeof clienteId === "object" ? clienteId["@_schemeID"] : null) ?? texto(cliente?.AdditionalAccountID);

  const totales = primero(r.LegalMonetaryTotal ?? r.RequestedMonetaryTotal);
  const total = numero(totales?.PayableAmount);
  if (total === null || total < 0) return { error: "El XML no indica el importe total." };

  // IGV: el subtotal con código de tributo 1000; si no aparece, el total de impuestos.
  const impuestos = primero(r.TaxTotal);
  const subtotalIgv = (impuestos?.TaxSubtotal ?? []).find(
    (s: Nodo) => texto(primero(primero(s?.TaxCategory)?.TaxScheme)?.ID) === "1000",
  );
  const igv = numero(subtotalIgv?.TaxAmount) ?? numero(impuestos?.TaxAmount) ?? 0;

  const lineas: Nodo[] = r.InvoiceLine ?? r.CreditNoteLine ?? r.DebitNoteLine ?? [];
  const items: ItemComprobante[] = lineas.map((l) => {
    const cantidad = numero(l.InvoicedQuantity ?? l.CreditedQuantity ?? l.DebitedQuantity) ?? 1;
    const precioConIgv = numero(primero(primero(l.PricingReference)?.AlternativeConditionPrice)?.PriceAmount);
    const valorSinIgv = numero(l.LineExtensionAmount) ?? 0;
    const precioUnitario = precioConIgv ?? (cantidad ? valorSinIgv / cantidad : valorSinIgv);
    return {
      descripcion: texto(primero(l.Item)?.Description) ?? "Ítem",
      cantidad,
      precioUnitario: Math.round(precioUnitario * 100) / 100,
      total: Math.round(precioUnitario * cantidad * 100) / 100,
    };
  });

  return {
    data: {
      tipo,
      serie: partes[1],
      numero: Number(partes[2]),
      fechaEmision,
      emisorRuc,
      emisorNombre:
        texto(primero(emisorParty?.PartyLegalEntity)?.RegistrationName) ?? texto(primero(emisorParty?.PartyName)?.Name),
      clienteTipoDoc,
      clienteNumDoc,
      clienteNombre: texto(primero(clienteParty?.PartyLegalEntity)?.RegistrationName),
      moneda: texto(r.DocumentCurrencyCode) ?? "PEN",
      totalGravado: numero(totales?.LineExtensionAmount),
      igv,
      total,
      hash: texto(buscar(r, "DigestValue")),
      items,
    },
  };
}
