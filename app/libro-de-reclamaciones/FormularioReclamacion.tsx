"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Printer, XCircle } from "lucide-react";
import { registrarReclamacion, type DatosReclamacion } from "../actions";
import { numeroReclamacion, type Reclamacion } from "@/lib/reclamaciones";
import HojaReclamacion from "./HojaReclamacion";

// Sin casillas de aceptación obligatorias: Indecopi no las permite en la hoja.

const VACIO: DatosReclamacion = {
  tipo: "reclamo",
  consumidor_nombre: "",
  consumidor_tipo_doc: "DNI",
  consumidor_num_doc: "",
  consumidor_domicilio: "",
  consumidor_telefono: "",
  consumidor_email: "",
  menor_de_edad: false,
  apoderado_nombre: "",
  bien_tipo: "servicio",
  bien_descripcion: "",
  monto: "",
  codigo_reserva: "",
  detalle: "",
  pedido: "",
  sitio_web: "",
};

const campo =
  "w-full min-h-11 border border-stone-300 rounded-xl px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500";
const etiqueta = "block text-sm font-bold text-stone-800 mb-1";
const grupo = "bg-white rounded-2xl border border-stone-200 p-5 md:p-6 space-y-4";
const leyenda = "font-serif text-lg font-bold text-stone-900 mb-1";

