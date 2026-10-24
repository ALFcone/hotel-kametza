"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, Printer, CheckCircle2, XCircle } from "lucide-react";
import { responderReclamacion } from "../actions";
import { hoyPeru, ZONA_PERU } from "@/lib/fecha-peru";
import { diasHabilesRestantes, numeroReclamacion, type Reclamacion } from "@/lib/reclamaciones";
import HojaReclamacion from "../libro-de-reclamaciones/HojaReclamacion";

function Plazo({ r }: { r: Reclamacion }) {
  if (r.respuesta) {
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Respondida</span>;
  }
  const dias = diasHabilesRestantes(r.created_at);
  const estilo =
    dias < 0 ? "bg-rose-50 text-rose-700 border-rose-200"
    : dias <= 3 ? "bg-amber-50 text-amber-800 border-amber-200"
    : "bg-stone-100 text-stone-700 border-stone-200";
  const texto =
    dias < 0 ? `Vencida hace ${-dias} día${dias === -1 ? "" : "s"} hábil${dias === -1 ? "" : "es"}`
    : dias === 0 ? "Vence hoy"
    : `Quedan ${dias} día${dias === 1 ? "" : "s"} hábil${dias === 1 ? "" : "es"}`;
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${estilo}`}>{texto}</span>;
}

export default function AdminReclamaciones({ reclamaciones }: { reclamaciones: Reclamacion[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [fecha, setFecha] = useState(hoyPeru());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const pendientes = reclamaciones.filter((r) => !r.respuesta).length;

  const abrir = (r: Reclamacion) => {
    setError(null);
    setExito(null);
    if (abierta === r.id) {
      setAbierta(null);
      return;
    }
    setAbierta(r.id);
    setRespuesta(r.respuesta || "");
    setFecha(r.fecha_respuesta || hoyPeru());
  };

  const guardar = async (r: Reclamacion) => {
    setGuardando(true);
    setError(null);
    const res = await responderReclamacion(r.id, respuesta, fecha);
    setGuardando(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setExito(`Respuesta de la hoja N.° ${numeroReclamacion(r.id, r.created_at)} guardada.`);
  };

  return (
    <section className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h3 className="font-bold text-2xl text-stone-900 tracking-tight flex items-center gap-2">
            <BookOpen size={24} className="text-amber-600" aria-hidden="true" /> Libro de Reclamaciones
          </h3>
          <p className="text-stone-500 text-sm mt-1 max-w-prose">
            Hojas que dejan los huéspedes en la web. Hay que responder por escrito (correo o carta) en 15 días hábiles
            y anotar aquí la respuesta. El plazo no descuenta feriados.
          </p>
        </div>
        <a
          href="/libro-de-reclamaciones"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 min-h-11 px-4 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200"
        >
          Ver la página pública <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>

      <p className="mt-6 text-sm font-bold text-stone-700">
        {reclamaciones.length === 0
          ? "Aún no hay hojas registradas."
          : `${reclamaciones.length} hoja${reclamaciones.length === 1 ? "" : "s"} · ${pendientes} sin responder`}
      </p>

      {exito && (
        <div role="status" className="mt-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-sm">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" aria-hidden="true" /> {exito}
        </div>
      )}

      <ul className="mt-4 divide-y divide-stone-100">
        {reclamaciones.map((r) => (
          <li key={r.id} className="py-4">
            <button
              type="button"
              onClick={() => abrir(r)}
              aria-expanded={abierta === r.id}
              className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-h-11 rounded-xl hover:bg-stone-50 -mx-2 px-2 py-1"
            >
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-stone-900">
                  N.° {numeroReclamacion(r.id, r.created_at)} · {r.tipo === "reclamo" ? "Reclamo" : "Queja"}
                </span>
                <span className="block text-sm text-stone-600 truncate">
                  {r.consumidor_nombre} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("es-PE", { timeZone: ZONA_PERU })}
                  {r.codigo_reserva ? ` · ${r.codigo_reserva}` : ""}
                </span>
              </span>
              <Plazo r={r} />
            </button>

            {abierta === r.id && (
              <div className="mt-4 space-y-5">
                <div className="border border-stone-200 rounded-2xl p-4 md:p-6">
                  <HojaReclamacion hoja={r} />
                </div>

                <div className="bg-stone-50 rounded-2xl p-4 md:p-5 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                    Respuesta del hotel
                  </h4>
                  <div>
                    <label htmlFor={`respuesta-${r.id}`} className="block text-xs font-bold text-stone-700 mb-1">
                      Qué se respondió y qué acciones se tomaron
                    </label>
                    <textarea
                      id={`respuesta-${r.id}`}
                      rows={4}
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="max-w-xs">
                    <label htmlFor={`fecha-${r.id}`} className="block text-xs font-bold text-stone-700 mb-1">
                      Fecha en que se comunicó al consumidor
                    </label>
                    <input
                      id={`fecha-${r.id}`}
                      type="date"
                      value={fecha}
                      max={hoyPeru()}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full min-h-11 border border-stone-200 rounded-xl px-3 text-sm bg-white"
                    />
                  </div>
                  {error && (
                    <p role="alert" className="flex items-start gap-2 text-sm text-rose-700">
                      <XCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" /> {error}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => guardar(r)}
                      disabled={guardando}
                      className="min-h-11 px-5 bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-700 disabled:opacity-50"
                    >
                      {guardando ? "Guardando…" : r.respuesta ? "Actualizar respuesta" : "Guardar respuesta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 min-h-11 px-5 bg-white border border-stone-200 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-100"
                    >
                      <Printer size={16} aria-hidden="true" /> Imprimir hoja
                    </button>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
