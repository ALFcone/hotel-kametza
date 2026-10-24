/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/libro-de-reclamaciones/page.tsx
 * PROPÓSITO: Libro de Reclamaciones virtual (obligatorio por Indecopi).
 *            El huésped llena su hoja y recibe la constancia para
 *            imprimir o guardar en PDF.
 * ---------------------------------------------------------------------
 */
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronLeft } from "lucide-react";
import { HOTEL_DIRECCION, HOTEL_EMAIL, HOTEL_RUC, HOTEL_TELEFONO, HOTEL_TITULAR } from "@/lib/site";
import { DIAS_HABILES_RESPUESTA } from "@/lib/reclamaciones";
import FormularioReclamacion from "./FormularioReclamacion";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones | Hotel Kametza",
  description: "Registra un reclamo o una queja sobre los servicios del Hotel Kametza, Ayacucho.",
};

export default function LibroDeReclamacionesPage() {
  return (
    <main id="contenido" tabIndex={-1} className="min-h-screen bg-cream text-stone-800 outline-none">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1 min-h-11 text-sm font-bold text-stone-600 hover:text-rose-600"
        >
          <ChevronLeft size={16} aria-hidden="true" /> Volver al inicio
        </Link>

        <header className="mt-4 mb-8">
          <div className="flex items-center gap-3">
            <BookOpen size={36} className="text-rose-600 shrink-0" aria-hidden="true" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">Libro de Reclamaciones</h1>
          </div>
          <p className="mt-4 text-stone-700 max-w-prose leading-relaxed">
            Conforme al Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de
            Reclamaciones virtual. Te responderemos en un plazo máximo de {DIAS_HABILES_RESPUESTA} días hábiles.
          </p>
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><dt className="inline font-bold">Proveedor: </dt><dd className="inline">{HOTEL_TITULAR}</dd></div>
            <div><dt className="inline font-bold">RUC: </dt><dd className="inline">{HOTEL_RUC}</dd></div>
            <div><dt className="inline font-bold">Domicilio: </dt><dd className="inline">{HOTEL_DIRECCION}</dd></div>
            <div><dt className="inline font-bold">Contacto: </dt><dd className="inline break-all">{HOTEL_EMAIL} · {HOTEL_TELEFONO}</dd></div>
          </dl>
        </header>

        <FormularioReclamacion />
      </div>
    </main>
  );
}
