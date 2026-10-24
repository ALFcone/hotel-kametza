// Datos fijos del hotel que usan varias partes del sistema.

// Dirección pública del sitio: la usan el layout (vistas previas al compartir), robots.txt y sitemap.xml.
// Al comprar un dominio propio, cambiar solo esta línea (y agregarlo en Vercel, Supabase y Google).
export const SITE_URL = "https://kametzahotel.vercel.app";

// RUC del hotel: se imprime en el ticket y se exige como emisor en los XML de SUNAT que se suben.
export const HOTEL_RUC = "10282984984";

// Titular del RUC, dirección y contacto: van en el ticket y en el Libro de Reclamaciones.
export const HOTEL_TITULAR = "MARCELINA BERMUDO ESCALANTE DE RUA";
export const HOTEL_DIRECCION = "Jr. Las Américas #154, Ayacucho";
export const HOTEL_EMAIL = "kametzahotelayacucho@gmail.com";
export const HOTEL_TELEFONO = "920 042 099";
// WhatsApp del hotel en formato internacional, sin "+" (para enlaces wa.me)
export const HOTEL_WHATSAPP = "51966556622";
