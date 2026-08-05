/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/layout.tsx
 * PROPÓSITO: Plantilla base de toda la web. Aquí se cargan las fuentes,
 *            los metadatos SEO y se define la estructura HTML que envuelve
 *            a todas las demás páginas del sistema.
 * ---------------------------------------------------------------------
 */
import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hotel Kametza | Ayacucho",
  description: "Un refugio donde la historia colonial se encuentra con el confort contemporáneo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${playfair.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
