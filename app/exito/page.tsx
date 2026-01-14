"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Building,
  ShieldCheck,
  Lock,
  CreditCard,
  Copy,
  Home,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { Suspense } from "react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const amount = searchParams.get("amount");
  const id = searchParams.get("id");
  const status = searchParams.get("status"); // Estado de Mercado Pago

  const isApproved = method === "online" && status === "approved";
  const isFailure = method === "online" && status === "failure";

  return (
    <div className="min-h-screen font-sans text-stone-800 relative flex items-center justify-center p-4">
      {/* --- 1. FONDO DE LUJO (RETABLO AYACUCHANO) --- */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/86/Retablo_ayacuchano.jpg"
          alt="Fondo Textura Retablo"
          className="w-full h-full object-cover object-center opacity-20 scale-105 blur-[2px]"
        />
        <div className="absolute inset-0 bg-[#FFFDF5]/90"></div>
      </div>

      {/* --- 2. TICKET / TARJETA CENTRAL --- */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100 animate-in fade-in zoom-in-95 duration-700">
        {/* ENCABEZADO */}
        <div
          className={`p-10 text-center relative overflow-hidden ${
            isApproved ? "bg-emerald-600" : "bg-[#700824]"
          }`}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:10px_10px]"></div>

          <div className="relative z-10 flex flex-col items-center">
            {isApproved ? (
              <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-md animate-bounce">
                <CheckCircle size={48} className="text-white" />
              </div>
            ) : isFailure ? (
              <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-md">
                <AlertCircle size={48} className="text-white" />
              </div>
            ) : (
              <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-md">
                <ShieldCheck size={48} className="text-white" />
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-tight">
              {isApproved
                ? "¡Pago Exitoso!"
                : isFailure
                ? "Error en el Pago"
                : "¡Solicitud Recibida!"}
            </h1>
            <p className="text-white/90 text-sm font-medium">
              {isApproved
                ? "Tu reserva está 100% confirmada"
                : isFailure
                ? "Intenta con otro método"
                : "Completa el pago para confirmar"}
            </p>
          </div>
        </div>

        {/* CUERPO DEL TICKET */}
        <div className="p-8">
          {/* CÓDIGO DE RESERVA */}
          <div className="flex justify-between items-center pb-6 border-b border-dashed border-stone-200 mb-6">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Código de Reserva
            </span>
            <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-lg border border-stone-100">
              <span className="font-mono font-black text-xl text-stone-700 tracking-widest">
                #{id?.toString().padStart(6, "0")}
              </span>
              <Copy
                size={14}
                className="text-stone-400 cursor-pointer hover:text-[#700824]"
              />
            </div>
          </div>

          {/* MONTO TOTAL */}
          <div className="flex justify-between items-end mb-8">
            <span className="text-xs font-bold text-stone-400 uppercase">
              Total a Pagar
            </span>
            <span className="text-4xl font-serif font-black text-[#700824]">
              S/ {amount}
            </span>
          </div>

          {/* --- LÓGICA DE MÉTODOS DE PAGO (INTEGRADA AL DISEÑO) --- */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 relative mb-6">
            {/* CASO: YAPE */}
            {method === "yape" && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-purple-700 font-bold bg-purple-50 py-2 rounded-lg">
                  <Smartphone size={20} /> <span>Yape / Plin</span>
                </div>
                <div className="w-40 h-40 bg-white mx-auto rounded-xl p-2 shadow-sm border border-stone-200 mb-3">
                  {/* AQUÍ VA TU IMAGEN QR REAL */}
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png"
                    alt="QR Yape"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-lg font-black text-stone-800 mb-1">
                  966 556 622
                </p>
                <p className="text-[10px] text-stone-400 uppercase font-bold">
                  Titular: Hotel Kametza SAC
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

            {/* CASO: ONLINE FALLIDO */}
            {isFailure && (
              <div className="text-center text-rose-600 font-bold text-sm">
                Hubo un problema con el pago.
              </div>
            )}
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col gap-3">
            {/* Botón WhatsApp (Solo si no es automático o recepción) */}
            {!isApproved && !isFailure && method !== "recepcion" && (
              <a
                href={`https://wa.me/51966556622?text=Hola,%20adjunto%20constancia%20para%20reserva%20%23${id}%20(Monto:%20S/${amount}).`}
                target="_blank"
                className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl hover:bg-[#1da851] transition shadow-lg hover:shadow-green-900/20 flex items-center justify-center gap-2 group"
              >
                <Lock size={18} /> Enviar Constancia
              </a>
            )}

            <Link
              href="/"
              className="w-full bg-white border border-stone-200 text-stone-500 font-bold py-4 rounded-xl hover:bg-stone-50 hover:text-stone-800 transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> Volver al Inicio
            </Link>
          </div>
        </div>

        {/* PIE DE PAGINA TICKET */}
        <div className="bg-stone-100 p-4 text-center border-t border-stone-200">
          <p className="text-[10px] text-stone-400 font-medium">
            ¿Dudas? Llámanos al{" "}
            <span className="text-stone-600 font-bold">+51 966 556 622</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente para Info Bancaria estilizado
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
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#700824] font-bold animate-pulse">
          Cargando tu reserva...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
