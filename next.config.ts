import type { NextConfig } from "next";

// Las fotos de habitaciones viven en Supabase Storage; solo se optimiza ese proyecto,
// no cualquier *.supabase.co (el optimizador no debe servir de proxy a terceros).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  /* config options here */

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
