"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Copy,
  ArrowRight,
  Building,
  Globe,
  ShieldCheck,
  Lock,
  CreditCard,
} from "lucide-react";
import { Suspense } from "react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const amount = searchParams.get("amount");
  const id = searchParams.get("id");
  const status = searchParams.get("status"); // Nuevo: Estado de Mercado Pago

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center max-w-lg mx-auto border border-stone-100 relative overflow-hidden">
      {/* --- CASO ESPECIAL: PAGO ONLINE APROBADO --- */}
      {method === "online" && status === "approved" ? (
        <>
          <div className="bg-emerald-50 p-8 rounded-3xl mb-8 animate-fade-in-up">
            <div className="flex justify-center mb-4 text-emerald-600">
              <CheckCircle size={80} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-emerald-800 mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-emerald-700 font-medium mb-4">
              Tu reserva #{id} está 100% confirmada.
            </p>
            <div className="text-xs text-stone-400 bg-white p-2 rounded-lg inline-block shadow-sm">
              Procesado de forma segura por Mercado Pago
            </div>
          </div>
          <Link
            href="/"
            className="w-full block bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-xl"
          >
            Volver al Inicio
          </Link>
        </>
      ) : (
        // --- CASO NORMAL (YAPE MANUAL / BCP / ETC) ---
        <>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ShieldCheck size={150} />
          </div>
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <CheckCircle size={40} />
          </div>

          <h1 className="text-3xl font-serif font-bold text-rose-950 mb-2">
            ¡Solicitud Recibida!
          </h1>

          <div className="inline-block bg-stone-100 px-4 py-2 rounded-lg border border-stone-200 mb-6">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
              Código de Reserva
            </p>
            <p className="text-2xl font-black text-stone-800 tracking-widest">
              #{id?.toString().padStart(6, "0")}
            </p>
          </div>

          <p className="text-stone-500 mb-8 text-sm">
            Tu habitación ha sido pre-bloqueada. Para confirmar, completa el
            pago.
          </p>

          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 mb-8 relative z-10">
            <div className="flex justify-between items-end mb-4 border-b border-stone-200 pb-4">
              <span className="text-xs font-bold text-stone-400 uppercase">
                Total a Pagar
              </span>
              <span className="text-3xl font-black text-[#700824]">
                S/ {amount}
              </span>
            </div>

            {method === "yape" && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                <p className="font-bold text-purple-600 mb-4">
                  📲 Yapear / Plin al: 966 556 622
                </p>
                <div className="w-48 h-48 bg-stone-200 mx-auto rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png"
                    alt="QR Yape"
                    className="w-full h-full object-cover opacity-50"
                  />
                </div>
                <p className="text-[10px] text-stone-400 uppercase font-bold">
                  Titular: Hotel Kametza SAC
                </p>
              </div>
            )}

            {/* Si falló el pago online */}
            {method === "online" && status === "failure" && (
              <div className="bg-rose-100 text-rose-800 p-4 rounded-xl font-bold">
                Hubo un error con el pago. Por favor intenta con otro método.
              </div>
            )}

            {method === "bcp" && (
              <BankInfo
                bankName="BCP"
                color="text-orange-600"
                account="450-XXXXXXX-0-01"
                cci="002-450-XXXXXXX-99"
              />
            )}
            {/* ... Agrega aquí los otros bancos si los necesitas ... */}
            {method === "recepcion" && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm font-medium">
                <p>✅ Tu pago se realizará al momento del Check-in.</p>
              </div>
            )}
          </div>

          {method !== "recepcion" && method !== "online" && (
            <a
              href={`https://wa.me/51966556622?text=Hola,%20adjunto%20constancia%20para%20reserva%20%23${id}%20(Monto:%20S/${amount}).`}
              target="_blank"
              className="block w-full bg-[#25D366] text-white font-bold py-4 rounded-xl hover:bg-[#20bd5a] transition shadow-xl mb-4 flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Enviar Constancia Segura
            </a>
          )}

          <Link
            href="/"
            className="text-sm font-bold text-stone-400 hover:text-stone-600 flex justify-center items-center gap-2"
          >
            Volver al Inicio <ArrowRight size={14} />
          </Link>
        </>
      )}
    </div>
  );
}

function BankInfo({ bankName, color, account, cci }: any) {
  return (
    <div className="text-left space-y-4">
      <div className="flex items-center gap-2 mb-2 font-bold">
        <Building size={18} className={color} />{" "}
        <span className={color}>{bankName}</span>
      </div>
      <div className="bg-white p-4 rounded-xl border border-stone-200">
        <p className="text-[10px] uppercase font-bold text-stone-400">
          Nº Cuenta
        </p>
        <p className="font-bold text-stone-800 text-sm">{account}</p>
      </div>
    </div>
  );
}

export default function ExitoPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
      </div>
      <div className="relative z-10 w-full">
        <Suspense
          fallback={
            <div className="text-center font-bold text-rose-900">
              Cargando...
            </div>
          }
        >
          <PaymentContent />
        </Suspense>
      </div>
    </div>
  );
}
