"use client";
/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/exito/page.tsx
 * PROPÓSITO: Pantalla de "Reserva Exitosa". Es la página de confirmación
 *            que ve el huésped inmediatamente después de completar
 *            su reserva y pagar en línea.
 * ---------------------------------------------------------------------
 */
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  ArrowRight,
  Building,
  ShieldCheck,
  CreditCard,
  Copy,
  Home,
  Smartphone,
  AlertCircle,
  Check,
  LayoutDashboard,
  Clock,
  CreditCard as CardIcon,
  PartyPopper,
} from "lucide-react";
import { Suspense } from "react";

/** Confetti Component */
function Confetti() {
  const [pieces, setPieces] = useState<
    { id: number; left: string; delay: string; color: string; size: number }[]
  >([]);

  useEffect(() => {
    const colors = [
      "#e3004f",
      "#f43f5e",
      "#fbbf24",
      "#34d399",
      "#60a5fa",
      "#a78bfa",
      "#fb923c",
    ];
    const newPieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </>
  );
}

/** Timeline Step */
function TimelineStep({
  step,
  label,
  isActive,
  isCompleted,
  delay,
}: {
  step: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-in-up flex flex-col items-center gap-2 flex-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${
          isCompleted
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
            : isActive
            ? "bg-[#e3004f] text-white shadow-lg shadow-rose-200 animate-pulse"
            : "bg-stone-100 text-stone-400"
        }`}
      >
        {isCompleted ? <Check size={18} /> : step}
      </div>
      <span
        className={`text-[9px] font-bold uppercase tracking-wider text-center ${
          isCompleted || isActive ? "text-stone-700" : "text-stone-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const amount = searchParams.get("amount");
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const [copied, setCopied] = useState(false);

  const isApproved = method === "online" && status === "approved";
  const isFailure = method === "online" && status === "failure";

  const formattedId = id
    ? `RES-${(Number(id) + 100).toString().padStart(5, "0")}`
    : "---";

  // Determine timeline state
  const timelineSteps = [
    { step: 1, label: "Reserva", isCompleted: true },
    {
      step: 2,
      label: "Pago",
      isCompleted: isApproved || method === "recepcion",
      isActive: !isApproved && method !== "recepcion" && !isFailure,
    },
    {
      step: 3,
      label: "Confirmada",
      isCompleted: isApproved,
      isActive: method === "recepcion",
    },
  ];

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = formattedId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen font-sans text-stone-800 relative flex items-center justify-center p-4">
      {/* Confetti for approved payments */}
      {isApproved && <Confetti />}

      {/* Fondo */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/86/Retablo_ayacuchano.jpg"
          alt="Fondo Textura Retablo"
          className="w-full h-full object-cover object-center opacity-[0.08] scale-105 blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF5]/95 via-[#FFFDF5]/90 to-[#FFFDF5]/95" />
      </div>

      {/* Ticket */}
      <div className="animate-scale-in relative z-10 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100">
        {/* Header */}
        <div
          className={`p-10 text-center relative overflow-hidden ${
            isApproved
              ? "bg-gradient-to-br from-emerald-600 to-emerald-700"
              : isFailure
              ? "bg-gradient-to-br from-rose-600 to-rose-700"
              : "bg-gradient-to-br from-[#e3004f] to-rose-800"
          }`}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:10px_10px]" />

          <div className="relative z-10 flex flex-col items-center">
            {isApproved ? (
              <div className="animate-fade-in-up bg-white/20 p-4 rounded-full mb-4 backdrop-blur-md shadow-lg">
                <PartyPopper size={48} className="text-white" />
              </div>
            ) : isFailure ? (
              <div className="animate-fade-in-up bg-white/20 p-4 rounded-full mb-4 backdrop-blur-md">
                <AlertCircle size={48} className="text-white" />
              </div>
            ) : (
              <div className="animate-fade-in-up bg-white/20 p-4 rounded-full mb-4 backdrop-blur-md">
                <ShieldCheck size={48} className="text-white" />
              </div>
            )}

            <h1 className="animate-fade-in-up text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-tight" style={{ animationDelay: "100ms" }}>
              {isApproved
                ? "¡Pago Exitoso!"
                : isFailure
                ? "Error en el Pago"
                : "¡Solicitud Recibida!"}
            </h1>
            <p className="animate-fade-in-up text-white/90 text-sm font-medium" style={{ animationDelay: "200ms" }}>
              {isApproved
                ? "Tu reserva está 100% confirmada"
                : isFailure
                ? "Intenta con otro método"
                : "Completa el pago para confirmar"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Timeline */}
          <div className="flex items-center justify-between mb-8 relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-[15%] right-[15%] h-0.5 bg-stone-100 z-0" />
            <div
              className="absolute top-5 left-[15%] h-0.5 bg-emerald-500 z-0 transition-all duration-1000"
              style={{
                width: isApproved
                  ? "70%"
                  : method === "recepcion"
                  ? "35%"
                  : "0%",
              }}
            />
            {timelineSteps.map((ts, i) => (
              <TimelineStep
                key={ts.step}
                step={ts.step}
                label={ts.label}
                isActive={ts.isActive || false}
                isCompleted={ts.isCompleted}
                delay={300 + i * 100}
              />
            ))}
          </div>

          {/* Código de Reserva */}
          <div className="animate-fade-in-up flex justify-between items-center pb-6 border-b border-dashed border-stone-200 mb-6" style={{ animationDelay: "500ms" }}>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Código de Reserva
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-lg border border-stone-100 hover:bg-stone-100 hover:border-stone-200 transition-all group"
            >
              <span className="font-mono font-black text-xl text-stone-700 tracking-widest">
                {formattedId}
              </span>
              {copied ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy
                  size={14}
                  className="text-stone-400 group-hover:text-[#e3004f] transition-colors"
                />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-emerald-600 text-[10px] font-bold uppercase text-center -mt-4 mb-4 animate-fade-in-up">
              ✓ Código copiado al portapapeles
            </p>
          )}

          {/* Monto Total */}
          <div className="animate-fade-in-up flex justify-between items-end mb-8" style={{ animationDelay: "600ms" }}>
            <span className="text-xs font-bold text-stone-400 uppercase">
              Total a Pagar
            </span>
            <span className="text-4xl font-serif font-black text-[#e3004f]">
              S/ {amount}
            </span>
          </div>

          {/* Método de Pago */}
          <div className="animate-fade-in-up bg-stone-50 p-6 rounded-2xl border border-stone-100 relative mb-6" style={{ animationDelay: "700ms" }}>
            {/* CASO: YAPE */}
            {method === "yape" && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-purple-700 font-bold bg-purple-50 py-2 rounded-lg">
                  <Smartphone size={20} /> <span>Yape / Plin</span>
                </div>
                <div className="w-40 h-40 bg-white mx-auto rounded-xl p-2 shadow-sm border border-stone-200 mb-3 overflow-hidden">
                  <img
                    src="/qr.png"
                    alt="QR Yape"
                    className="w-full h-full object-contain bg-stone-50"
                  />
                </div>
                <p className="text-lg font-black text-stone-800 mb-1">
                  966 556 622
                </p>
                <p className="text-[10px] text-stone-400 uppercase font-bold px-2 text-center leading-tight">
                  Titular: MARCELINA BERMUDO ESCALANTE DE RUA
                </p>
              </div>
            )}

            {/* CASO: BCP */}
            {method === "bcp" && (
              <BankInfo
                bankName="BCP"
                color="text-orange-600"
                account="450-XXXXXXX-0-01"
                cci="002-450-XXXXXXX-99"
              />
            )}

            {/* CASO: RECEPCIÓN */}
            {method === "recepcion" && (
              <div className="flex flex-col items-center text-center py-2">
                <div className="bg-amber-100 p-3 rounded-full text-amber-600 mb-3">
                  <Building size={24} />
                </div>
                <p className="font-bold text-stone-700">Pago en Recepción</p>
                <p className="text-xs text-stone-500 mt-1">
                  Realizarás el pago al momento de hacer Check-in en el hotel.
                </p>
              </div>
            )}

            {/* CASO: ONLINE EXITOSO */}
            {isApproved && (
              <div className="flex flex-col items-center text-center py-2">
                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 mb-3">
                  <CreditCard size={24} />
                </div>
                <p className="font-bold text-stone-700">Pago Procesado</p>
                <p className="text-xs text-stone-500 mt-1">
                  Transacción segura vía Mercado Pago.
                </p>
              </div>
            )}

            {/* CASO: ONLINE PENDIENTE */}
            {method === "online" && status === "pending" && (
              <div className="flex flex-col items-center text-center py-2">
                <div className="bg-amber-100 p-3 rounded-full text-amber-600 mb-3 animate-pulse">
                  <Clock size={24} />
                </div>
                <p className="font-bold text-stone-700">Pago en Proceso</p>
                <p className="text-xs text-stone-500 mt-1">
                  Se abrió una pestaña con la pasarela de pago. Completa el proceso allí.
                </p>
              </div>
            )}

            {/* CASO: ONLINE FALLIDO */}
            {isFailure && (
              <div className="text-center text-rose-600 font-bold text-sm">
                Hubo un problema con el pago.
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="animate-fade-in-up flex flex-col gap-3" style={{ animationDelay: "800ms" }}>
            {/* WhatsApp */}
            {!isApproved && !isFailure && method !== "recepcion" && (
              <a
                href={`https://wa.me/51966556622?text=Hola,%20adjunto%20constancia%20para%20reserva%20${formattedId}%20(Monto:%20S/${amount}).`}
                target="_blank"
                className="btn-shimmer w-full bg-[#25D366] text-white font-bold py-4 rounded-xl hover:bg-[#1da851] transition shadow-lg hover:shadow-green-900/20 flex items-center justify-center gap-2"
              >
                Enviar Constancia por WhatsApp
              </a>
            )}

            {/* Ir al Dashboard */}
            <Link
              href="/dashboard"
              className="w-full bg-[#e3004f] text-white font-bold py-4 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-rose-900/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              <LayoutDashboard size={16} /> Ir a Mis Reservas <ArrowRight size={14} />
            </Link>

            <Link
              href="/"
              className="w-full bg-white border border-stone-200 text-stone-500 font-bold py-4 rounded-xl hover:bg-stone-50 hover:text-stone-800 transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> Volver al Inicio
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
          <p className="text-[10px] text-stone-400 font-medium">
            ¿Dudas? Llámanos al{" "}
            <span className="text-stone-600 font-bold">+51 966 556 622</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente para Info Bancaria
function BankInfo({ bankName, color, account, cci }: any) {
  return (
    <div className="text-left bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
        <Building size={18} className={color} />
        <span className={`font-black ${color}`}>{bankName}</span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-0.5">
            Nº Cuenta
          </p>
          <div className="flex items-center justify-between">
            <p className="font-mono font-bold text-stone-700 text-sm">
              {account}
            </p>
            <Copy
              size={12}
              className="text-stone-300 cursor-pointer hover:text-stone-500"
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-stone-400 mb-0.5">
            CCI
          </p>
          <p className="font-mono font-bold text-stone-700 text-sm">{cci}</p>
        </div>
      </div>
    </div>
  );
}

export default function ExitoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
          <div className="w-full max-w-lg p-10 space-y-4">
            <div className="h-48 rounded-t-[2.5rem] animate-shimmer" />
            <div className="h-6 w-48 mx-auto rounded-full animate-shimmer" />
            <div className="h-12 w-full rounded-xl animate-shimmer" />
            <div className="h-32 w-full rounded-2xl animate-shimmer" />
            <div className="h-14 w-full rounded-xl animate-shimmer" />
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
