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
} from "lucide-react";

// --- TIPOS DE DATOS ---
interface Room {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  image_url: string | null;
  room_number: string;
}

// --- COMPONENTE INTERNO: TARJETA DE HABITACIÓN ---
function RoomCard({ room }: { room: any }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalPrice, setTotalPrice] = useState(room.price_per_night);
  const [nights, setNights] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lógica de precios
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

  // Manejador de envío (Pago)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const method = formData.get("paymentMethod");

    // 1. Si es online, abrir pestaña nueva
    let newTab: Window | null = null;
    if (method === "online") {
      newTab = window.open("", "_blank");
      if (newTab) {
        newTab.document.write(
          "<div style='height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;'><h2>Cargando pasarela segura...</h2></div>"
        );
      }
    }

    try {
      // 2. Llamar al servidor
      const response = await createBooking(formData);

      if (response?.error) {
        alert(response.error);
        if (newTab) newTab.close();
      } else if (response?.success && response.url) {
        // 3. Redirigir
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
      alert("Error al procesar la reserva.");
      if (newTab) newTab.close();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="group bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-stone-100 flex flex-col hover:shadow-[0_20px_50px_rgba(112,8,36,0.2)] transition-all duration-500">
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <img
          src={room.image_url}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute top-6 left-6 bg-[#700824] text-white px-5 py-2 rounded-2xl shadow-xl z-20">
          <p className="text-[10px] uppercase font-bold opacity-80 mb-0.5">
            Precio Noche
          </p>
          <p className="text-xl font-black">S/ {room.price_per_night}</p>
        </div>
        <div
          className={`absolute top-6 right-6 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md z-20 ${
            room.availableCount > 0
              ? "bg-emerald-500/90 text-white"
              : "bg-rose-600/90 text-white"
          }`}
        >
          {room.availableCount > 0
            ? `🟢 ${room.availableCount} Libres`
            : "🔴 Agotado"}
        </div>
      </div>

      <div className="p-8 md:p-10 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-4">
          <Star size={14} className="fill-[#700824] text-[#700824]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
            Categoría Premium
          </span>
        </div>
        <h3 className="text-3xl font-serif font-bold text-rose-950 mb-4">
          {room.name}
        </h3>
        <div className="text-stone-500 text-sm mb-8 leading-relaxed font-light">
          {room.description}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-stone-100">
          <div className="flex items-center gap-2 text-[#700824]">
            <Tv size={18} />
            <span className="text-[10px] font-bold text-stone-600 uppercase">
              Smart TV
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#700824]">
            <Wifi size={18} />
            <span className="text-[10px] font-bold text-stone-600 uppercase">
              WiFi Fibra
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#700824]">
            <Clock size={18} />
            <span className="text-[10px] font-bold text-stone-600 uppercase">
              Agua Caliente
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#700824]">
            <Users size={18} />
            <span className="text-[10px] font-bold text-stone-600 uppercase">
              Baño Privado
            </span>
          </div>
        </div>

        <div className="mt-auto">
          {room.availableCount > 0 ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="hidden"
                name="roomId"
                value={room.firstAvailableId}
              />
              <input type="hidden" name="price" value={totalPrice} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">
                    Llegada
                  </label>
                  <input
                    type="date"
                    name="checkIn"
                    required
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">
                    Salida
                  </label>
                  <input
                    type="date"
                    name="checkOut"
                    required
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl border border-rose-100">
                <span className="text-xs font-bold text-rose-800 uppercase">
                  Total ({nights} noches):
                </span>
                <span className="text-xl font-black text-[#700824]">
                  S/ {totalPrice}
                </span>
              </div>
              <input
                type="text"
                name="name"
                placeholder="Nombre completo"
                required
                className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none"
              />
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                required
                className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none"
              />

              <div className="relative">
                {/* --- AQUÍ HE QUITADO TODAS LAS OPCIONES MANUALES --- */}
                <select
                  name="paymentMethod"
                  required
                  defaultValue=""
                  className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none appearance-none font-bold text-stone-600 cursor-pointer"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-xs">
                  ▼
                </div>
              </div>

              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-[#700824] text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {isSubmitting ? (
                  "Procesando..."
                ) : (
                  <>
                    Reservar Ahora <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-stone-100 text-stone-400 p-6 rounded-2xl text-center font-bold text-xs uppercase tracking-widest">
              Agotado Temporalmente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*")
        .order("id");
      const today = new Date().toISOString().split("T")[0];
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("room_id")
        .lte("check_in", today)
        .gte("check_out", today);

      if (roomsData) setRooms(roomsData);
      if (bookingsData) setBusyIds(bookingsData.map((b: any) => b.room_id));
      setLoading(false);
    };
    fetchData();
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const roomTypes: any = {};
  rooms.forEach((room) => {
    if (!roomTypes[room.name]) {
      roomTypes[room.name] = {
        ...room,
        availableCount: 0,
        firstAvailableId: null,
      };
    }
    if (!busyIds.includes(room.id)) {
      roomTypes[room.name].availableCount++;
      if (!roomTypes[room.name].firstAvailableId) {
        roomTypes[room.name].firstAvailableId = room.id;
      }
    }
  });
  const groupedRooms = Object.values(roomTypes);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white text-[#700824] font-bold animate-pulse">
        Cargando Hotel Kametza...
      </div>
    );

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#FDFBF7] selection:bg-rose-200 selection:text-rose-900">
      {/* FONDO DECORATIVO */}
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
            <div className="hidden md:block">
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
          <div className="flex flex-col space-y-8 text-center">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800"
            >
              Inicio
            </a>
            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800"
            >
              Habitaciones
            </a>
            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="mt-4 bg-rose-900 text-white px-10 py-4 rounded-full font-bold shadow-lg"
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
          <span className="inline-block py-1.5 px-4 rounded-full bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
            {" "}
            Ayacucho, Perú{" "}
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
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a
              href="#habitaciones"
              className="px-8 py-4 bg-rose-900 text-white rounded-xl font-bold hover:bg-rose-800 shadow-xl transition"
            >
              {" "}
              Ver Habitaciones{" "}
            </a>
            <a
              href="#contacto"
              className="px-8 py-4 bg-white text-stone-800 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition shadow-sm"
            >
              {" "}
              Contáctanos{" "}
            </a>
          </div>
        </div>
      </section>

      <section id="servicios" className="py-20 relative z-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "☕",
              title: "Desayuno Local",
              desc: "Pan chapla, quesos y café.",
            },
            { icon: "📡", title: "Wi-Fi Veloz", desc: "Fibra óptica ideal." },
            {
              icon: "🚕",
              title: "Traslados",
              desc: "Coordinación de tours y taxis.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-white border border-stone-100 shadow-xl shadow-stone-200/50 hover:-translate-y-1 transition duration-300"
            >
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl mb-6 text-rose-700">
                {" "}
                {item.icon}{" "}
              </div>
              <h3 className="text-xl font-serif font-bold mb-3 text-rose-950">
                {" "}
                {item.title}{" "}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {" "}
                {item.desc}{" "}
              </p>
            </div>
          ))}
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
              <RoomCard key={room.name} room={room} />
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
