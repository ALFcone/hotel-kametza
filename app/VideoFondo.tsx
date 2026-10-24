"use client";

import { useEffect, useRef, useState } from "react";

// Video de fondo del inicio: sin sonido, en bucle y sin controles.
// No se carga si el visitante pidió menos movimiento o ahorro de datos;
// en ese caso queda la foto que está debajo.
export default function VideoFondo({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [mostrar, setMostrar] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ahorroDatos = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setMostrar(!menosMovimiento && !ahorroDatos);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // React no siempre pone el atributo muted; sin él los navegadores bloquean la reproducción automática
    video.muted = true;
    video.play().catch(() => {});
  }, [mostrar]);

  if (!mostrar) return null;

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setListo(true)}
      className={`transition-opacity duration-1000 ${listo ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
