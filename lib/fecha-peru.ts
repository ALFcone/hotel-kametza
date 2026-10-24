// Fechas en la hora de Perú. El servidor (Vercel) corre en UTC y `toISOString()` siempre
// devuelve UTC, así que desde las 7 p. m. en Perú "hoy" salía como el día siguiente.
// Perú no tiene horario de verano: UTC-5 todo el año.

export const ZONA_PERU = "America/Lima";

// Hora de entrada estándar del hotel, en hora de Perú (se usa para la regla de cancelar con 24 h).
export const HORA_CHECK_IN = "14:00:00-05:00";

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_PERU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Día de Perú (AAAA-MM-DD) de un instante, por ejemplo el `created_at` de una reserva.
export function fechaPeru(instante: string | number | Date): string {
  return formatoDia.format(new Date(instante));
}

// Hoy en Perú (AAAA-MM-DD); con `dias` se obtiene mañana (1), ayer (-1), etc.
export function hoyPeru(dias = 0): string {
  return fechaPeru(Date.now() + dias * 86_400_000);
}

// Fecha sin hora (AAAA-MM-DD, como check_in o fecha_emision) en formato DD/MM/AAAA.
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
