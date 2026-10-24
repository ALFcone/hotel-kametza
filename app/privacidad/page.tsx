/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/privacidad/page.tsx
 * PROPÓSITO: Política de privacidad (Ley 29733 de Protección de Datos
 *            Personales y su reglamento, D.S. 016-2024-JUS).
 *            Al cambiar qué datos se piden o con quién se comparten,
 *            actualizar esta página y su fecha.
 * ---------------------------------------------------------------------
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HOTEL_DIRECCION, HOTEL_EMAIL, HOTEL_RUC, HOTEL_TELEFONO, HOTEL_TITULAR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad | Hotel Kametza",
  description: "Cómo el Hotel Kametza trata los datos personales de sus huéspedes y visitantes.",
};

const ACTUALIZADA = "23 de octubre de 2026";

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="font-serif text-xl md:text-2xl font-bold text-stone-900">{titulo}</h2>
      {children}
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <main id="contenido" tabIndex={-1} className="min-h-screen bg-cream text-stone-800 outline-none">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-14">
        <Link href="/" className="inline-flex items-center gap-1 min-h-11 text-sm font-bold text-stone-600 hover:text-rose-600">
          <ChevronLeft size={16} aria-hidden="true" /> Volver al inicio
        </Link>

        <header className="mt-4 mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">Política de privacidad</h1>
          <p className="mt-2 text-sm text-stone-500">Última actualización: {ACTUALIZADA}</p>
          <p className="mt-5 text-stone-700 leading-relaxed">
            En el Hotel Kametza usamos tus datos personales solo para atender tu reserva y tu estadía, y para cumplir
            con la ley. Aquí te contamos qué datos pedimos, para qué, con quién los compartimos y cómo puedes
            pedirnos que los corrijamos o los borremos.
          </p>
        </header>

        <div className="space-y-10 leading-relaxed text-stone-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-stone-900">
          <Seccion id="responsable" titulo="1. Quién es responsable de tus datos">
            <ul>
              <li><strong>Titular:</strong> {HOTEL_TITULAR} (Hotel Kametza)</li>
              <li><strong>RUC:</strong> {HOTEL_RUC}</li>
              <li><strong>Domicilio:</strong> {HOTEL_DIRECCION}, Perú</li>
              <li><strong>Correo:</strong> <a href={`mailto:${HOTEL_EMAIL}`} className="text-rose-700 underline underline-offset-2 break-all">{HOTEL_EMAIL}</a></li>
              <li><strong>Teléfono:</strong> {HOTEL_TELEFONO}</li>
            </ul>
          </Seccion>

          <Seccion id="datos" titulo="2. Qué datos pedimos">
            <ul>
              <li><strong>Al reservar o registrarte en recepción:</strong> nombre, tipo y número de documento, país, correo, teléfono, fechas de estadía, habitación, pagos y consumos.</li>
              <li><strong>Si creas una cuenta:</strong> nombre, correo y contraseña (guardada cifrada; nadie del hotel puede verla). Si entras con Google, recibimos tu nombre y correo de Google.</li>
              <li><strong>Para tu boleta o factura:</strong> los datos que exige SUNAT (nombre o razón social, DNI o RUC y, en facturas, dirección).</li>
              <li><strong>Si usas el Libro de Reclamaciones:</strong> los datos de la hoja (nombre, documento, domicilio, teléfono, correo y el detalle de tu reclamo o queja).</li>
            </ul>
            <p>No pedimos datos de tarjetas en esta web, ni datos sensibles como salud, religión u origen.</p>
          </Seccion>

          <Seccion id="finalidades" titulo="3. Para qué los usamos">
            <ul>
              <li>Gestionar tu reserva, tu ingreso y salida, y los pagos y consumos de tu estadía.</li>
              <li>Llevar el registro de huéspedes que exige la norma de establecimientos de hospedaje.</li>
              <li>Emitir boletas y facturas electrónicas ante SUNAT.</li>
              <li>Atender tus consultas, reclamos y quejas.</li>
              <li>Permitirte ver tus reservas en tu cuenta.</li>
            </ul>
            <p>
              No usamos tus datos para publicidad, no hacemos perfiles y no los vendemos. Si algún día quisiéramos
              enviarte promociones, te pediremos antes tu consentimiento por separado.
            </p>
          </Seccion>

          <Seccion id="obligatorios" titulo="4. Qué datos son obligatorios">
            <p>
              Sin tu nombre, documento y un medio de contacto no podemos registrar la reserva ni el ingreso, porque la
              ley nos pide identificar a cada huésped. El teléfono y los campos marcados como opcionales puedes
              dejarlos en blanco.
            </p>
          </Seccion>

          <Seccion id="destinatarios" titulo="5. Con quién los compartimos">
            <ul>
              <li><strong>Autoridades:</strong> SUNAT (comprobantes electrónicos), Indecopi (reclamos) y otras autoridades solo cuando la ley lo exige.</li>
              <li><strong>Proveedores que nos dan el servicio técnico</strong>, que solo pueden usar los datos para eso:
                <ul className="mt-1.5">
                  <li>Supabase: base de datos y cuentas de usuario.</li>
                  <li>Vercel: alojamiento de esta web.</li>
                  <li>Google: solo si eliges entrar con tu cuenta de Google.</li>
                  <li>APIs Perú (apis.net.pe): al registrarte en recepción, consulta tu nombre a partir de tu DNI o RUC para evitar errores al escribirlo.</li>
                </ul>
              </li>
            </ul>
            <p>
              Supabase, Vercel y Google guardan la información en servidores que pueden estar fuera del Perú. Trabajamos
              con ellos porque cuentan con medidas de seguridad reconocidas y se comprometen a proteger los datos.
            </p>
          </Seccion>

          <Seccion id="plazos" titulo="6. Cuánto tiempo los guardamos">
            <ul>
              <li><strong>Reservas, pagos y comprobantes:</strong> el tiempo que exigen las normas tributarias y de hospedaje.</li>
              <li><strong>Hojas del Libro de Reclamaciones:</strong> como mínimo el plazo que fija su reglamento.</li>
              <li><strong>Tu cuenta:</strong> mientras la mantengas. Puedes pedirnos que la borremos.</li>
            </ul>
            <p>Pasados esos plazos, borramos los datos o los dejamos anónimos.</p>
          </Seccion>

          <Seccion id="seguridad" titulo="7. Cómo los protegemos">
            <p>
              La web usa conexión cifrada (HTTPS). Solo el personal del hotel con usuario propio puede ver los datos de
              los huéspedes, y cada persona ve únicamente lo que necesita para su trabajo. Las contraseñas se guardan
              cifradas.
            </p>
          </Seccion>

          <Seccion id="derechos" titulo="8. Tus derechos">
            <p>
              Puedes pedirnos en cualquier momento <strong>acceder</strong> a tus datos, <strong>corregirlos</strong>,{" "}
              <strong>borrarlos</strong> u <strong>oponerte</strong> a que los usemos, salvo los que la ley nos obliga a
              conservar. También puedes retirar un consentimiento que nos hayas dado.
            </p>
            <p>
              Escríbenos a{" "}
              <a href={`mailto:${HOTEL_EMAIL}`} className="text-rose-700 underline underline-offset-2 break-all">{HOTEL_EMAIL}</a>{" "}
              con tu nombre, una copia de tu documento y lo que pides. Te responderemos en los plazos que fija la ley.
            </p>
            <p>
              Si no estás conforme con nuestra respuesta, puedes acudir a la Autoridad Nacional de Protección de Datos
              Personales del Ministerio de Justicia y Derechos Humanos.
            </p>
          </Seccion>

          <Seccion id="cookies" titulo="9. Cookies">
            <p>
              Solo usamos las cookies necesarias para mantener abierta tu sesión. No usamos cookies de publicidad ni de
              seguimiento.
            </p>
          </Seccion>

          <Seccion id="menores" titulo="10. Menores de edad">
            <p>
              Las reservas las hace una persona mayor de edad. Los datos de menores que se hospedan se registran a
              través de su padre, madre o tutor.
            </p>
          </Seccion>

          <Seccion id="cambios" titulo="11. Cambios en esta política">
            <p>
              Si cambiamos esta política, publicaremos aquí la nueva versión con su fecha. Si el cambio es importante,
              te avisaremos al correo que nos diste.
            </p>
          </Seccion>
        </div>
      </div>
    </main>
  );
}
