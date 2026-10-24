import type { NextConfig } from "next";

// Las fotos de habitaciones viven en Supabase Storage; solo se optimiza ese proyecto,
// no cualquier *.supabase.co (el optimizador no debe servir de proxy a terceros).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

// Cabeceras de seguridad para todas las rutas. HSTS ya lo pone Vercel.
// No se define una CSP completa: rompería los scripts de Next y de SweetAlert sin pruebas largas;
// solo se usa frame-ancestors para que nadie pueda incrustar el sitio (clickjacking en /admin).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  /* config options here */

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  images: {
    qualities: [75],
    // Las fotos se publican con nombre único (timestamp), así que se pueden cachear mucho.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
