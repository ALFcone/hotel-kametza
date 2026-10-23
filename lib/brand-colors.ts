/**
 * Colores para el codigo que no puede usar clases de Tailwind (los botones de
 * SweetAlert2, el confeti). Reflejan los tokens de app/globals.css (@theme):
 * si cambia el rosa de marca alla, cambia aqui.
 */
export const BRAND_COLORS = {
  /** --color-rose-500, el rosa Kametza. */
  rose: "#e3004f",
  /** --color-stone-400, boton secundario de un dialogo. */
  stoneSoft: "#a8a29e",
  /** --color-stone-500, boton secundario de un dialogo. */
  stone: "#78716c",
} as const;
