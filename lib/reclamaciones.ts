// Libro de Reclamaciones virtual: tipos y reglas que comparten la página pública y el panel.
import { fechaPeru, hoyPeru } from "./fecha-peru";

export type TipoReclamacion = "reclamo" | "queja";

// Una hoja tal como la guarda la tabla public.reclamaciones.
export interface Reclamacion {
  id: number;
  created_at: string;
  tipo: TipoReclamacion;
  consumidor_nombre: string;
  consumidor_tipo_doc: string;
  consumidor_num_doc: string;
  consumidor_domicilio: string;
  consumidor_telefono: string | null;
  consumidor_email: string | null;
  menor_de_edad: boolean;
  apoderado_nombre: string | null;
  bien_tipo: "producto" | "servicio";
  bien_descripcion: string;
  monto: number | null;
  codigo_reserva: string | null;
  detalle: string;
  pedido: string;
  respuesta: string | null;
  fecha_respuesta: string | null;
}

// Plazo legal de respuesta (Código de Protección y Defensa del Consumidor, art. 24).
export const DIAS_HABILES_RESPUESTA = 15;

// Número correlativo que ve el consumidor: 000001-2026.
export function numeroReclamacion(id: number, creada: string) {
  return `${String(id).padStart(6, "0")}-${fechaPeru(creada).slice(0, 4)}`;
}

// Día de Perú (AAAA-MM-DD) como fecha al mediodía UTC, para contar días sin saltos de zona horaria.
const mediodia = (dia: string) => {
  const [y, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

// Días hábiles (lunes a viernes) que quedan del plazo, contados en días de Perú.
// No descuenta feriados. Negativo si el plazo ya venció.
export function diasHabilesRestantes(creada: string, hoy = hoyPeru()) {
  const limite = mediodia(fechaPeru(creada));
  let habiles = 0;
  while (habiles < DIAS_HABILES_RESPUESTA) {
    limite.setUTCDate(limite.getUTCDate() + 1);
    const semana = limite.getUTCDay();
    if (semana !== 0 && semana !== 6) habiles++;
  }

  const actual = mediodia(hoy);
  let restantes = 0;
  const paso = actual <= limite ? 1 : -1;
  const cursor = new Date(actual);
  while (paso > 0 ? cursor < limite : cursor > limite) {
    cursor.setUTCDate(cursor.getUTCDate() + paso);
    const semana = cursor.getUTCDay();
    if (semana !== 0 && semana !== 6) restantes += paso;
  }
  return restantes;
}
