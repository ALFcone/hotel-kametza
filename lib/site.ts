// Datos fijos del hotel que usan varias partes del sistema.

// Dirección pública del sitio: la usan el layout (vistas previas al compartir), robots.txt y sitemap.xml.
// Al comprar un dominio propio, cambiar solo esta línea (y agregarlo en Vercel, Supabase y Google).
export const SITE_URL = "https://kametzahotel.vercel.app";

// RUC del hotel: se imprime en el ticket y se exige como emisor en los XML de SUNAT que se suben.
export const HOTEL_RUC = "10282984984";
