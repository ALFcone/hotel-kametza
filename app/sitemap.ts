import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Solo las páginas públicas: el resto del sitio es privado o requiere sesión.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/libro-de-reclamaciones`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
