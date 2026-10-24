import { HOTEL_DIRECCION, HOTEL_EMAIL, HOTEL_RUC, HOTEL_TELEFONO, HOTEL_TITULAR } from "@/lib/site";
import { ZONA_PERU, fechaCorta } from "@/lib/fecha-peru";
import { DIAS_HABILES_RESPUESTA, numeroReclamacion, type Reclamacion } from "@/lib/reclamaciones";

// Hoja de Reclamación con el contenido del Anexo I del reglamento. La ven el consumidor
// (constancia que imprime o guarda en PDF) y el personal en el panel.
// La clase hoja-reclamo la hace imprimible en A4 (globals.css).

type DatosHoja = Omit<Reclamacion, "respuesta" | "fecha_respuesta"> &
  Partial<Pick<Reclamacion, "respuesta" | "fecha_respuesta">>;

function Fila({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] gap-2 py-1.5 border-b border-stone-200 last:border-b-0 print:grid-cols-[8rem_1fr]">
      <dt className="text-stone-500 text-xs font-bold uppercase tracking-wide">{etiqueta}</dt>
      <dd className="text-stone-900 text-sm break-words whitespace-pre-line">{valor || "—"}</dd>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border border-stone-300 rounded-xl overflow-hidden break-inside-avoid">
      <h3 className="bg-stone-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-stone-700">{titulo}</h3>
      <dl className="px-4 py-2">{children}</dl>
    </section>
  );
}

export default function HojaReclamacion({ hoja }: { hoja: DatosHoja }) {
  const fecha = new Date(hoja.created_at).toLocaleString("es-PE", {
    timeZone: ZONA_PERU,
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <article className="hoja-reclamo bg-white text-stone-900 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b-2 border-stone-900 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Libro de Reclamaciones</p>
          <h2 className="font-serif text-2xl font-bold">Hoja de Reclamación</h2>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-bold">N.° {numeroReclamacion(hoja.id, hoja.created_at)}</p>
          <p className="text-xs text-stone-600">{fecha}</p>
        </div>
      </header>

      <Seccion titulo="Proveedor">
        <Fila etiqueta="Nombre" valor={`${HOTEL_TITULAR} (Hotel Kametza)`} />
        <Fila etiqueta="RUC" valor={HOTEL_RUC} />
        <Fila etiqueta="Domicilio" valor={HOTEL_DIRECCION} />
        <Fila etiqueta="Contacto" valor={`${HOTEL_EMAIL} · ${HOTEL_TELEFONO}`} />
      </Seccion>

      <Seccion titulo="1. Identificación del consumidor reclamante">
        <Fila etiqueta="Nombre" valor={hoja.consumidor_nombre} />
        <Fila etiqueta={hoja.consumidor_tipo_doc} valor={hoja.consumidor_num_doc} />
        <Fila etiqueta="Domicilio" valor={hoja.consumidor_domicilio} />
        <Fila etiqueta="Teléfono" valor={hoja.consumidor_telefono} />
        <Fila etiqueta="Correo" valor={hoja.consumidor_email} />
        {hoja.menor_de_edad && <Fila etiqueta="Padre o madre" valor={hoja.apoderado_nombre} />}
      </Seccion>

      <Seccion titulo="2. Identificación del bien contratado">
        <Fila etiqueta="Tipo" valor={hoja.bien_tipo === "producto" ? "Producto" : "Servicio"} />
        <Fila etiqueta="Descripción" valor={hoja.bien_descripcion} />
        <Fila etiqueta="Monto reclamado" valor={hoja.monto !== null ? `S/ ${Number(hoja.monto).toFixed(2)}` : null} />
        <Fila etiqueta="Reserva" valor={hoja.codigo_reserva} />
      </Seccion>

      <Seccion titulo="3. Detalle de la reclamación y pedido del consumidor">
        <Fila etiqueta="Tipo" valor={hoja.tipo === "reclamo" ? "Reclamo" : "Queja"} />
        <Fila etiqueta="Detalle" valor={hoja.detalle} />
        <Fila etiqueta="Pedido" valor={hoja.pedido} />
      </Seccion>

      <Seccion titulo="4. Observaciones y acciones adoptadas por el proveedor">
        <Fila etiqueta="Respuesta" valor={hoja.respuesta || "Pendiente"} />
        <Fila etiqueta="Fecha de respuesta" valor={hoja.fecha_respuesta ? fechaCorta(hoja.fecha_respuesta) : null} />
      </Seccion>

      <footer className="text-xs text-stone-600 leading-relaxed space-y-1.5">
        <p>
          <strong>Reclamo:</strong> disconformidad relacionada a los productos o servicios.{" "}
          <strong>Queja:</strong> disconformidad no relacionada a los productos o servicios, o malestar o descontento
          respecto a la atención al público.
        </p>
        <p>
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo
          para interponer una denuncia ante el Indecopi.
        </p>
        <p>
          El proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a {DIAS_HABILES_RESPUESTA} días
          hábiles improrrogables.
        </p>
      </footer>
    </article>
  );
}
