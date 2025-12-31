"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 1. CARGA DE DATOS (CLIENT SIDE)
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

  // Función para cerrar menú al dar click
  const closeMenu = () => setIsMenuOpen(false);

  // 3. AGRUPACIÓN DE HABITACIONES
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-[#700824] font-bold animate-pulse">
        Cargando Hotel Kametza...
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#FDFBF7] selection:bg-rose-200 selection:text-rose-900">
      {/* FONDO DECORATIVO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow"></div>
        <div className="absolute top-[40%] right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      {/* --- NAVBAR RESPONSIVO (FONDO BLANCO PARA MIMETIZAR LOGO) --- */}
      <nav className="fixed top-0 w-full bg-white z-[100] shadow-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 md:h-32">
            {/* LOGO AUMENTADO */}
            <div className="flex-shrink-0 z-[110]">
              <a href="#inicio" onClick={closeMenu}>
                <img
                  src="/logo.jpg"
                  alt="Hotel Kametza"
                  className="h-20 md:h-28 w-auto object-contain"
                />
              </a>
            </div>

            {/* MENÚ ESCRITORIO */}
            <div className="hidden md:flex space-x-10 text-[12px] font-black uppercase tracking-[0.2em] text-stone-600 items-center">
              <a
                href="#inicio"
                className="hover:text-[#700824] transition-colors"
              >
                Inicio
              </a>
              <a
                href="#habitaciones"
                className="hover:text-[#700824] transition-colors"
              >
                Habitaciones
              </a>
              <a
                href="#servicios"
                className="hover:text-[#700824] transition-colors"
              >
                Servicios
              </a>
              <a
                href="#contacto"
                className="hover:text-[#700824] transition-colors"
              >
                Contacto
              </a>
            </div>

            {/* BOTÓN RESERVAR (Escritorio) */}
            <div className="hidden md:block">
              <a
                href="#habitaciones"
                className="bg-[#700824] text-white px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-rose-900/20"
              >
                Reservar
              </a>
            </div>

            {/* BOTÓN HAMBURGUESA (Móvil) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden z-[110] p-2 text-[#700824]"
            >
              {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE (FONDO SÓLIDO PARA EVITAR MEZCLA) */}
        <div
          className={`fixed inset-0 bg-white z-[105] flex flex-col justify-center items-center transition-all duration-300 ease-in-out ${
            isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          } md:hidden`}
        >
          <div className="flex flex-col space-y-8 text-center">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800"
            >
              Inicio
            </a>
            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800"
            >
              Habitaciones
            </a>
            <a
              href="#servicios"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800"
            >
              Servicios
            </a>
            <a
              href="#contacto"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800"
            >
              Contacto
            </a>
            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="mt-4 bg-[#700824] text-white px-10 py-4 rounded-full text-sm font-black uppercase tracking-widest shadow-xl"
            >
              Reservar Ahora
            </a>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        id="inicio"
        className="relative pt-48 pb-24 overflow-hidden z-10 px-4 text-center"
      >
        <div className="max-w-7xl mx-auto relative">
          <span className="inline-block py-1.5 px-4 rounded-full bg-rose-50 border border-rose-100 text-[#700824] text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
            Ayacucho, Perú
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 text-rose-950 tracking-tight leading-tight">
            Descubre la magia <br /> de los Andes
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Un refugio donde la historia colonial se encuentra con el confort
            contemporáneo.
          </p>
          <a
            href="#habitaciones"
            className="px-8 py-4 bg-[#700824] text-white rounded-xl font-bold hover:bg-rose-950 shadow-xl transition transform hover:scale-105"
          >
            Ver Habitaciones
          </a>
        </div>
      </section>

      {/* --- SECCIÓN SERVICIOS --- */}
      <section id="servicios" className="py-20 relative z-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: "☕",
                title: "Desayuno Local",
                desc: "Pan chapla, quesos y café recién pasado.",
              },
              {
                icon: "📡",
                title: "Wi-Fi Veloz",
                desc: "Fibra óptica ideal para trabajar o compartir.",
              },
              {
                icon: "🚕",
                title: "Traslados",
                desc: "Coordinación de tours y taxis seguros.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white border border-stone-100 shadow-xl flex flex-col items-center"
              >
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-serif font-bold mb-3 text-rose-950">
                  {item.title}
                </h3>
                <p className="text-stone-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECCIÓN HABITACIONES --- */}
      <section id="habitaciones" className="py-20 relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950">
              Nuestras Habitaciones
            </h2>
          </div>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto">
            {groupedRooms.map((room: any) => (
              <div
                key={room.name}
                className="group bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-stone-100 flex flex-col transition-all duration-500"
              >
                <div className="relative h-72 md:h-96 w-full overflow-hidden">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-6 left-6 bg-[#700824] text-white px-5 py-2 rounded-2xl shadow-xl z-20">
                    <p className="text-[10px] uppercase font-bold opacity-80 mb-0.5">
                      Desde
                    </p>
                    <p className="text-xl font-black">
                      S/ {room.price_per_night}
                    </p>
                  </div>
                  <div
                    className={`absolute top-6 right-6 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg text-white ${
                      room.availableCount > 0
                        ? "bg-emerald-500/90"
                        : "bg-rose-600/90"
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
                  <p className="text-stone-500 text-sm mb-8 leading-relaxed font-light">
                    {room.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-10 pt-8 border-t border-stone-100">
                    <div className="flex items-center gap-3 text-[#700824]">
                      <Tv size={18} />
                      <span className="text-[11px] font-black text-stone-600 uppercase">
                        Smart TV
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#700824]">
                      <Wifi size={18} />
                      <span className="text-[11px] font-black text-stone-600 uppercase">
                        WiFi 5G
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#700824]">
                      <Clock size={18} />
                      <span className="text-[11px] font-black text-stone-600 uppercase">
                        Agua Caliente
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#700824]">
                      <Users size={18} />
                      <span className="text-[11px] font-black text-stone-600 uppercase">
                        Baño Privado
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    {room.availableCount > 0 ? (
                      <form
                        action={createBooking}
                        className="flex flex-col gap-4"
                      >
                        <input
                          type="hidden"
                          name="roomId"
                          value={room.firstAvailableId}
                        />
                        <input
                          type="hidden"
                          name="price"
                          value={room.price_per_night}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            name="checkIn"
                            required
                            className="p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
                          />
                          <input
                            type="date"
                            name="checkOut"
                            required
                            className="p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
                          />
                        </div>
                        <input
                          type="text"
                          name="name"
                          placeholder="Nombre completo"
                          required
                          className="p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
                        />
                        <input
                          type="email"
                          name="email"
                          placeholder="Correo electrónico"
                          required
                          className="p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
                        />
                        <button
                          type="submit"
                          className="w-full bg-[#700824] text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                        >
                          Reservar Ahora <ArrowRight size={16} />
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
            ))}
          </div>
        </div>
      </section>

      {/* --- UBICACIÓN --- */}
      <section id="ubicacion" className="py-20 bg-white relative z-10 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-rose-700 font-bold tracking-wider text-sm uppercase">
              Ubicación Estratégica
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950 mt-2 mb-6">
              Tranquilidad y Fácil Acceso
            </h2>
            <div className="mb-8 bg-[#FDFBF7] p-6 rounded-2xl border border-stone-100">
              <p className="text-sm text-stone-400 uppercase font-bold mb-1">
                Dirección Exacta
              </p>
              <p className="text-xl font-bold text-stone-800">
                Jirón Las Américas #154
              </p>
              <p className="text-rose-700 font-medium mt-1">
                Ref. Óvalo Magdalena, Ayacucho
              </p>
            </div>
          </div>
          <div className="h-96 w-full bg-stone-200 rounded-3xl overflow-hidden shadow-2xl shadow-stone-300 border-4 border-white">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15550.00000000000!2d-74.223!3d-13.16!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA5JzM2LjAiUyA3NMKwMTMnMjIuOCJX!5e0!3m2!1ses!2spe!4v1710000000000!5m2!1ses!2spe"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              title="Ubicación"
            ></iframe>
          </div>
        </div>
      </section>

      {/* --- CONTACTO --- */}
      <section
        id="contacto"
        className="py-24 bg-[#700824]/90 relative overflow-hidden z-10 px-4 text-center"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-12 text-white">
            ¿Deseas atención directa?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <a
              href="https://wa.me/51966556622"
              target="_blank"
              className="p-8 bg-white/10 rounded-[2.5rem] hover:bg-white/20 transition group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                💬
              </div>
              <h3 className="font-black text-xl mb-1 text-white uppercase text-[10px] tracking-[0.2em]">
                WhatsApp
              </h3>
              <p className="text-rose-200 font-black text-xl">966 556 622</p>
            </a>
            <a
              href="tel:+51920042099"
              className="p-8 bg-white/10 rounded-[2.5rem] hover:bg-white/20 transition group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                📞
              </div>
              <h3 className="font-black text-xl mb-1 text-white uppercase text-[10px] tracking-[0.2em]">
                Llamar ahora
              </h3>
              <p className="text-rose-200 font-black text-xl">920 042 099</p>
            </a>
            <a
              href="mailto:kametzahotelayacucho@gmail.com"
              className="p-8 bg-white/10 rounded-[2.5rem] hover:bg-white/20 transition group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                ✉️
              </div>
              <h3 className="font-black text-xl mb-1 text-white uppercase text-[10px] tracking-[0.2em]">
                Correo
              </h3>
              <p className="text-rose-200 font-black text-sm">
                kametzahotelayacucho@gmail.com
              </p>
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-10 border-t border-white/20">
            <a
              href="https://www.facebook.com/share/1KhmvycDcR/"
              target="_blank"
              className="flex items-center gap-3 bg-white/10 px-8 py-4 rounded-2xl border border-white/10 hover:bg-[#1877F2] transition font-black text-white text-sm"
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
              className="flex items-center gap-3 bg-white/10 px-8 py-4 rounded-2xl border border-white/10 hover:bg-[#E4405F] transition font-black text-white text-sm"
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
              className="flex items-center gap-3 bg-white/10 px-8 py-4 rounded-2xl border border-white/10 hover:bg-black transition font-black text-white text-sm"
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

      {/* --- FOOTER SIN LOGO --- */}
      <footer className="bg-stone-900 text-stone-400 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest mb-4">
            © 2025 Hotel Kametza. Ayacucho, Perú.
          </p>
          <a
            href="/admin"
            className="text-[9px] bg-white/5 px-3 py-1 rounded-full hover:bg-white/10 transition"
          >
            Admin Access
          </a>
        </div>
      </footer>
    </div>
  );
}