export default function FormularioReclamacion() {
  const [datos, setDatos] = useState<DatosReclamacion>(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoja, setHoja] = useState<Reclamacion | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const constanciaRef = useRef<HTMLDivElement>(null);

  const cambiar = <K extends keyof DatosReclamacion>(clave: K, valor: DatosReclamacion[K]) =>
    setDatos((d) => ({ ...d, [clave]: valor }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const res = await registrarReclamacion(datos);
    setEnviando(false);

    if ("error" in res) {
      setError(res.error ?? "No se pudo registrar la hoja.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setHoja({
      id: res.id,
      created_at: res.created_at,
      tipo: datos.tipo as Reclamacion["tipo"],
      consumidor_nombre: datos.consumidor_nombre.trim(),
      consumidor_tipo_doc: datos.consumidor_tipo_doc,
      consumidor_num_doc: datos.consumidor_num_doc.trim().toUpperCase(),
      consumidor_domicilio: datos.consumidor_domicilio.trim(),
      consumidor_telefono: datos.consumidor_telefono.trim() || null,
      consumidor_email: datos.consumidor_email.trim().toLowerCase() || null,
      menor_de_edad: datos.menor_de_edad,
      apoderado_nombre: datos.menor_de_edad ? datos.apoderado_nombre.trim() : null,
      bien_tipo: datos.bien_tipo as Reclamacion["bien_tipo"],
      bien_descripcion: datos.bien_descripcion.trim(),
      monto: datos.monto ? Number(datos.monto) : null,
      codigo_reserva: datos.codigo_reserva.trim().toUpperCase() || null,
      detalle: datos.detalle.trim(),
      pedido: datos.pedido.trim(),
      respuesta: null,
      fecha_respuesta: null,
    });
    setDatos(VACIO);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      constanciaRef.current?.focus();
    });
  };

  if (hoja) {
    return (
      <div className="space-y-6">
        <div
          ref={constanciaRef}
          tabIndex={-1}
          role="status"
          className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-5 outline-none"
        >
          <CheckCircle2 size={22} className="shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold">
              Registramos tu hoja N.° {numeroReclamacion(hoja.id, hoja.created_at)}.
            </p>
            <p className="text-sm mt-1">
              Esta es tu constancia: imprímela o guárdala en PDF.
              {hoja.consumidor_email ? ` Te responderemos a ${hoja.consumidor_email}.` : " Te responderemos en el domicilio que indicaste."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 min-h-11 px-5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800"
          >
            <Printer size={18} aria-hidden="true" /> Imprimir o guardar en PDF
          </button>
          <button
            type="button"
            onClick={() => setHoja(null)}
            className="min-h-11 px-5 bg-white border border-stone-300 text-stone-800 rounded-xl text-sm font-bold hover:bg-stone-50"
          >
            Llenar otra hoja
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-8">
          <HojaReclamacion hoja={hoja} />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      {/* Campo trampa para robots: oculto para las personas y los lectores de pantalla */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="sitio_web">No llenar</label>
        <input
          id="sitio_web"
          tabIndex={-1}
          autoComplete="off"
          value={datos.sitio_web}
          onChange={(e) => cambiar("sitio_web", e.target.value)}
        />
      </div>

      <div className={grupo}><fieldset className="space-y-4">
        <legend className={leyenda}>1. Tus datos</legend>
        <div>
          <label htmlFor="nombre" className={etiqueta}>Nombre completo</label>
          <input id="nombre" required autoComplete="name" className={campo}
            value={datos.consumidor_nombre} onChange={(e) => cambiar("consumidor_nombre", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-4">
          <div>
            <label htmlFor="tipo_doc" className={etiqueta}>Documento</label>
            <select id="tipo_doc" className={campo}
              value={datos.consumidor_tipo_doc} onChange={(e) => cambiar("consumidor_tipo_doc", e.target.value)}>
              <option value="DNI">DNI</option>
              <option value="CE">Carné de extranjería</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="RUC">RUC</option>
            </select>
          </div>
          <div>
            <label htmlFor="num_doc" className={etiqueta}>Número de documento</label>
            <input id="num_doc" required className={campo}
              inputMode={datos.consumidor_tipo_doc === "DNI" || datos.consumidor_tipo_doc === "RUC" ? "numeric" : "text"}
              value={datos.consumidor_num_doc} onChange={(e) => cambiar("consumidor_num_doc", e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="domicilio" className={etiqueta}>Domicilio</label>
          <input id="domicilio" required autoComplete="street-address" className={campo}
            value={datos.consumidor_domicilio} onChange={(e) => cambiar("consumidor_domicilio", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telefono" className={etiqueta}>Teléfono <span className="font-normal text-stone-500">(opcional)</span></label>
            <input id="telefono" type="tel" autoComplete="tel" className={campo}
              value={datos.consumidor_telefono} onChange={(e) => cambiar("consumidor_telefono", e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className={etiqueta}>Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" className={campo} aria-describedby="email-ayuda"
              value={datos.consumidor_email} onChange={(e) => cambiar("consumidor_email", e.target.value)} />
            <p id="email-ayuda" className="text-xs text-stone-500 mt-1">Para enviarte la respuesta. Si no lo dejas, respondemos a tu domicilio.</p>
          </div>
        </div>
        <div>
          <label className="inline-flex items-center gap-3 min-h-11 cursor-pointer text-sm font-bold text-stone-800">
            <input type="checkbox" className="w-5 h-5 accent-rose-600"
              checked={datos.menor_de_edad} onChange={(e) => cambiar("menor_de_edad", e.target.checked)} />
            Soy menor de edad
          </label>
          {datos.menor_de_edad && (
            <div className="mt-2">
              <label htmlFor="apoderado" className={etiqueta}>Nombre del padre o la madre</label>
              <input id="apoderado" required className={campo}
                value={datos.apoderado_nombre} onChange={(e) => cambiar("apoderado_nombre", e.target.value)} />
            </div>
          )}
        </div>
      </fieldset></div>

      <div className={grupo}><fieldset className="space-y-4">
        <legend className={leyenda}>2. Lo que contrataste</legend>
        <div role="radiogroup" aria-label="Tipo de bien" className="flex flex-wrap gap-3">
          {(["servicio", "producto"] as const).map((op) => (
            <label key={op} className="inline-flex items-center gap-2 min-h-11 px-4 border border-stone-300 rounded-xl cursor-pointer has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 text-sm font-bold">
              <input type="radio" name="bien_tipo" value={op} className="accent-rose-600"
                checked={datos.bien_tipo === op} onChange={() => cambiar("bien_tipo", op)} />
              {op === "servicio" ? "Servicio" : "Producto"}
            </label>
          ))}
        </div>
        <div>
          <label htmlFor="bien" className={etiqueta}>Descripción</label>
          <input id="bien" required className={campo} placeholder="Ej.: hospedaje en habitación doble del 23 al 26 de octubre"
            value={datos.bien_descripcion} onChange={(e) => cambiar("bien_descripcion", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="monto" className={etiqueta}>Monto reclamado (S/) <span className="font-normal text-stone-500">(opcional)</span></label>
            <input id="monto" type="number" min="0" step="0.01" inputMode="decimal" className={campo}
              value={datos.monto} onChange={(e) => cambiar("monto", e.target.value)} />
          </div>
          <div>
            <label htmlFor="reserva" className={etiqueta}>Código de reserva <span className="font-normal text-stone-500">(opcional)</span></label>
            <input id="reserva" className={campo} placeholder="RES-00101"
              value={datos.codigo_reserva} onChange={(e) => cambiar("codigo_reserva", e.target.value)} />
          </div>
        </div>
      </fieldset></div>

      <div className={grupo}><fieldset className="space-y-4">
        <legend className={leyenda}>3. Tu reclamo o queja</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            ["reclamo", "Reclamo", "Disconformidad con el servicio o producto."],
            ["queja", "Queja", "Malestar por la atención recibida."],
          ] as const).map(([valor, nombre, ayuda]) => (
            <label key={valor} className="flex items-start gap-3 p-4 border border-stone-300 rounded-xl cursor-pointer has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
              <input type="radio" name="tipo" value={valor} className="mt-1 accent-rose-600"
                checked={datos.tipo === valor} onChange={() => cambiar("tipo", valor)} />
              <span>
                <span className="block font-bold text-stone-900">{nombre}</span>
                <span className="block text-sm text-stone-600">{ayuda}</span>
              </span>
            </label>
          ))}
        </div>
        <div>
          <label htmlFor="detalle" className={etiqueta}>¿Qué pasó?</label>
          <textarea id="detalle" required rows={5} className={`${campo} min-h-32`}
            value={datos.detalle} onChange={(e) => cambiar("detalle", e.target.value)} />
        </div>
        <div>
          <label htmlFor="pedido" className={etiqueta}>¿Qué pides al hotel?</label>
          <textarea id="pedido" required rows={3} className={`${campo} min-h-24`}
            value={datos.pedido} onChange={(e) => cambiar("pedido", e.target.value)} />
        </div>
      </fieldset></div>

      {error && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm outline-none">
          <XCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="min-h-12 px-8 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar hoja de reclamación"}
        </button>
        <p className="text-xs text-stone-600 max-w-md">
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo
          para interponer una denuncia ante el Indecopi.
        </p>
      </div>
    </form>
  );
}
