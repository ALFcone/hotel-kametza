import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Las páginas privadas (panel, reservas del huésped, confirmación y acceso) no deben aparecer en buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/exito", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
