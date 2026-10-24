import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Solo la página pública: el resto del sitio es privado o requiere sesión.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
