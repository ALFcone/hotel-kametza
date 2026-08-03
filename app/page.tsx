"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createBooking } from "./actions";
import {
  Tv,
  Wifi,
  Clock,
  Users,
  Star,
  ArrowRight,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Globe,
  Calendar,
  Search,
  CalendarDays,
  Car,
  Coffee,
  Bell,
  Shirt,
  Plane,
  Map,
  Home as HomeIcon,
  Bed,
  Sparkles,
  MapPin,
  Check,
  Phone,
  MessageSquare,
  Mail,
  Lock, // Importamos el candado para el input de email
} from "lucide-react";

// --- FUNCIÓN DE DESCRIPCIONES SENCILLAS ---
function getSimpleDescription(name: string, originalDesc: string) {
  const n = name.toLowerCase();

  if (n.includes("simple") || n.includes("individual")) {
    return "Ideal para viajero solo. Cama de 2 plazas, baño privado completo, agua caliente 24h, Smart TV y WiFi.";
  }
  if (n.includes("matrimonial") || n.includes("queen") || n.includes("king")) {
    return "Ideal para parejas. Cama Queen confortable, ambiente tranquilo, baño privado con agua caliente y Smart TV.";
  }
  if (n.includes("doble") || n.includes("twin")) {
    return "Para compartir. Dos camas cómodas, baño privado completo, WiFi rápido y Smart TV con cable.";
  }
  if (n.includes("triple") || n.includes("familiar")) {
    return "Para familias o grupos. Tres camas, espacio amplio, baño completo y todos los servicios incluidos.";
  }

  return originalDesc.length > 10
    ? originalDesc
    : "Habitación confortable con baño privado, agua caliente, WiFi y TV.";
}

