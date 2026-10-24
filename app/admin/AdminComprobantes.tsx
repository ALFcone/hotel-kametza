"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileUp, Printer, Trash2, Receipt, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { leerComprobanteXml, guardarComprobante, eliminarComprobante } from "../actions";
import { type Comprobante, NOMBRE_COMPROBANTE, NOMBRE_DOC_IDENTIDAD, numeroComprobante } from "@/lib/cpe";
import { BRAND_COLORS } from "@/lib/brand-colors";
import ThermalTicket from "./ThermalTicket";

// SUNAT Operaciones en Línea (pide la Clave SOL en su propia página; nunca pasa por este sistema)
const SUNAT_SOL_URL = "https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm";

export interface ComprobanteListado extends Comprobante {
  habitacion: string;
}

type Lectura = Awaited<ReturnType<typeof leerComprobanteXml>>;
type LecturaOk = Extract<Lectura, { data: unknown }>;

const fechaPeru = (iso: string) => iso.split("-").reverse().join("/");
const soles = (n: number) => `S/ ${Number(n).toFixed(2)}`;

export default function AdminComprobantes({
  comprobantes,
  userRole,
}: {
  comprobantes: ComprobanteListado[];
  userRole?: string | null;
}) {
  const puedeQuitar = userRole === "admin" || userRole === "dueño";

  const inputRef = useRef<HTMLInputElement>(null);
  const [xml, setXml] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [lectura, setLectura] = useState<LecturaOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [reservaId, setReservaId] = useState<string>("");
  const [cargando, setCargando] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [imprimiendo, setImprimiendo] = useState<ComprobanteListado | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!imprimiendo) return;
    // Mismo retardo que el ticket de reservas: deja cargar el logo y el QR antes de imprimir
    const t = setTimeout(() => {
      window.print();
      setTimeout(() => setImprimiendo(null), 500);
    }, 800);
    return () => clearTimeout(t);
  }, [imprimiendo]);

  const limpiar = () => {
    setXml(null);
    setNombreArchivo("");
    setLectura(null);
    setReservaId("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleArchivo = async (file: File | undefined) => {
    setError(null);
    setExito(null);
    setLectura(null);
    if (!file) return;

    setCargando(true);
    try {
      const contenido = await file.text();
      const res = await leerComprobanteXml(contenido);
      if ("error" in res) {
        setError(res.error ?? "No se pudo leer el archivo.");
        setXml(null);
      } else {
        setXml(contenido);
        setNombreArchivo(file.name);
        setLectura(res);
        const sugerida = res.candidatas.find((c) => c.coincide);
        setReservaId(sugerida ? String(sugerida.id) : "");
      }
    } catch {
      setError("No se pudo leer el archivo.");
    }
    setCargando(false);
  };

  const handleGuardar = async () => {
    if (!xml || !lectura) return;
    setCargando(true);
    setError(null);
    const res = await guardarComprobante(xml, reservaId ? Number(reservaId) : null);
    setCargando(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setExito(`${numeroComprobante(lectura.data)} registrado${reservaId ? ` en la reserva #${reservaId}` : ""}.`);
    limpiar();
  };

  const handleQuitar = async (c: ComprobanteListado) => {
    const confirmacion = await Swal.fire({
      title: `¿Quitar ${numeroComprobante(c)}?`,
      text: "Solo se borra del sistema del hotel. En SUNAT el comprobante sigue emitido; para anularlo hay que hacerlo en SUNAT.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: BRAND_COLORS.rose,
      cancelButtonColor: BRAND_COLORS.stoneSoft,
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmacion.isConfirmed) return;
    const res = await eliminarComprobante(c.id);
    if ("error" in res && res.error) setError(res.error);
  };

  const datos = lectura?.data;
  const reservaElegida = lectura?.candidatas.find((c) => String(c.id) === reservaId);
  const totalNoCoincide = !!(datos && reservaElegida && Math.abs(reservaElegida.total - datos.total) >= 0.01);

  return (
    <div className="space-y-6">
      {mounted && imprimiendo && createPortal(
        <ThermalTicket
          booking={{ room_id: imprimiendo.habitacion }}
          bookingId={imprimiendo.booking_id ?? 0}
          comprobante={imprimiendo}
        />,
        document.body
      )}

      {/* Paso a paso + acceso a SUNAT */}
      <section className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h3 className="font-bold text-2xl text-stone-900 tracking-tight">Comprobantes SUNAT</h3>
            <p className="text-stone-500 text-sm mt-1 max-w-prose">
              La boleta o factura se emite en el portal de SUNAT. Aquí subes su XML para imprimir el ticket con el número y el QR oficiales.
            </p>
            <ol className="mt-5 space-y-2 text-sm text-stone-700 list-decimal list-inside">
              <li>Abre SUNAT con tu RUC y Clave SOL, y emite la boleta o factura.</li>
              <li>Descarga el <strong>XML</strong> del comprobante emitido.</li>
              <li>Súbelo abajo, elige la reserva y guárdalo.</li>
            </ol>
          </div>
          <a
            href={SUNAT_SOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-2 min-h-11 px-5 py-3 bg-stone-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition"
          >
            Abrir SUNAT <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
        <p className="text-xs text-stone-500 mt-4">
          SUNAT se abre en otra pestaña. Tu Clave SOL se escribe solo en la página de SUNAT, nunca en este sistema.
        </p>
      </section>

      {/* Subir XML */}
      <section className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)]">
        <h3 className="font-bold text-lg text-stone-900">Registrar comprobante</h3>

        <label
          htmlFor="xml-comprobante"
          className="mt-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/40 transition"
        >
          <FileUp size={28} className="text-stone-400" aria-hidden="true" />
          <span className="text-sm font-bold text-stone-700">
            {cargando ? "Leyendo…" : nombreArchivo || "Elegir archivo XML"}
          </span>
          <span className="text-xs text-stone-500">El archivo .xml que descargaste de SUNAT</span>
        </label>
        <input
          ref={inputRef}
          id="xml-comprobante"
          type="file"
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          disabled={cargando}
          onChange={(e) => handleArchivo(e.target.files?.[0])}
        />

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm">
            <XCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" /> {error}
          </div>
        )}
        {exito && (
          <div role="status" className="mt-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-sm">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" aria-hidden="true" /> {exito}
          </div>
        )}

        {datos && lectura && (
          <div className="mt-6 space-y-5">
            <div className="bg-stone-50 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">{NOMBRE_COMPROBANTE[datos.tipo]}</p>
              <p className="text-xl font-bold text-stone-900 mt-1">{numeroComprobante(datos)}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
                <div><dt className="text-stone-500 text-xs">Fecha de emisión</dt><dd className="font-bold text-stone-800">{fechaPeru(datos.fechaEmision)}</dd></div>
                <div><dt className="text-stone-500 text-xs">Cliente</dt><dd className="font-bold text-stone-800">{datos.clienteNombre || "Cliente varios"}</dd></div>
                {datos.clienteNumDoc && (
                  <div>
                    <dt className="text-stone-500 text-xs">{(datos.clienteTipoDoc && NOMBRE_DOC_IDENTIDAD[datos.clienteTipoDoc]) || "Documento"}</dt>
                    <dd className="font-bold text-stone-800">{datos.clienteNumDoc}</dd>
                  </div>
                )}
                <div><dt className="text-stone-500 text-xs">IGV</dt><dd className="font-bold text-stone-800">{soles(datos.igv)}</dd></div>
                <div><dt className="text-stone-500 text-xs">Importe total</dt><dd className="font-bold text-stone-900 text-base">{soles(datos.total)}</dd></div>
                <div><dt className="text-stone-500 text-xs">Ítems</dt><dd className="font-bold text-stone-800">{datos.items.length}</dd></div>
              </dl>
            </div>

            {lectura.avisos.map((aviso) => (
              <p key={aviso} className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" /> {aviso}
              </p>
            ))}

            <div>
              <label htmlFor="reserva-comprobante" className="block text-[10px] font-black uppercase text-stone-500 mb-1 tracking-wider">
                Enlazar con la reserva
              </label>
              <select
                id="reserva-comprobante"
                value={reservaId}
                onChange={(e) => setReservaId(e.target.value)}
                className="w-full min-h-11 border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold bg-white"
              >
                <option value="">Sin enlazar a una reserva</option>
                {lectura.candidatas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.coincide ? "✓ " : ""}#{c.id} · {c.huesped}{c.habitacion ? ` · Hab. ${c.habitacion}` : ""} · {fechaPeru(c.checkIn)} · {soles(c.total)}{c.cancelada ? " · anulada" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500 mt-1">Con ✓ las que coinciden con el documento del cliente o con el total.</p>
              {totalNoCoincide && reservaElegida && (
                <p className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                  El comprobante es por {soles(datos.total)} y la reserva suma {soles(reservaElegida.total)}. Revisa que sea la reserva correcta.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGuardar}
                disabled={cargando}
                className="min-h-11 px-6 py-3 bg-amber-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-amber-700 transition disabled:opacity-50"
              >
                {cargando ? "Guardando…" : "Guardar comprobante"}
              </button>
              <button
                onClick={limpiar}
                disabled={cargando}
                className="min-h-11 px-6 py-3 bg-stone-100 text-stone-700 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Listado */}
      <section className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)]">
        <h3 className="font-bold text-lg text-stone-900">Comprobantes registrados</h3>
        {comprobantes.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 text-stone-500">
            <Receipt size={32} className="text-stone-300 mb-3" aria-hidden="true" />
            <p className="text-sm">Aún no hay comprobantes registrados.</p>
            <p className="text-xs mt-1">Cuando subas el primer XML aparecerá aquí.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {comprobantes.map((c) => (
              <li key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900">{numeroComprobante(c)}</p>
                  <p className="text-xs text-stone-500 uppercase">
                    {NOMBRE_COMPROBANTE[c.tipo]} · {fechaPeru(c.fecha_emision)}
                  </p>
                  <p className="text-sm text-stone-700 mt-1 truncate">
                    {c.cliente_nombre || "Cliente varios"}
                    {c.booking_id ? ` · Reserva #${c.booking_id}` : " · Sin reserva"}
                    {c.habitacion ? ` · Hab. ${c.habitacion}` : ""}
                  </p>
                </div>
                <p className="font-bold text-stone-900 sm:text-right">{soles(c.total)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImprimiendo(c)}
                    aria-label={`Imprimir ${numeroComprobante(c)}`}
                    className="inline-flex items-center gap-2 min-h-11 px-4 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800"
                  >
                    <Printer size={16} aria-hidden="true" /> Imprimir
                  </button>
                  {puedeQuitar && (
                    <button
                      onClick={() => handleQuitar(c)}
                      aria-label={`Quitar ${numeroComprobante(c)}`}
                      className="inline-flex items-center justify-center min-h-11 min-w-11 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
