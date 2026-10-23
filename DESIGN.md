---
name: Hotel Kametza
description: Hospitalidad ayacuchana en rosa Kametza sobre crema, con titulares serif de voz propia y un panel de recepción oscuro con acento ámbar.
colors:
  kametza-rose: "#e3004f"
  kametza-rose-deep: "#b3003e"
  rose-pressed: "#c90045"
  rose-ink: "#4a001a"
  rose-wash: "#fdf2f5"
  rose-mist: "#fbe5ec"
  rose-title: "#C4023E"
  parchment: "#FDFBF7"
  admin-paper: "#FAF6F0"
  surface: "#ffffff"
  stone-fog: "#fafaf9"
  stone-haze: "#f5f5f4"
  stone-line: "#e7e5e4"
  stone-mute: "#a8a29e"
  stone-text-soft: "#78716c"
  stone-text: "#44403c"
  stone-ink: "#292524"
  stone-deep: "#1c1917"
  night-panel: "#0c0a09"
  admin-amber: "#d97706"
  admin-amber-bright: "#f59e0b"
  admin-amber-glow: "#fbbf24"
  status-ok: "#10b981"
  status-error: "#ef4444"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(3.75rem, 8vw, 9rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.15em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.33
  body:
    fontFamily: "Montserrat, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Montserrat, Arial, Helvetica, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: "0.1em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "24px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.kametza-rose}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "16px 32px"
  button-secondary:
    backgroundColor: "{colors.stone-fog}"
    textColor: "{colors.stone-text-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  input-field:
    backgroundColor: "{colors.stone-fog}"
    textColor: "{colors.stone-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px"
  card-room:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.stone-ink}"
    rounded: "{rounded.xxl}"
  admin-nav-item:
    backgroundColor: "{colors.night-panel}"
    textColor: "{colors.stone-mute}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  admin-nav-item-active:
    backgroundColor: "{colors.night-panel}"
    textColor: "{colors.surface}"
---

# Design System: Hotel Kametza

## Overview

**Creative North Star: "El Anfitrión Ayacuchano"**

Kametza se presenta como una casa que recibe, no como un portal de reservas. El sitio público habla con voz de anfitrión: titulares serif grandes y con carácter sobre un fondo crema cálido, un rosa de marca que aparece como sello y como llamada a la acción, y un texto de apoyo claro y directo. La cortesía está en los detalles: etiquetas pequeñas y ordenadas, precios siempre visibles, el WhatsApp del hotel siempre a mano.

El carácter es pulido y premium sin ser frío. Los botones principales llevan degradado y sombra tintada de rosa, las tarjetas se elevan al pasar el cursor con un resplandor rosado, las fotos reales de las habitaciones hacen el trabajo emocional. El panel de recepción cambia de registro a propósito: barra lateral casi negra, acento ámbar y etiquetas compactas en mayúsculas, porque ahí el personal trabaja rápido y a menudo desde el móvil.

**Key Characteristics:**
- Crema `#FDFBF7` como lienzo del sitio público; blanco solo para superficies elevadas (tarjetas, barra superior, modales).
- Rosa Kametza como único acento de marca en el público; ámbar exclusivo del personal.
- Serif (Playfair) para voz y títulos; sans (Montserrat) para todo lo que se lee, se llena o se cobra.
- Esquinas amplias (12 a 24 px) y cápsulas; nada de ángulos rectos duros.
- Sombras suaves y tintadas; el resplandor rosado señala interacción, no decoración.

## Colors

Paleta cálida de dos registros: rosa sobre crema para el huésped, ámbar sobre carbón para el personal. Los neutros son la familia `stone` (grises cálidos) y nunca grises fríos.

### Primary
- **Rosa Kametza** (`#e3004f`): acento de marca tomado del logo. Botones de confirmación, precios totales, iconos de acción, enlaces en hover, anillos de foco en el acceso. Es la única voz de color del sitio público.
- **Rosa Profundo** (`#b3003e`): extremo oscuro del degradado de los botones de llamada principal (`from #e3004f to #b3003e`). Nunca solo, siempre acompañando al rosa Kametza.
- **Rosa Presionado** (`#c90045`): estado hover/activo del rosa en acciones secundarias y avisos.
- **Rosa Tinta** (`#4a001a`): color de titulares serif sobre fondos claros en secciones de marca (`rose-950`).
- **Rosa Título Hero** (`#C4023E`): exclusivo del título "KAMETZA" sobre la foto de portada, con halo claro y sombra oscura para contraste.

