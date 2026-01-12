"use client";

import { useEffect, useState } from "react";
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
  Phone,
  Globe,
  Calendar,
  Search,
  CalendarDays,
  Car, // Para cochera
  Coffee, // Para desayuno
  Bell, // Para room service
  Shirt, // Para lavandería
  Plane, // Para traslados
  Map, // Para tours
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
}: {
  isOpen: boolean;
  onClose: () => void;
  room: any;
  onRequireAuth: (callback: () => void) => void;
  defaultCheckIn: string;
  defaultCheckOut: string;
}) {
  const router = useRouter();

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

  if (!isOpen) return null;

  const executeBooking = async (formData: FormData) => {
    const method = formData.get("paymentMethod");
    let newTab: Window | null = null;
    if (method === "online") {
      newTab = window.open("", "_blank");
      if (newTab)
        newTab.document.write(
          "<div style='height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;'><h2>Cargando pasarela segura...</h2></div>"
        );
    }

    try {
      const response = await createBooking(formData);
      if (response?.error) {
        alert(response.error);
        if (newTab) newTab.close();
      } else if (response?.success && response.url) {
        if (method === "online" && newTab) {
          newTab.location.href = response.url;
          router.push(
            `/exito?method=online&status=pending&id=${response.bookingId}&amount=${response.price}`
          );
        } else {
          router.push(response.url);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error inesperado.");
      if (newTab) newTab.close();
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

  return (
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
              <p className="text-3xl font-black text-[#700824]">
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
              className="w-full p-3 bg-stone-50 rounded-xl text-sm border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10"
            />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              required
              className="w-full p-3 bg-stone-50 rounded-xl text-sm border border-stone-200 outline-none focus:ring-2 focus:ring-rose-900/10"
            />

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
                <option value="online">
                  💳 Pago Online (Tarjetas, Yape, Plin)
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
              <span className="text-lg text-[#700824]">S/ {totalPrice}</span>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full bg-[#700824] text-white font-black py-4 rounded-xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50 mt-2"
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
    </div>
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
}: {
  room: any;
  onRequireAuth: (callback: () => void) => void;
  globalCheckIn: string;
  globalCheckOut: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const simpleDesc = getSimpleDescription(room.name, room.description);

  return (
    <>
      <div className="group bg-white rounded-[2.5rem] shadow-lg hover:shadow-[0_20px_40px_rgba(112,8,36,0.15)] transition-all duration-500 overflow-hidden border border-stone-100 flex flex-col h-full relative">
        <div className="relative h-72 w-full overflow-hidden">
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
            <p className="text-xl font-black text-[#700824]">
              S/ {room.price_per_night}
            </p>
          </div>
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-[#700824] text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] shadow-lg">
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

          <p className="text-stone-500 text-sm mb-6 leading-relaxed font-light line-clamp-3">
            {simpleDesc}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
              <Wifi size={14} className="text-rose-900" />
              <span className="text-[10px] font-bold uppercase">
                WiFi Fibra Óptica
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
              <Clock size={14} className="text-rose-900" />
              <span className="text-[10px] font-bold uppercase">
                Agua Caliente 24h
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
              <Tv size={14} className="text-rose-900" />
              <span className="text-[10px] font-bold uppercase">Smart TV</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">
              <Users size={14} className="text-rose-900" />
              <span className="text-[10px] font-bold uppercase">
                Baño Privado
              </span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-100">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl hover:bg-[#700824] transition-all shadow-lg hover:shadow-rose-900/20 flex items-center justify-between px-6 group/btn"
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
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        room={room}
        onRequireAuth={onRequireAuth}
        defaultCheckIn={globalCheckIn}
        defaultCheckOut={globalCheckOut}
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

  const userName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.email?.split("@")[0] ||
    "Cliente";

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white text-[#700824] font-bold animate-pulse">
        Cargando Hotel Kametza...
      </div>
    );

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#FDFBF7] selection:bg-rose-200 selection:text-rose-900">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow"></div>
        <div className="absolute top-[40%] right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>
      <nav className="fixed top-0 w-full bg-white z-[100] shadow-2xl border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 md:h-32">
            <div className="flex-shrink-0 z-[110]">
              <a href="#inicio" onClick={closeMenu}>
                <img
                  src="/logo.jpg"
                  alt="Hotel Kametza"
                  className="h-20 md:h-28 w-auto object-contain"
                />
              </a>
            </div>
            <div className="hidden md:flex space-x-8 text-sm font-medium text-stone-600 items-center">
              <a href="#inicio" className="hover:text-rose-800 transition">
                Inicio
              </a>
              <a
                href="#habitaciones"
                className="hover:text-rose-800 transition"
              >
                Habitaciones
              </a>
              <a href="#servicios" className="hover:text-rose-800 transition">
                Servicios
              </a>
              <a href="#ubicacion" className="hover:text-rose-800 transition">
                Ubicación
              </a>
              <a href="#contacto" className="hover:text-rose-800 transition">
                Contacto
              </a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  {currentUser.user_metadata?.role === "admin" && (
                    <a
                      href="/admin"
                      className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg hover:bg-rose-900 transition"
                    >
                      PANEL
                    </a>
                  )}
                  <a
                    href="/dashboard"
                    className="text-xs font-bold text-rose-900 flex items-center gap-2 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100 transition"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>{" "}
                    Hola, {userName}
                  </a>
                  <button
                    onClick={handleLogout}
                    title="Cerrar Sesión"
                    className="p-1.5 rounded-full bg-stone-100 text-stone-400 hover:bg-rose-100 hover:text-rose-600 transition"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1"
                >
                  <LogIn size={14} /> Acceder
                </button>
              )}
              <a
                href="#habitaciones"
                className="bg-rose-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-rose-800 transition shadow-lg"
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

        <div
          className={`fixed inset-0 bg-white z-[105] flex flex-col justify-center items-center transition-all duration-300 ${
            isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
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
              <div className="flex flex-col items-center gap-4">
                <a
                  href="/dashboard"
                  className="text-sm font-bold text-rose-900 flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-100 transition"
                >
                  <User size={16} /> Hola, {userName}
                </a>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="text-stone-400 hover:text-rose-600 flex items-center gap-2 font-bold text-sm"
                >
                  <LogOut size={18} /> Cerrar Sesión
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
        className="relative pt-48 pb-24 lg:pt-56 lg:pb-32 overflow-hidden z-10 px-4 text-center"
      >
        <div className="max-w-7xl mx-auto relative">
          {/* ETIQUETA ESTILO RETABLO AYACUCHANO (SIN IMAGEN, SOLO CÓDIGO) */}
          {/* 1. Contenedor exterior: Crea el borde colorido usando un fondo degradado y padding */}
          <span className="inline-block p-[4px] rounded-full bg-[conic-gradient(at_top,_#D92525,_#FFD700,_#FF1493,_#00A86B,_#1E90FF,_#D92525)] mb-8 shadow-[0_4px_15px_rgba(217,37,37,0.3)] hover:shadow-[0_6px_20px_rgba(217,37,37,0.5)] transition-all hover:scale-105 cursor-default">
            {/* 2. Contenedor interior: El fondo blanco que hace que el texto resalte */}
            <span className="block px-8 py-2.5 rounded-full bg-white relative overflow-hidden">
              {/* (Opcional) Un toque de "brillo" decorativo en el fondo */}
              <span className="absolute inset-0 bg-gradient-to-tr from-yellow-100/50 to-transparent opacity-50"></span>

              {/* 3. El Texto: Colorido con degradado y estilo audaz */}
              <span className="relative z-10 text-sm md:text-base font-black tracking-[0.25em] uppercase bg-gradient-to-r from-[#D92525] via-[#FF1493] via-[#FFD700] to-[#00A86B] bg-clip-text text-transparent drop-shadow-sm">
                Ayacucho, Perú
              </span>
            </span>
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 text-rose-950 tracking-tight leading-tight">
            {" "}
            Descubre la magia <br /> de los Andes{" "}
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            {" "}
            Un refugio donde la historia colonial se encuentra con el confort
            contemporáneo.{" "}
          </p>

          <div className="bg-white p-2 rounded-full shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center border border-stone-100 mb-8 divide-y md:divide-y-0 md:divide-x divide-stone-100">
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
                className="bg-[#700824] text-white px-8 py-4 rounded-full shadow-lg hover:bg-black transition-all w-full flex items-center justify-center gap-2 group"
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

      {/* --- SECCIÓN SERVICIOS ACTUALIZADA --- */}

      <section id="servicios" className="py-24 relative z-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-700 font-bold tracking-widest text-xs uppercase bg-rose-50 px-4 py-2 rounded-full border border-rose-100 shadow-sm">
              Experiencia Kametza
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-rose-950 mt-4">
              Mucho más que <br /> solo descansar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[250px]">
            {/* 1. COCHERA (Tarjeta Grande Horizontal) */}
            <div className="group relative lg:col-span-2 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-default">
              <img
                src=""
                alt="Cochera"
                className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105 bg-stone-200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <div className="flex items-center gap-3 mb-2 text-rose-400">
                  <Car size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                    Gratuito
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Cochera Privada
                </h3>
                <p className="text-stone-300 text-sm font-light max-w-sm">
                  Estacionamiento seguro 24/7 dentro de nuestras instalaciones
                  para tu total tranquilidad.
                </p>
              </div>
            </div>

            {/* 2. DESAYUNOS (Tarjeta Alta Vertical) */}
            <div className="group relative lg:row-span-2 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 bg-[#700824]">
              <img
                src=""
                alt="Desayuno"
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay transition duration-700 group-hover:scale-110 bg-rose-900"
              />
              <div className="relative h-full flex flex-col justify-end p-8 z-10">
                <div className="bg-white/10 backdrop-blur-md w-14 h-14 rounded-full flex items-center justify-center mb-6 text-white border border-white/20">
                  <Coffee size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Desayuno Regional
                </h3>
                <p className="text-rose-100 text-sm leading-relaxed">
                  Empieza el día con el aroma del café ayacuchano y nuestro
                  famoso pan chapla recién horneado, quesos frescos y jugos
                  naturales.
                </p>
              </div>
            </div>

            {/* 3. ROOM SERVICE (Tarjeta Pequeña Blanca) */}
            <div className="group bg-white rounded-[2rem] p-8 flex flex-col justify-between shadow-sm border border-stone-100 hover:border-rose-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-700 group-hover:scale-110 transition duration-300">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">
                  Room Service
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed">
                  Atención directa a tu habitación para tu máxima comodidad y
                  privacidad cuando lo desees.
                </p>
              </div>
            </div>

            {/* 4. LAVANDERÍA (Tarjeta Pequeña Blanca) */}
            <div className="group bg-white rounded-[2rem] p-8 flex flex-col justify-between shadow-sm border border-stone-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 group-hover:scale-110 transition duration-300">
                <Shirt size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">
                  Lavandería
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed">
                  Servicio de lavado y secado rápido y cuidadoso para que viajes
                  ligero y sin preocupaciones.
                </p>
              </div>
            </div>

            {/* 5. TRASLADOS (Tarjeta Pequeña con Foto) */}
            <div className="group relative rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
              <img
                src=""
                alt="Traslados"
                className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110 bg-stone-300"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition duration-500"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      Traslados
                    </h3>
                    <p className="text-stone-200 text-[10px] uppercase tracking-wider mt-1">
                      Aeropuerto - Hotel
                    </p>
                  </div>
                  <Plane size={24} className="text-white opacity-90" />
                </div>
              </div>
            </div>

            {/* 6. TOURS (Tarjeta Grande Final) */}
            <div className="group relative lg:col-span-2 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer">
              <img
                src=""
                alt="Tours Ayacucho"
                className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105 bg-stone-400"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#700824]/95 via-[#700824]/60 to-transparent"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-center max-w-sm">
                <div className="flex items-center gap-2 text-amber-400 mb-3">
                  <Map size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2 py-1 rounded">
                    Garantía y Seguridad
                  </span>
                </div>
                <h3 className="text-3xl font-serif font-medium text-white mb-2 leading-tight">
                  Descubre Ayacucho
                </h3>
                <p className="text-stone-200 text-sm mb-6 font-light">
                  Coordinamos tus tours a las aguas turquesas, iglesias y
                  miradores con agencias aliadas de total confianza.
                </p>
                <span className="inline-flex items-center gap-2 text-white font-bold text-sm group-hover:gap-4 transition-all bg-white/20 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/30 hover:bg-white/30">
                  Coordinar Tour <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="habitaciones" className="py-20 relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950">
              {" "}
              Nuestras Habitaciones{" "}
            </h2>
            <p className="text-stone-500 mt-2">
              {" "}
              Espacios diseñados para tu máximo descanso{" "}
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto">
            {groupedRooms.map((room: any) => (
              <RoomCard
                key={room.name}
                room={room}
                onRequireAuth={triggerAuthFlow}
                globalCheckIn={globalCheckIn}
                globalCheckOut={globalCheckOut}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="ubicacion" className="py-20 bg-white relative z-10 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-rose-700 font-bold tracking-wider text-sm uppercase">
              {" "}
              Ubicación Estratégica{" "}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950 mt-2 mb-6">
              {" "}
              Tranquilidad y Fácil Acceso{" "}
            </h2>
            <div className="mb-8 bg-[#FDFBF7] p-6 rounded-2xl border border-stone-100">
              <p className="text-sm text-stone-400 uppercase font-bold mb-1">
                {" "}
                Dirección Exacta{" "}
              </p>
              <p className="text-xl font-bold text-stone-800">
                {" "}
                Jirón Las Américas #154{" "}
              </p>
              <p className="text-rose-700 font-medium mt-1">
                {" "}
                Ref. Óvalo Magdalena, Ayacucho{" "}
              </p>
            </div>
            <p className="text-stone-600 mb-6 leading-relaxed">
              {" "}
              Ubicados en una zona apacible cerca al Óvalo Magdalena, ideal para
              descansar lejos del bullicio pero conectados con toda la ciudad.{" "}
            </p>
          </div>
          <div className="h-96 w-full bg-stone-200 rounded-3xl overflow-hidden shadow-2xl shadow-stone-300 border-4 border-white">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.995393240292!2d-74.2235946851765!3d-13.16222699072975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91127d8e8e7e7e7f%3A0x7e7e7e7e7e7e7e7e!2sJir%C3%B3n%20Las%20Am%C3%A9ricas%20154%2C%20Ayacucho%2005001!5e0!3m2!1ses-419!2spe!4v1620000000000!5m2!1ses-419!2spe"
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
        className="py-24 bg-[#700824]/90 relative overflow-hidden z-10 px-4"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-4 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase mb-6 shadow-sm">
            {" "}
            Atención 24/7{" "}
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-white drop-shadow-lg">
            {" "}
            ¿Deseas una atención directa?{" "}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center mb-16">
            <a
              href="https://wa.me/51966556622"
              target="_blank"
              className="p-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/20 transition duration-300 group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                💬
              </div>
              <h3 className="font-black text-xl mb-2 text-white">WhatsApp</h3>
              <p className="text-rose-200 font-black text-2xl">966 556 622</p>
            </a>
            <a
              href="tel:+51920042099"
              className="p-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/20 transition duration-300 group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                📞
              </div>
              <h3 className="font-black text-xl mb-2 text-white">Llamar</h3>
              <p className="text-rose-200 font-black text-2xl">920 042 099</p>
            </a>
            <a
              href="mailto:kametzahotelayacucho@gmail.com"
              className="p-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/20 transition duration-300 group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                ✉️
              </div>
              <h3 className="font-black text-xl mb-2 text-white">Correo</h3>
              <p className="text-rose-200 font-black text-sm">
                kametzahotelayacucho@gmail.com
              </p>
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-10 border-t border-white/20">
            <a
              href="https://www.facebook.com/share/1KhmvycDcR/"
              target="_blank"
              className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/20 hover:bg-[#1877F2] transition font-black text-white text-sm"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
                className="w-5 h-5"
                alt="Facebook"
              />{" "}
              FACEBOOK
            </a>
            <a
              href="https://www.instagram.com/kametzahotelayacucho/"
              target="_blank"
              className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/20 hover:bg-[#E4405F] transition font-black text-white text-sm"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174855.png"
                className="w-5 h-5"
                alt="Instagram"
              />{" "}
              INSTAGRAM
            </a>
            <a
              href="https://tiktok.com/@HotelKametza"
              target="_blank"
              className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/20 hover:bg-black transition font-black text-white text-sm"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png"
                className="w-5 h-5 brightness-0 invert"
                alt="TikTok"
              />{" "}
              TIKTOK
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-stone-900 text-stone-400 py-12 text-sm relative z-10 px-4 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-white mb-1">© 2025 Hotel Kametza.</p>
            <p className="text-xs text-stone-500">
              RUC: 10452685951 • Ayacucho, Perú.
            </p>
          </div>
          <div className="flex gap-6">
            {" "}
            <a href="/admin" className="hover:text-white transition">
              {" "}
              Admin Login{" "}
            </a>{" "}
          </div>
        </div>
      </footer>
    </div>
  );
}
