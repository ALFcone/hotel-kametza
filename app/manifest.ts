import type { MetadataRoute } from "next";

// Permite instalar el sistema como aplicación (Chrome/Edge: "Instalar Hotel Kametza").
// Abre en el panel: el personal entra directo y los huéspedes van a su cuenta o al login.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "Hotel Kametza",
    short_name: "Kametza",
    description: "Recepción, reservas y comprobantes del Hotel Kametza, Ayacucho.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    lang: "es-PE",
    background_color: "#ffffff",
    theme_color: "#c9003e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