### Secondary
- **Ámbar de Panel** (`#d97706`): acento del panel de administración. Pestaña activa, botones de acción interna, KPIs. Con `#f59e0b` y `#fbbf24` como variantes más vivas para bordes e iconos activos sobre fondo oscuro.

### Neutral
- **Pergamino** (`#FDFBF7`): fondo de `/`, `/dashboard`, `/exito`.
- **Papel de Panel** (`#FAF6F0`): fondo del área de contenido de `/admin`, un punto más cálido que el público.
- **Blanco Superficie** (`#ffffff`): tarjetas, barra superior, modales, campos de fecha.
- **Neblina / Bruma** (`#fafaf9`, `#f5f5f4`): fondos de campos, píldoras y secciones alternas.
- **Línea de Piedra** (`#e7e5e4`): bordes de 1 px de campos y separadores.
- **Piedra Silenciosa** (`#a8a29e`): etiquetas pequeñas, iconos inactivos, texto de ayuda.
- **Texto Suave / Texto / Tinta** (`#78716c`, `#44403c`, `#292524`): jerarquía del texto corrido, de menor a mayor énfasis. `#1c1917` para titulares sans sobre claro.
- **Panel Nocturno** (`#0c0a09`): barra lateral y barra inferior móvil del panel.
- **Estado**: verde `#10b981` (limpia / pagada), ámbar `#f59e0b` (pendiente), rojo `#ef4444` (incidencia o cancelada), siempre en puntos pequeños con halo o en insignias suaves.

### Named Rules
**The Una Sola Voz Rule.** En el sitio público el rosa Kametza es el único acento. Si una pantalla necesita un segundo color para distinguir algo, usa un neutro de piedra, no ámbar.

**The Ámbar Solo Para Casa Rule.** El ámbar `#d97706` pertenece a `/admin`. No debe aparecer en la landing, el acceso, el panel del huésped ni la confirmación. La landing ya no usa ámbar: las estrellas de calificación, la etiqueta "Recomendado", los iconos de la franja oscura de confianza, los titulares del pie y los bordes de enfoque van en rosa Kametza. Los estados de pendiente (por ejemplo, el icono de pago pendiente en la confirmación) conservan el ámbar como color de estado.

**The Piedra Cálida Rule.** Todos los grises vienen de la familia `stone`. Un gris frío (`gray`, `slate`, `zinc`) rompe el calor del conjunto.

**The Sin Hex En Clases Rule.** Ningún color de Kametza se escribe como hex dentro de una clase (`bg-[#e3004f]`). Cada uno tiene nombre en `@theme` de `app/globals.css`: `rose-500` (rosa de marca) con su escala, `amber-600` y `amber-700` (los dos ámbares del panel, fijados en `#d97706` y `#b45309` porque Tailwind v4 trae versiones más vivas), `parchment` (`#fdfbf7`, lienzo público), `parchment-warm` (`#faf6f0`, lienzo del panel), `cream` (`#fffdf5`, velo sobre fondos) y `whatsapp` / `whatsapp-dark`. El código que no puede usar clases (botones de SweetAlert2, confeti) toma los valores de `lib/brand-colors.ts`. Quedan como hex solo los colores de marcas ajenas (Google, Visa, Mastercard, Instagram, Facebook), la paleta del confeti y el tinte `#3a0614` del hero.

## Typography

**Display / Headline Font:** Playfair Display (con Georgia, serif)
**Body / Label Font:** Montserrat (con Arial, Helvetica, sans-serif)

**Character:** Una serif de alto contraste con presencia editorial emparejada con una geométrica sans, abierta y legible en móvil. La serif pone la voz del anfitrión; la sans pone la claridad de lo que se firma, se paga o se confirma.

### Hierarchy
- **Display** (900, `clamp(3.75rem, 8vw, 9rem)`, 1, tracking 0.15em, mayúsculas): solo el título del hero. Rosa título con halo.
- **Headline** (700, `clamp(1.875rem, 4vw, 3rem)`, 1.25): encabezados de sección (habitaciones, servicios, ubicación, preguntas). Color stone-900 o rosa tinta.
- **Title** (700, 1.5rem, 1.33): títulos de modales, tarjetas destacadas y paneles. Serif.
- **Body** (400 a 600, 0.875rem, 1.5): texto corrido, valores de campos (los valores de fecha van en 700). Líneas de 65 caracteres como máximo en párrafos largos.
- **Label** (700 a 900, 0.625rem, tracking 0.1em a 0.15em, mayúsculas): etiquetas de campo, botones, insignias, pestañas del panel. Es la voz funcional del sistema.

