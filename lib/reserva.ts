// Código de reserva que ve el huésped (RES-00101 = reserva n.° 1).
// Es el mismo en el panel, la página de éxito, "Mis reservas", los tickets y los comprobantes.
export function codigoReserva(id: number) {
  return `RES-${(id + 100).toString().padStart(5, "0")}`;
}

// Forma de pago tal como se imprime en los tickets, a partir de payment_method de la reserva.
export function formaDePago(metodo?: string | null) {
  const key = (metodo || "").toLowerCase();
  if (key.includes("yape") || key.includes("plin")) return "Yape / Plin";
  if (key.includes("tarjeta") || key.includes("pos") || key.includes("online")) return "Tarjeta / Online";
  if (key.includes("transferencia") || key.includes("bcp") || key.includes("bbva")) return "Transferencia";
  return "Efectivo";
}
