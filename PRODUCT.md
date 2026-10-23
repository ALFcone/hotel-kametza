# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Huéspedes (sitio público, `/`, `/dashboard`, `/exito`).** Cuatro perfiles confirmados: turistas nacionales, turistas extranjeros, viajeros de negocios o trámites (que pueden pedir factura con RUC) y familias o grupos. Reservan sobre todo desde el celular, antes del viaje, y necesitan confianza para pagar en línea a un hotel independiente de Ayacucho.

**Personal del hotel (panel `/admin`).** Tres roles: recepcionista en turno (walk-ins, cobros en efectivo o Yape, check-in/out, estado de limpieza), dueño o administrador (KPIs, ingresos, personal, productos y roles) y personal de limpieza (estado de las habitaciones). Roles en la base: `dueño`, `admin`, `receptionist`; quien no tiene rol es un huésped.

## Product Purpose

Aplicación web propia del Hotel Kametza (Ayacucho, Perú) que cubre dos trabajos en una sola herramienta: recibir reservas y pagos directos de los huéspedes, y operar el hotel día a día (reservas, habitaciones, cobros, extras, productos, personal). Éxito: el huésped reserva y paga sin intermediarios, y recepción administra todo sin planillas ni herramientas aparte.

## Positioning

Hotel independiente con trato directo y local, que combina reserva y pago en línea (Yape/Plin con QR, tarjeta) con la operación interna en una sola plataforma propia. Lo que un OTA no puede copiar: el desayuno regional, los traslados y tours coordinados por el propio hotel, y la cochera privada gratuita.

## Operating Context

- Ciudad: Ayacucho, Perú (Jr. Óvalo de La Magdalena, Las Américas 154, según el mapa de la landing). Idioma de toda la interfaz: español (`es_PE`).
- Check-in desde las 13:00, check-out hasta las 12:00; resguardo de equipaje gratuito.
- Contacto: WhatsApp +51 966 556 622 y teléfono +51 920 042 099.
- Pagos: Visa, Mastercard, Yape, Plin, transferencias y efectivo en recepción.
- Facturación peruana: consulta de DNI (RENIEC) y RUC vía API externa, ticket térmico para recepción.
- Sitio desplegado en Vercel (región Sao Paulo, `gru1`); datos, auth (email y Google) y almacenamiento de fotos en Supabase.

## Capabilities and Constraints

- Stack existente: Next.js 16 (App Router, con cambios incompatibles respecto a versiones anteriores; leer `node_modules/next/dist/docs/` antes de programar), React 19, Tailwind 4, Supabase, lucide-react, SweetAlert2.
- Rutas: `/` (landing y reserva), `/login`, `/dashboard` (huésped), `/exito` (confirmación), `/admin` (personal).
- El precio se calcula en el servidor; la búsqueda de RUC/DNI está protegida por sesión.
- Servicios del hotel: cochera privada, desayuno regional (7:00 a 9:30), room service, lavandería (8:00 a 20:00), traslados al aeropuerto, tours por Ayacucho.
- El panel de admin se usa mucho en móvil (existe menú móvil dedicado).

## Brand Commitments

El logo actual, el rosa #e3004f y las tipografías Playfair Display y Montserrat son identidad existente que el usuario marcó como vinculante. Nombre: "Hotel Kametza". Descriptor vigente: "Un refugio donde la historia colonial se encuentra con el confort contemporáneo."

## Evidence on Hand

Fotos reales en `public/` (portada, hero, logo, habitaciones en `public/rooms/`, y una foto por servicio: cochera, desayuno, room service, lavandería, traslado, tours). La landing (`app/HomeClient.tsx`) muestra la calificación de Google tal como la publica la ficha del hotel (4.4 con 90 opiniones, consultada el 2026-10-23) y enlaza a ella. Debajo hay cuatro opiniones reales copiadas de esa ficha (`GOOGLE_REVIEWS` en `HomeClient.tsx`, con la fecha de consulta visible). Las reseñas escritas a mano que había antes eran inventadas y se quitaron: no volver a añadir testimonios, procedencias, cifras ni sellos de verificación que no vengan de una fuente real; si la calificación de Google cambia, actualizarla y volver a copiar las opiniones. No hay premios ni otras cifras verificadas en el repositorio.

## Product Principles

1. **Confianza antes del pago.** Cada paso de la reserva debe dejar claro precio, fechas, método de pago y cómo contactar al hotel.
2. **Trato directo y local.** El hotel habla como un anfitrión ayacuchano, no como un portal de reservas genérico.
3. **Recepción primero en el panel.** Las tareas de turno (cobrar, registrar, limpiar) son rápidas, legibles y seguras de usar con prisa y desde el móvil.
4. **Una sola fuente de verdad.** Lo que ve el huésped y lo que ve el personal sale de los mismos datos de reservas, habitaciones y pagos.
5. **Peruano por defecto.** DNI, RUC, Yape/Plin, soles y español de Perú son parte del producto, no extras.

## Accessibility & Inclusion

Sin estándar formal confirmado. Huéspedes de distintas edades e idiomas de origen, uso intensivo en celular y conexión variable: priorizar legibilidad, tamaños táctiles cómodos y carga ligera. Abierto: confirmar si se debe ofrecer interfaz en inglés para turistas extranjeros.