### Named Rules
**The Serif Es La Voz Rule.** Playfair solo para titulares y momentos de hospitalidad. Nunca para precios, fechas, tablas ni campos.

**The Etiqueta Chica Rule.** Etiquetas y botones usan 10 px con mayúsculas y tracking amplio; si un texto necesita más de unas pocas palabras, deja de ser etiqueta y pasa a Body.

**The Piso De 10 Px Rule.** Ningún texto de la interfaz baja de 10 px (`text-[10px]`): ni las etiquetas de la barra inferior móvil, ni las insignias, ni las leyendas. Antes había textos de 7, 8 y 9 px; se subieron todos. La única excepción es el ticket térmico de 80 mm (`ThermalTicket.tsx`), que se imprime y se mide en papel, no en pantalla.

## Layout

Una columna fluida en móvil que crece a rejillas de dos o tres columnas desde `md`. Las secciones del sitio público ocupan pantalla completa (`min-h-screen`) con contenido centrado y mucho aire vertical (padding vertical de 96 px), alternando fondo crema y blanco. La barra superior es fija y blanca con una línea de 1 px y sombra tenue.

Ritmo de espaciado sobre base de 4 px: 8 px entre elementos de un grupo, 16 px entre campos, 24 a 32 px entre bloques de tarjeta, 96 px entre secciones. El panel `/admin` usa una barra lateral fija de 288 px (`w-72`) en escritorio y una barra inferior fija con esquinas superiores de 24 px en móvil; las tablas del Room Rack hacen scroll horizontal con primera columna fija. El modelo es móvil primero: los CTA ocupan todo el ancho en pantallas pequeñas y pasan a cápsula en `md`.

## Elevation & Depth

Híbrido: capas tonales (crema, blanco, piedra) para la jerarquía en reposo y sombras suaves, a menudo tintadas, para la respuesta a la interacción.

### Shadow Vocabulary
- **Reposo de tarjeta** (`box-shadow: 0 8px 30px rgb(0 0 0 / 0.04)`): tarjetas de habitación y de servicio.
- **Elevación rosada** (`box-shadow: 0 20px 40px rgba(227,0,79,0.15)`): tarjeta en hover; la sombra se tiñe de rosa para sentir la marca.
- **Botón de marca** (`box-shadow: 0 10px 20px rgba(227,0,79,0.3)`, hover `0 15px 30px rgba(227,0,79,0.4)` con `translateY(-4px)`): llamada de acción principal.
- **Barra superior** (`box-shadow: 0 4px 20px rgba(0,0,0,0.05)`): separación sutil de la navegación fija.
- **Halo de estado** (`box-shadow: 0 0 5px rgba(16,185,129,0.5)`): puntos de estado en el panel.
- **Barra inferior móvil** (`box-shadow: 0 -10px 40px rgba(0,0,0,0.3)`): sobre el contenido del panel.

### Named Rules
**The Sombra Con Tinte Rule.** Las sombras de elevación significativa llevan el tono de su acento (rosa en público, neutro oscuro en panel); una sombra gris pura queda para reposo.

**The Hover Que Eleva Rule.** El estado hover sube la pieza (`-translate-y` y sombra mayor); el estado en reposo es plano.

## Shapes

Lenguaje de formas amable y redondeado. Tarjetas y fotos grandes en 24 px, modales y paneles en 16 a 24 px, campos y botones de formulario en 12 px, insignias y botones de cabecera en cápsula completa. Las imágenes dentro de tarjetas recortan con `overflow-hidden` y hacen un zoom lento (`scale-110` en 1 s) al pasar el cursor. Bordes de 1 px en stone-100 o stone-200; no hay bordes gruesos de color salvo el filo izquierdo de 2 px en el ítem activo del panel.

## Components

Piezas táctiles, de esquinas amplias y con una respuesta clara al toque. El carácter es pulido: degradado y brillo en las acciones de marca, quietud en el resto.