// --- AUTH MODAL ---
function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        alert("Cuenta creada. ¡Bienvenido!");
      }
      onSuccess();
    } catch (err: any) {
      setError(
        "Error: " +
        (err.message === "Invalid login credentials"
          ? "Contraseña incorrecta"
          : err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative border border-stone-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-800"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-serif font-bold text-rose-950 mb-2 text-center">
          {isLogin ? "Inicia Sesión" : "Regístrate"}
        </h2>
        <p className="text-stone-500 text-xs text-center mb-6">
          {isLogin
            ? "Para asegurar tu reserva, ingresa a tu cuenta."
            : "Crea una cuenta para gestionar tus reservas."}
        </p>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full bg-white border border-stone-200 text-stone-700 font-bold py-3 rounded-xl hover:bg-stone-50 transition text-sm mb-6 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-stone-100 flex-1"></div>
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
            O con correo
          </span>
          <div className="h-px bg-stone-100 flex-1"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {!isLogin && (
            <input
              type="text"
              placeholder="Tu Nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10 text-sm animate-in slide-in-from-top-2"
            />
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10 text-sm"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10 text-sm"
          />

          <button
            disabled={loading}
            className="w-full bg-rose-900 text-white font-bold py-3 rounded-xl hover:bg-rose-800 transition shadow-lg disabled:opacity-50 text-sm mt-2"
          >
            {loading
              ? "Cargando..."
              : isLogin
                ? "Ingresar y Reservar"
                : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-stone-500">
          {isLogin ? "¿Nuevo aquí? " : "¿Ya tienes cuenta? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-rose-900 hover:underline"
          >
            {isLogin ? "Crear cuenta" : "Ingresar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- BOOKING MODAL ---
function BookingModal({
  isOpen,
  onClose,
  room,
  onRequireAuth,
  defaultCheckIn,
  defaultCheckOut,
  currentUser, // Recibimos el usuario actual
}: {
  isOpen: boolean;
  onClose: () => void;
  room: any;
  onRequireAuth: (callback: () => void) => void;
  defaultCheckIn: string;
  defaultCheckOut: string;
  currentUser: any; // Tipo para el usuario
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [checkIn, setCheckIn] = useState(defaultCheckIn || "");
  const [checkOut, setCheckOut] = useState(defaultCheckOut || "");

  const [totalPrice, setTotalPrice] = useState(room.price_per_night);
  const [nights, setNights] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docType, setDocType] = useState("DNI");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (defaultCheckIn) setCheckIn(defaultCheckIn);
    if (defaultCheckOut) setCheckOut(defaultCheckOut);
  }, [defaultCheckIn, defaultCheckOut]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setNights(diffDays);
        setTotalPrice(diffDays * room.price_per_night);
      } else {
        setNights(1);
        setTotalPrice(room.price_per_night);
      }
    }
  }, [checkIn, checkOut, room.price_per_night]);

  if (!isOpen || !mounted) return null;

  const executeBooking = async (formData: FormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes iniciar sesión para reservar.");
      setIsSubmitting(false);
      return;
    }

    // Asegurar que el ID del usuario recién autenticado esté en el FormData
    formData.set("userId", user.id);

    const method = formData.get("paymentMethod");

    try {
      const response = await createBooking(formData);
      if (response?.error) {
        alert(response.error);
      } else if (response?.success && response.url) {
        router.push(response.url);
      }
    } catch (err) {
      console.error(err);
      alert("Error inesperado.");
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const dType = formData.get("documentType");
    const dNum = formData.get("documentNumber") as string;

    if (dType === "DNI" && (dNum.length !== 8 || isNaN(Number(dNum)))) {
      alert("⚠️ Error: El DNI debe tener 8 dígitos numéricos.");
      setIsSubmitting(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      onRequireAuth(() => executeBooking(formData));
      setIsSubmitting(false);
    } else {
      await executeBooking(formData);
    }
  };

  const simpleDesc = getSimpleDescription(room.name, room.description);

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        <div className="hidden md:block w-1/3 bg-stone-100 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-900/10 mix-blend-multiply"></div>
          <img
            src={room.image_url}
            className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
            alt=""
          />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-2xl font-serif font-bold text-rose-950 mb-2">
                {room.name}
              </h3>
              <p className="text-xs text-stone-600 font-medium line-clamp-4">
                {simpleDesc}
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg">
              <p className="text-[10px] uppercase font-bold text-stone-500 mb-1">
                Total a Pagar
              </p>
              <p className="text-3xl font-black text-[#e3004f]">
                S/ {totalPrice}
              </p>
              <p className="text-[10px] text-stone-400 font-bold mt-1">
                {nights} Noche(s)
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-10 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition text-stone-500"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Calendar className="text-rose-600" size={20} />
            Completa tu Reserva
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* --- SOLUCIÓN DEFINITIVA: ENVIAR ID DE USUARIO EXPLÍCITAMENTE --- */}
            <input type="hidden" name="userId" value={currentUser?.id || ""} />

            <input type="hidden" name="roomId" value={room.firstAvailableId} />
            <input type="hidden" name="price" value={totalPrice} />

            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">
                  Llegada
                </label>
                <input
                  type="date"
                  name="checkIn"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-stone-800 outline-none mt-1"
                />
              </div>
              <div className="border-l border-stone-200 pl-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">
                  Salida
                </label>
                <input
                  type="date"
                  name="checkOut"
                  required
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-stone-800 outline-none mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <select
                  name="documentType"
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-3 bg-stone-50 rounded-xl text-xs font-bold border border-stone-200 outline-none"
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">C.E.</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  name="documentNumber"
                  placeholder="Número de Documento"
                  required
                  maxLength={docType === "DNI" ? 8 : 15}
                  className="w-full p-3 bg-stone-50 rounded-xl text-sm border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10"
                />
              </div>
            </div>

            <input
              type="text"
              name="name"
              placeholder="Nombre completo"
              required
              // MEJORA: Autocompletar nombre si está disponible
              defaultValue={currentUser?.user_metadata?.full_name || ""}
              className="w-full p-3 bg-stone-50 rounded-xl text-sm border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10"
            />

            {/* MEJORA: INPUT DE CORREO AUTOMÁTICO Y BLOQUEADO */}
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                required
                // Si hay usuario, poner su email y bloquear el campo
                defaultValue={currentUser?.email || ""}
                readOnly={!!currentUser}
                className={`w-full p-3 bg-stone-50 rounded-xl text-sm border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10 ${currentUser
                  ? "text-stone-500 cursor-not-allowed bg-stone-100"
                  : ""
                  }`}
              />
              {/* Si está logueado, mostrar candado para indicar seguridad */}
              {currentUser && (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  title="Sesión iniciada"
                >
                  <Lock size={14} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Globe
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <select
                  name="country"
                  className="w-full p-3 pl-9 bg-stone-50 rounded-xl text-xs font-bold border border-stone-200 outline-none appearance-none"
                  required
                >
                  <option value="Perú">Perú</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Chile">Chile</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Brasil">Brasil</option>
                  <option value="EEUU">EE.UU.</option>
                  <option value="España">España</option>
                  <option value="Mexico">México</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Celular / WhatsApp"
                  required
                  className="w-full p-3 pl-9 bg-stone-50 rounded-xl text-sm border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10"
                />
              </div>
            </div>

            <div className="relative">
              <select
                name="paymentMethod"
                required
                defaultValue=""
                className="w-full p-4 border border-rose-200 bg-rose-50 rounded-xl text-xs font-bold text-rose-900 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Seleccione método de pago
                </option>
                <option value="yape">
                  📱 Yape / Plin (Pago inmediato con QR)
                </option>
                <option value="recepcion">
                  🏨 Pagar en Recepción (Efectivo)
                </option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-rose-800 text-xs">
                ▼
              </div>
            </div>

            <div className="md:hidden flex justify-between items-center text-xs font-bold text-stone-500 border-t pt-2">
              <span>Total ({nights} noches):</span>
              <span className="text-lg text-[#e3004f]">S/ {totalPrice}</span>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full bg-[#e3004f] text-white font-black py-4 rounded-xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                "Procesando..."
              ) : (
                <>
                  Confirmar Reserva <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface Room {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  image_url: string | null;
  room_number: string;
}

// --- ROOM CARD MEJORADA ---
function RoomCard({
  room,
  onRequireAuth,
  globalCheckIn,
  globalCheckOut,
  currentUser, // Recibimos el usuario
}: {
  room: any;
  onRequireAuth: (callback: () => void) => void;
  globalCheckIn: string;
  globalCheckOut: string;
  currentUser: any; // Tipo
}) {
  const [showModal, setShowModal] = useState(false);
  const simpleDesc = getSimpleDescription(room.name, room.description);

  return (
    <>
      <div className="group bg-white rounded-[2.5rem] shadow-lg hover:shadow-[0_20px_40px_rgba(112,8,36,0.15)] transition-all duration-500 overflow-hidden border border-stone-100 flex flex-col h-full relative">
        <div className="relative h-72 md:h-96 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-60"></div>
          <img
            src={room.image_url}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-sm px-5 py-2 rounded-2xl shadow-lg border border-white/50">
            <p className="text-[9px] uppercase font-bold text-stone-400 tracking-widest mb-0.5">
              Por noche
            </p>
            <p className="text-xl font-black text-[#e3004f]">
              S/ {room.price_per_night}
            </p>
          </div>
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-[#e3004f] text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] shadow-lg">
              Exclusivo
            </span>
          </div>
        </div>

        <div className="p-8 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-2xl font-serif font-bold text-rose-950 leading-tight group-hover:text-rose-700 transition-colors">
              {room.name}
            </h3>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={12}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>

          <p className="text-stone-600 text-[15px] mb-7 leading-relaxed line-clamp-3 relative pl-4 border-l-[3px] border-[#e3004f] bg-gradient-to-r from-rose-50/50 to-transparent py-1 pr-2 rounded-r-lg">
            {simpleDesc}
          </p>

          <div className="grid grid-cols-2 gap-2.5 mb-8">
            <div className="flex items-center gap-2.5 text-rose-950 bg-rose-50/80 p-3 rounded-xl border border-rose-100/50 hover:bg-rose-100/50 transition">
              <Wifi size={16} className="text-[#e3004f]" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                WiFi Fibra Óptica
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-rose-950 bg-rose-50/80 p-3 rounded-xl border border-rose-100/50 hover:bg-rose-100/50 transition">
              <Clock size={16} className="text-[#e3004f]" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Agua Caliente 24h
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-rose-950 bg-rose-50/80 p-3 rounded-xl border border-rose-100/50 hover:bg-rose-100/50 transition">
              <Tv size={16} className="text-[#e3004f]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Smart TV</span>
            </div>
            <div className="flex items-center gap-2.5 text-rose-950 bg-rose-50/80 p-3 rounded-xl border border-rose-100/50 hover:bg-rose-100/50 transition">
              <Users size={16} className="text-[#e3004f]" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                Baño Privado
              </span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-100">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl hover:bg-[#e3004f] transition-all shadow-lg hover:shadow-rose-900/20 flex items-center justify-between px-6 group/btn"
            >
              <span className="text-xs uppercase tracking-[0.2em]">
                Ver Disponibilidad
              </span>
              <div className="bg-white/10 p-1.5 rounded-full group-hover/btn:bg-white/20 transition">
                <ArrowRight size={16} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <BookingModal
        key={currentUser?.id || "anonymous"}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        room={room}
        onRequireAuth={onRequireAuth}
        defaultCheckIn={globalCheckIn}
        defaultCheckOut={globalCheckOut}
        currentUser={currentUser} // Pasamos el usuario al modal
      />
    </>
  );
}

// --- HOME ---
export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [globalCheckIn, setGlobalCheckIn] = useState("");
  const [globalCheckOut, setGlobalCheckOut] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingBookingAction, setPendingBookingAction] = useState<
    (() => void) | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*")
        .order("id");
      if (roomsData) setRooms(roomsData);
      setLoading(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchData();
  }, []);

  // Scroll reveal effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
      if (pendingBookingAction) {
        pendingBookingAction();
        setPendingBookingAction(null);
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    alert("Has cerrado sesión.");
  };

  const triggerAuthFlow = (continueBooking: () => void) => {
    setPendingBookingAction(() => continueBooking);
    setShowAuthModal(true);
  };

  const closeMenu = () => setIsMenuOpen(false);
  const roomTypes: any = {};
  rooms.forEach((room) => {
    if (!roomTypes[room.name]) {
      roomTypes[room.name] = {
        ...room,
        availableCount: 99,
        firstAvailableId: room.id,
      };
    }
  });
  const groupedRooms = Object.values(roomTypes);

  // Lógica para obtener solo el primer nombre (Más elegante)
  const rawName =
    currentUser?.user_metadata?.full_name || currentUser?.email || "Invitado";
  const firstName = rawName.split(" ")[0]; // Toma solo la primera palabra
  // Capitalizar (Primera mayúscula, resto minúscula)
  const userName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const isAdmin = currentUser?.email === "alfesco86@gmail.com";

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white text-[#e3004f] font-bold animate-pulse">
        Cargando Hotel Kametza...
      </div>
    );

  return (
    <div className="min-h-screen font-sans text-stone-800 selection:bg-rose-200 selection:text-rose-900 relative bg-[#FDFBF7]">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg z-[100] shadow-xl border-b border-stone-100/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 md:h-32">
            <div className="flex-shrink-0 z-[110]">
              <a href="#inicio" onClick={closeMenu}>
                <img
                  src="/logoo.png"
                  alt="Hotel Kametza"
                  className="h-24 md:h-32 w-auto object-contain scale-125 md:scale-[1.4] origin-left brightness-[1.2] drop-shadow-sm"
                />
              </a>
            </div>

            {/* --- MENÚ DE NAVEGACIÓN PROFESIONAL (ICONOS CON COLOR DE MARCA) --- */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { name: "Inicio", href: "#inicio", icon: HomeIcon },
                { name: "Habitaciones", href: "#habitaciones", icon: Bed },
                { name: "Servicios", href: "#servicios", icon: Sparkles },
                { name: "Ubicación", href: "#ubicacion", icon: MapPin },
                { name: "Contacto", href: "#contacto", icon: Phone },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group relative px-4 py-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-600 hover:text-[#e3004f] transition-colors duration-300"
                >
                  <item.icon
                    size={16}
                    className="text-[#e3004f] group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300 drop-shadow-sm"
                  />
                  {item.name}
                  <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[#e3004f] -translate-x-1/2 transition-all duration-300 group-hover:w-1/2 rounded-full"></span>
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <a
                      href="/admin"
                      className="text-[10px] font-black bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-rose-900 transition tracking-widest uppercase"
                    >
                      Panel
                    </a>
                  )}
                  {/* BOTÓN DE USUARIO MINIMALISTA */}
                  <a
                    href={isAdmin ? "/admin" : "/dashboard"}
                    className="group flex items-center gap-2 text-stone-600 hover:text-[#e3004f] transition-colors duration-300"
                  >
                    <div className="p-1.5 rounded-full border border-stone-200 group-hover:border-[#e3004f] transition-colors">
                      <User size={16} strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {userName}
                    </span>
                  </a>
                  <button
                    onClick={handleLogout}
                    title="Cerrar Sesión"
                    className="text-stone-300 hover:text-rose-600 transition-colors"
                  >
                    <LogOut size={18} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                /* BOTÓN ACCEDER ESTILO CÁPSULA */
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="group flex items-center gap-2 bg-stone-50 border border-stone-200 hover:border-[#e3004f]/30 hover:bg-rose-50 text-stone-600 hover:text-[#e3004f] px-5 py-2.5 rounded-full transition-all duration-300 text-[11px] font-bold uppercase tracking-widest shadow-sm hover:shadow-md"
                >
                  <div className="bg-white p-1 rounded-full group-hover:scale-110 transition-transform">
                    <LogIn size={14} className="text-[#e3004f]" />
                  </div>
                  Acceder
                </button>
              )}
              <a
                href="#habitaciones"
                className="btn-shimmer bg-[#e3004f] text-white px-7 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-rose-900/40 transform hover:-translate-y-0.5"
              >
                Reservar
              </a>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden z-[110] p-2 text-rose-900"
            >
              {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>

        {/* --- MENÚ MÓVIL --- */}
        <div
          className={`fixed inset-0 bg-white z-[105] flex flex-col justify-center items-center transition-all duration-300 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
            } md:hidden`}
        >
          <div className="flex flex-col space-y-8 text-center items-center">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800 hover:text-rose-900 transition"
            >
              Inicio
            </a>
            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800 hover:text-rose-900 transition"
            >
              Habitaciones
            </a>
            <a
              href="#servicios"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800 hover:text-rose-900 transition"
            >
              Servicios
            </a>
            <a
              href="#ubicacion"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800 hover:text-rose-900 transition"
            >
              Ubicación
            </a>
            <a
              href="#contacto"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800 hover:text-rose-900 transition"
            >
              Contacto
            </a>

            <div className="w-16 h-px bg-stone-200 my-4"></div>

            {currentUser ? (
              <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full border-2 border-[#e3004f]/20 bg-rose-50 text-[#e3004f]">
                    <User size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-stone-800">
                    {userName}
                  </span>
                </div>

                <a
                  href={isAdmin ? "/admin" : "/dashboard"}
                  onClick={closeMenu}
                  className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-[#e3004f] transition-colors"
                >
                  Ir al Panel
                </a>

                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="flex items-center gap-2 text-stone-400 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-widest mt-2"
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  closeMenu();
                }}
                className="text-xl font-bold text-stone-600 hover:text-rose-900 flex items-center gap-2"
              >
                <LogIn size={24} /> Iniciar Sesión
              </button>
            )}

            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="mt-4 bg-rose-900 text-white px-12 py-4 rounded-full font-bold shadow-lg uppercase tracking-widest text-sm"
            >
              Reservar Ahora
            </a>
          </div>
        </div>
      </nav>

      <section
        id="inicio"
        className="relative pt-48 pb-32 lg:pt-56 lg:pb-40 overflow-hidden z-10 px-4 text-center min-h-[90vh] flex flex-col justify-center"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.png"
            alt="Hotel Kametza Exterior"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-900/40 to-[#FDFBF7]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* ETIQUETA ELEGANTE Y PROFESIONAL */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[1px] w-8 md:w-16 bg-white/50"></div>
            <span className="text-lg md:text-xl font-serif font-medium text-white tracking-[0.35em] uppercase drop-shadow-md">
              Ayacucho, Perú
            </span>
            <div className="h-[1px] w-8 md:w-16 bg-white/50"></div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-white tracking-tight leading-tight drop-shadow-2xl">
            Descubre Ayacucho <br /> La Magia de los Andes
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-12 font-light leading-relaxed drop-shadow-lg">
            Un refugio donde la historia colonial se encuentra con el confort contemporáneo, diseñado para una experiencia inolvidable.
          </p>

          {/* --- BUSCADOR PROFESIONAL (CÁPSULA) --- */}
          <div className="bg-white/95 backdrop-blur-lg p-2 rounded-[2rem] md:rounded-full shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center border border-white/40 mb-8 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            <div className="flex flex-col items-start px-6 py-3 w-full md:w-auto flex-grow hover:bg-stone-50 transition rounded-full cursor-pointer relative group">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 group-hover:text-rose-900 transition">
                Check-in
              </label>
              <div className="flex items-center w-full">
                <CalendarDays
                  size={18}
                  className="text-stone-300 mr-3 group-hover:text-rose-700 transition"
                />
                <input
                  type="date"
                  min={today}
                  value={globalCheckIn}
                  onChange={(e) => setGlobalCheckIn(e.target.value)}
                  className="bg-transparent outline-none text-sm font-bold w-full text-stone-700 cursor-pointer placeholder-stone-300"
                  placeholder="Agrega fechas"
                />
              </div>
            </div>

            <div className="flex flex-col items-start px-6 py-3 w-full md:w-auto flex-grow hover:bg-stone-50 transition rounded-full cursor-pointer relative group">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 group-hover:text-rose-900 transition">
                Check-out
              </label>
              <div className="flex items-center w-full">
                <CalendarDays
                  size={18}
                  className="text-stone-300 mr-3 group-hover:text-rose-700 transition"
                />
                <input
                  type="date"
                  min={globalCheckIn || today}
                  value={globalCheckOut}
                  onChange={(e) => setGlobalCheckOut(e.target.value)}
                  className="bg-transparent outline-none text-sm font-bold w-full text-stone-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-2 w-full md:w-auto">
              <a
                href="#habitaciones"
                className="btn-shimmer bg-[#e3004f] text-white px-8 py-4 rounded-full shadow-lg hover:bg-black transition-all w-full flex items-center justify-center gap-2 group"
              >
                <Search
                  size={20}
                  className="group-hover:scale-110 transition"
                />
                <span className="font-bold text-xs uppercase tracking-widest">
                  Buscar Disponibilidad
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* --- SECCIÓN SERVICIOS ESTILO BENTO GRID --- */}
      <section id="habitaciones" className="scroll-reveal min-h-screen flex flex-col justify-center py-24 relative z-10 w-full">
        <div className="w-full px-4 md:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-rose-950">
              Nuestras Habitaciones
            </h2>
            <p className="text-stone-500 mt-4 text-lg">
              Espacios diseñados para tu máximo descanso
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 w-full">
            {groupedRooms.map((room: any) => (
              <div key={room.name} className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] xl:w-[calc(25%-1.5rem)] max-w-[420px]">
                <RoomCard
                  room={room}
                  onRequireAuth={triggerAuthFlow}
                  globalCheckIn={globalCheckIn}
                  globalCheckOut={globalCheckOut}
                  currentUser={currentUser} // Pasamos el usuario al RoomCard
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="scroll-reveal min-h-screen flex flex-col justify-center py-24 relative z-10 w-full bg-stone-50">
        <div className="w-full px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950 border border-rose-800 shadow-[0_4px_20px_rgba(227,0,79,0.2)] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e3004f] animate-pulse shadow-[0_0_8px_#e3004f]"></span>
              <span className="text-rose-50 font-black text-[10px] uppercase tracking-[0.2em]">
                Experiencia Kametza
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mt-6 mb-4">
              Mucho más que solo descansar
            </h2>
            <p className="text-stone-500 max-w-2xl mx-auto text-lg">
              Descubre todos los servicios exclusivos pensados para hacer de tu estadía una experiencia inolvidable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. COCHERA */}
            <a
              href="https://wa.me/51966556622?text=Hola%20Hotel%20Kametza,%20deseo%20confirmar%20el%20uso%20de%20la%20cochera%20privada."
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-900/10 border border-stone-100 hover:border-rose-100 hover:-translate-y-2 transition-all duration-500 flex flex-col block"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src="/COCHERA PRIVADA.jpg"
                  alt="Cochera"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-stone-800 shadow-sm">
                  Gratuito
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col relative">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100 absolute -top-7 right-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  <Car size={24} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif">
                  Cochera Privada
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  Estacionamiento seguro 24/7 dentro de nuestras instalaciones para tu total tranquilidad y comodidad.
                </p>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-widest group-hover:text-rose-700 transition-colors">
                  Reservar <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </a>

            {/* 2. DESAYUNOS */}
            <a
              href="https://wa.me/51966556622?text=Hola%20Hotel%20Kametza,%20quisiera%20saber%20m%C3%A1s%20sobre%20el%20desayuno%20regional."
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-900/10 border border-stone-100 hover:border-rose-100 hover:-translate-y-2 transition-all duration-500 flex flex-col block"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src="/DESAYUNO AYACUCHANO.jpg"
                  alt="Desayuno"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col relative">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100 absolute -top-7 right-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  <Coffee size={24} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif">
                  Desayuno Regional
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  Empieza el día con café ayacuchano, pan chapla recién horneado, quesos frescos y deliciosos jugos naturales.
                </p>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-widest group-hover:text-rose-700 transition-colors">
                  Saber Más <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </a>

            {/* 3. ROOM SERVICE */}
            <a
              href="https://wa.me/51966556622?text=Hola%20Hotel%20Kametza,%20necesito%20solicitar%20Room%20Service."
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-900/10 border border-stone-100 hover:border-rose-100 hover:-translate-y-2 transition-all duration-500 flex flex-col block"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src="/ROOM SERVICE.jpg"
                  alt="Room Service"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col relative">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100 absolute -top-7 right-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  <Bell size={24} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif">
                  Room Service
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  Atención directa a tu habitación para tu máxima comodidad y privacidad, en el momento que lo desees.
                </p>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-widest group-hover:text-rose-700 transition-colors">
                  Solicitar <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </a>

            {/* 4. LAVANDERÍA */}
            <a
              href="https://wa.me/51966556622?text=Hola%20Hotel%20Kametza,%20deseo%20solicitar%20el%20servicio%20de%20lavander%C3%ADa."
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-900/10 border border-stone-100 hover:border-rose-100 hover:-translate-y-2 transition-all duration-500 flex flex-col block"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src="/LAVANDERIA.jpg"
                  alt="Lavandería"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col relative">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100 absolute -top-7 right-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  <Shirt size={24} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif">
                  Lavandería
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  Servicio de lavado y secado rápido y cuidadoso para que viajes ligero y sin preocupaciones.
                </p>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-widest group-hover:text-rose-700 transition-colors">
                  Solicitar <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </a>

            {/* 5. TRASLADOS */}
            <a
              href="https://wa.me/51966556622?text=Hola%20Hotel%20Kametza,%20quisiera%20solicitar%20un%20traslado%20desde/hacia%20el%20aeropuerto."
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-900/10 border border-stone-100 hover:border-rose-100 hover:-translate-y-2 transition-all duration-500 flex flex-col block"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src="/TRASLADO AEROPUERTO.jpg"
                  alt="Traslados"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-stone-800 shadow-sm">
                  Aeropuerto
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col relative">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100 absolute -top-7 right-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  <Plane size={24} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif">
                  Traslados Seguros
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  Movilidad garantizada desde y hacia el aeropuerto para un viaje sin contratiempos.
                </p>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-widest group-hover:text-rose-700 transition-colors">
                  Coordinar <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </a>

            {/* 6. TOURS */}
            <a
              href="https://wa.me/51966556622?text=Hola%20Hotel%20Kametza,%20me%20gustar%C3%ADa%20informaci%C3%B3n%20para%20coordinar%20un%20Tour%20por%20Ayacucho."
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-900/10 border border-stone-100 hover:border-rose-100 hover:-translate-y-2 transition-all duration-500 flex flex-col block"
            >
              <div className="relative h-60 w-full overflow-hidden">
                <img
                  src="/DESCUBRE AYACUCHOO.jpg"
                  alt="Tours Ayacucho"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-amber-400/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-amber-950 shadow-sm">
                  Recomendado
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col relative">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 absolute -top-7 right-8 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                  <Map size={24} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif">
                  Tours Ayacucho
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  Te conectamos con operadores certificados para descubrir las maravillas coloniales y naturales de la ciudad.
                </p>
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-widest group-hover:text-rose-700 transition-colors">
                  Explorar <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </a>
            
          </div>
        </div>
      </section>

      <section id="resenas" className="scroll-reveal py-24 bg-stone-100 relative w-full overflow-hidden">
        {/* Decoraciones de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-stone-200 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/4"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 xl:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950 border border-rose-800 shadow-[0_4px_20px_rgba(227,0,79,0.2)] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e3004f] animate-pulse shadow-[0_0_8px_#e3004f]"></span>
              <span className="text-rose-50 font-black text-[10px] uppercase tracking-[0.2em]">
                Testimonios Reales
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mb-6">
              Lo que dicen nuestros huéspedes en Google
            </h2>
            <p className="text-stone-500 text-sm md:text-base leading-relaxed">
              La satisfacción de quienes nos visitan es nuestro mejor respaldo. Descubre por qué Kametza es la opción favorita en Ayacucho con un puntaje excepcional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 relative group hover:-translate-y-2 transition-all duration-500">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-900 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">M</div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">María Fernanda</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Huésped Verificado</p>
                  </div>
                </div>
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed italic relative z-10">
                "Excelente atención y comodidad. El personal fue muy amable y el desayuno ayacuchano estuvo delicioso. Muy cerca del centro, recomendado 100%."
              </p>
              <div className="absolute text-8xl text-rose-50 font-serif -top-2 right-6 pointer-events-none group-hover:text-rose-100 transition-colors">"</div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 relative group hover:-translate-y-2 transition-all duration-500">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">C</div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">Carlos Gómez</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Huésped Verificado</p>
                  </div>
                </div>
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed italic relative z-10">
                "Un hotel muy acogedor. Las habitaciones siempre impecables, con agua caliente las 24 horas y buena señal de WiFi para trabajar. Excelente relación calidad-precio."
              </p>
              <div className="absolute text-8xl text-stone-50 font-serif -top-2 right-6 pointer-events-none group-hover:text-stone-100 transition-colors">"</div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 relative group hover:-translate-y-2 transition-all duration-500">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e3004f] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">A</div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">Andrea y Luis</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">Huésped Verificado</p>
                  </div>
                </div>
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed italic relative z-10">
                "Me encantó la estadía, es un lugar muy seguro y tranquilo. El servicio al cuarto fue rápido y el trato del personal superó mis expectativas. Volveremos sin duda."
              </p>
              <div className="absolute text-8xl text-rose-50 font-serif -top-2 right-6 pointer-events-none group-hover:text-rose-100 transition-colors">"</div>
            </div>
          </div>
        </div>
      </section>

      <section id="ubicacion" className="scroll-reveal min-h-screen flex items-center py-24 relative z-10 w-full bg-stone-50">
        <div className="w-full px-4 md:px-8 xl:px-12 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative">
            {/* Elemento decorativo */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-30"></div>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950 border border-rose-800 shadow-[0_4px_20px_rgba(227,0,79,0.2)] relative z-10 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e3004f] animate-pulse shadow-[0_0_8px_#e3004f]"></span>
              <span className="text-rose-50 font-black text-[10px] uppercase tracking-[0.2em]">
                Ubicación Estratégica
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mt-4 mb-6 relative z-10 leading-tight">
              Tranquilidad y Fácil Acceso en la ciudad
            </h2>
            
            <div className="mb-8 bg-white p-6 rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100">
                  <MapPin size={28} />
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-0.5">
                    Dirección Exacta
                  </p>
                  <p className="text-xl font-bold text-stone-800 font-serif">
                    Jirón Las Américas #154
                  </p>
                  <p className="text-rose-600 font-medium text-sm">
                    Ref. Óvalo Magdalena, Ayacucho
                  </p>
                </div>
              </div>
            </div>

            <p className="text-stone-500 mb-8 leading-relaxed text-lg relative z-10">
              Descubre lo mejor de Ayacucho desde un punto privilegiado. Te ofrecemos la <strong>tranquilidad absoluta</strong> que necesitas para un verdadero descanso, manteniéndote a tan solo unos minutos del centro histórico, zonas comerciales y principales rutas turísticas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <span className="text-stone-700 font-medium text-sm">Zona segura y silenciosa</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <span className="text-stone-700 font-medium text-sm">Fácil acceso de movilidad</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <span className="text-stone-700 font-medium text-sm">A un paso del Óvalo Magdalena</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <span className="text-stone-700 font-medium text-sm">A 5 minutos de la Plaza</span>
              </div>
            </div>
          </div>
          <div className="h-[500px] w-full bg-stone-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-stone-300 border-4 border-white">
            <iframe
              src="https://maps.google.com/maps?width=100%25&height=100%25&hl=es&q=KAMETZA%20HOTEL%2C%20Jr%2C%20%C3%93valo%20de%20La%20Magdalena%2C%20Las%20Americas%20154%2C%20Ayacucho%2005001%2C%20Per%C3%BA&t=&z=17&ie=UTF8&iwloc=B&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              title="Ubicación Hotel Kametza"
            ></iframe>
          </div>
        </div>
      </section>

      <section
        id="contacto"
        className="min-h-screen flex flex-col justify-center py-24 relative overflow-hidden z-10 w-full bg-[url('/bg_contacto.png')] bg-cover bg-center bg-fixed"
      >
        <div className="absolute inset-0 bg-stone-50/70 backdrop-blur-md"></div>
        <div className="w-full px-4 md:px-8 xl:px-12 text-center relative z-10 max-w-none">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950 border border-rose-800 shadow-[0_4px_20px_rgba(227,0,79,0.2)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e3004f] animate-pulse shadow-[0_0_8px_#e3004f]"></span>
            <span className="text-rose-50 font-black text-[10px] uppercase tracking-[0.2em]">
              Atención 24/7
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-stone-900">
            {" "}
            ¿Deseas una atención directa?{" "}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-6xl mx-auto">
            <a
              href="https://wa.me/51966556622"
              target="_blank"
              className="p-10 bg-white border border-stone-100 rounded-[2.5rem] hover:border-rose-200 hover:shadow-rose-900/10 transition duration-500 group shadow-xl flex flex-col items-center justify-center hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition duration-500">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-black text-2xl mb-2 text-stone-900 font-serif">WhatsApp</h3>
              <p className="text-rose-600 font-bold tracking-widest">966 556 622</p>
            </a>
            <a
              href="tel:+51920042099"
              className="p-10 bg-white border border-stone-100 rounded-[2.5rem] hover:border-rose-200 hover:shadow-rose-900/10 transition duration-500 group shadow-xl flex flex-col items-center justify-center hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition duration-500">
                <Phone size={32} />
              </div>
              <h3 className="font-black text-2xl mb-2 text-stone-900 font-serif">Recepción</h3>
              <p className="text-rose-600 font-bold tracking-widest">920 042 099</p>
            </a>
            <a
              href="mailto:kametzahotelayacucho@gmail.com"
              className="p-10 bg-white border border-stone-100 rounded-[2.5rem] hover:border-rose-200 hover:shadow-rose-900/10 transition duration-500 group shadow-xl flex flex-col items-center justify-center hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition duration-500">
                <Mail size={32} />
              </div>
              <h3 className="font-black text-2xl mb-2 text-stone-900 font-serif">Correo</h3>
              <p className="text-rose-600 font-bold text-sm">kametzahotelayacucho@gmail.com</p>
            </a>
          </div>
        </div>
      </section>

      {/* --- FOOTER PREMIUM --- */}
      <footer className="bg-stone-50 border-t border-stone-200 pt-24 pb-12 text-sm relative z-10 w-full overflow-hidden">
        {/* Elemento decorativo del footer */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/50 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-stone-200/50 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 xl:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 xl:gap-8 mb-20">
            
            {/* Brand Column */}
            <div className="xl:col-span-1">
              <img src="/logoo.png" alt="Hotel Kametza" className="h-24 mb-6" />
              <p className="text-stone-600 text-sm leading-relaxed mb-8 max-w-sm">
                Un refugio exclusivo donde la historia colonial se encuentra con el confort contemporáneo en el corazón de Ayacucho.
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/share/1KhmvycDcR/" target="_blank" className="w-10 h-10 bg-white shadow-sm border border-stone-200 hover:bg-[#1877F2] hover:border-[#1877F2] group rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1">
                  <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" className="w-4 h-4 group-hover:brightness-0 group-hover:invert transition-all" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/kametzahotelayacucho/" target="_blank" className="w-10 h-10 bg-white shadow-sm border border-stone-200 hover:bg-[#E4405F] hover:border-[#E4405F] group rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" className="w-4 h-4 group-hover:brightness-0 group-hover:invert transition-all" alt="Instagram" />
                </a>
                <a href="https://tiktok.com/@HotelKametza" target="_blank" className="w-10 h-10 bg-white shadow-sm border border-stone-200 hover:bg-black hover:border-black group rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1">
                  <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" className="w-4 h-4 group-hover:brightness-0 group-hover:invert transition-all" alt="TikTok" />
                </a>
              </div>
            </div>

            {/* Links Column */}
            <div>
              <h4 className="text-rose-950 font-bold tracking-widest text-xs uppercase mb-6">Descubre</h4>
              <ul className="space-y-4">
                <li><a href="#inicio" className="text-stone-500 font-medium hover:text-rose-600 transition-colors flex items-center gap-2"><ArrowRight size={14} className="text-rose-400" /> Inicio</a></li>
                <li><a href="#habitaciones" className="text-stone-500 font-medium hover:text-rose-600 transition-colors flex items-center gap-2"><ArrowRight size={14} className="text-rose-400" /> Habitaciones</a></li>
                <li><a href="#servicios" className="text-stone-500 font-medium hover:text-rose-600 transition-colors flex items-center gap-2"><ArrowRight size={14} className="text-rose-400" /> Experiencia Kametza</a></li>
                <li><a href="#ubicacion" className="text-stone-500 font-medium hover:text-rose-600 transition-colors flex items-center gap-2"><ArrowRight size={14} className="text-rose-400" /> Ubicación</a></li>
              </ul>
            </div>

            {/* Dirección Column */}
            <div>
              <h4 className="text-rose-950 font-bold tracking-widest text-xs uppercase mb-6">Ubicación</h4>
              <div className="flex items-start gap-3 text-stone-600 mb-4 font-medium">
                <MapPin size={18} className="text-rose-600 flex-shrink-0 mt-1" />
                <p className="leading-relaxed">
                  Jirón Las Américas #154<br />
                  Ref. Óvalo Magdalena<br />
                  Ayacucho, Perú
                </p>
              </div>
            </div>

            {/* Pagos Column */}
            <div>
              <h4 className="text-rose-950 font-bold tracking-widest text-xs uppercase mb-6">Medios de Pago</h4>
              <p className="text-stone-600 font-medium text-sm mb-4">
                Aceptamos todas las tarjetas de crédito, débito y transferencias.
              </p>
              <div className="flex gap-2 mb-6">
                <div className="bg-white px-3 py-2 rounded-lg border border-stone-200 shadow-sm flex items-center justify-center h-10 w-14">
                  <span className="font-black text-[#1A1F71] text-[10px] italic">VISA</span>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg border border-stone-200 shadow-sm flex items-center justify-center h-10 w-14 relative overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-[#EB001B] absolute left-2 opacity-80 mix-blend-multiply"></div>
                  <div className="w-4 h-4 rounded-full bg-[#F79E1B] absolute right-2 opacity-80 mix-blend-multiply"></div>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg border border-stone-200 shadow-sm flex items-center justify-center h-10 w-14">
                  <span className="font-black text-[#2671B9] text-[10px] italic">AMEX</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div>
              <p className="font-bold text-stone-600 text-xs">© 2025 Hotel Kametza. Todos los derechos reservados.</p>
              <p className="text-[10px] text-stone-400 mt-1">RUC: 10452685951</p>
            </div>
            <div className="text-[10px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest font-black">
              Experiencia Premium en Ayacucho
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