### Buttons
- **Shape:** esquinas de 12 px en formularios; cápsula completa en la cabecera y en `md` para el CTA del hero.
- **Primary:** relleno rosa Kametza (`#e3004f`), texto blanco, etiqueta en mayúsculas 10 a 12 px negrita con tracking amplio, padding `16px 32px`. En el CTA del hero lleva degradado a `#b3003e` y sombra tintada.
- **Hover / Focus:** el botón de confirmar de formulario pasa a negro (`hover:bg-black`); el CTA del hero se eleva 4 px con sombra más grande. Deshabilitado a 50 % de opacidad y texto "Procesando...".
- **Secondary / Ghost:** cápsula `stone-50` con borde `stone-200` y texto stone-600; al hover borde rosa al 30 %, fondo `rose-50` y texto rosa. Se usa para "Acceder" y acciones de cabecera.

### Cards / Containers
- **Corner Style:** 24 px (`rounded-3xl`) en habitaciones y servicios.
- **Background:** blanco sobre fondo crema.
- **Shadow Strategy:** sombra de reposo tenue y elevación rosada en hover (ver Elevation & Depth).
- **Border:** 1 px `stone-100`.
- **Internal Padding:** 24 a 32 px; la foto ocupa el borde superior completo (alto 288 px, 384 px desde `md`) con degradado oscuro inferior al 50 %.

### Inputs / Fields
- **Style:** fondo `stone-50`, borde 1 px `stone-200`, esquinas de 12 px, padding 12 px, texto 14 px. Etiqueta encima del campo en 10 px mayúsculas stone-400.
- **Focus:** sin contorno nativo; anillo de 2 px en rosa tinta al 10 % (`ring-rose-900/10`), y en el acceso anillo y borde rosa Kametza.
- **Selector de fechas:** campos de fecha compactos sin fondo, valor en negrita, separados por una línea vertical de 1 px, dentro de una barra blanca en cápsula.

### Navigation
- **Público:** barra fija blanca con enlaces en mayúsculas pequeñas, "Acceder" como cápsula y acciones de sesión con icono; en móvil, menú desplegable.
- **Panel (escritorio):** barra lateral `#0c0a09` de 288 px. Ítems en 12 px negrita mayúsculas con tracking, esquinas de 8 px y borde izquierdo de 2 px. Activo: fondo `white/10`, texto blanco, borde e icono ámbar. Inactivo: texto `#a8a29e`, borde transparente.
- **Panel (móvil):** barra inferior fija oscura con esquinas superiores de 24 px y menú "Más".

### Insignias de estado (signature)
Puntos de 8 px con halo de color (verde limpia/pagada, ámbar pendiente, rojo incidencia) junto a una etiqueta de 9 a 10 px en mayúsculas. Son el idioma de lectura rápida del Room Rack.

### Ticket térmico (signature)
Recibo para impresora de 80 mm: ancho fijo de 302 px, sin color, texto monoespaciado funcional. Fuera del sistema de color; no hereda el rosa ni el ámbar.

## Do's and Don'ts

### Do:
- **Do** usar el rosa Kametza (`#e3004f`) para la acción principal de cada pantalla pública y nada más como acento.
- **Do** poner titulares y momentos de hospitalidad en Playfair, y precios, fechas y campos en Montserrat.
- **Do** teñir las sombras de elevación con el acento (rosa en público) y elevar al hacer hover.
- **Do** mantener todos los grises en la familia `stone` y el fondo público en crema `#FDFBF7`.
- **Do** mantener el ámbar `#d97706` y la barra lateral `#0c0a09` exclusivamente en `/admin`.
- **Do** dejar visibles el precio total y los datos de contacto (WhatsApp) en el flujo de reserva.
- **Do** dimensionar los controles del panel para uso táctil en turno, aunque la etiqueta sea de 10 px.

### Don't:
- **Don't** introducir un segundo color de acento en el sitio público (ni ámbar, ni azul, ni verde decorativo).
- **Don't** usar grises fríos ni negro puro de fondo grande; el oscuro del panel es `#0c0a09`.
- **Don't** usar Playfair en tablas, formularios, precios o etiquetas funcionales.
- **Don't** usar esquinas rectas duras ni bordes gruesos de color; la forma es redondeada.
- **Don't** aplicar degradados o brillos animados fuera de las acciones de marca y los estados de carga.
- **Don't** mezclar el lenguaje del ticket térmico (sin color, monoespaciado) con el resto de la interfaz.
