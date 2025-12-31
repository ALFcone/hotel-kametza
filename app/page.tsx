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

  // 1. CARGA DE DATOS
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

  // Lógica de agrupación de habitaciones
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
      if (!roomTypes[room.name].firstAvailableId)
        roomTypes[room.name].firstAvailableId = room.id;
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
      </div>

      {/* --- NAVBAR (FONDO BLANCO PARA QUE EL LOGO SE VEA BIEN) --- */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            {/* LOGO: Sin trucos de mezcla, fondo blanco sobre fondo blanco = Transparente visualmente */}
            <div className="flex-shrink-0 z-[110]">
              <a href="#inicio" onClick={closeMenu}>
                <img
                  src="/logo.jpg"
                  alt="Hotel Kametza"
                  className="h-14 md:h-20 w-auto object-contain"
                />
              </a>
            </div>

            {/* MENÚ DE ESCRITORIO */}
            <div className="hidden md:flex space-x-8 text-[11px] font-black uppercase tracking-[0.2em] text-stone-600 items-center">
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
              <a
                href="#habitaciones"
                className="bg-[#700824] text-white px-6 py-2.5 rounded-full hover:bg-black transition-all shadow-lg"
              >
                Reservar
              </a>
            </div>

            {/* BOTÓN HAMBURGUESA (Móvil) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden z-[110] p-2 text-[#700824]"
            >
              {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
            </button>
          </div>
        </div>

        {/* --- MENÚ MÓVIL (PANTALLA COMPLETA) --- */}
        {/* Usamos un fondo SÓLIDO blanco para tapar todo el contenido de atrás */}
        <div
          className={`fixed inset-0 bg-white z-[105] flex flex-col justify-center items-center transition-all duration-300 ease-in-out ${
            isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <div className="flex flex-col space-y-6 text-center">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800 hover:text-[#700824]"
            >
              Inicio
            </a>
            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800 hover:text-[#700824]"
            >
              Habitaciones
            </a>
            <a
              href="#servicios"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800 hover:text-[#700824]"
            >
              Servicios
            </a>
            <a
              href="#contacto"
              onClick={closeMenu}
              className="text-xl font-bold uppercase tracking-widest text-stone-800 hover:text-[#700824]"
            >
              Contacto
            </a>

            {/* Botón de reservar ajustado para móvil */}
            <a
              href="#habitaciones"
              onClick={closeMenu}
              className="mt-4 bg-[#700824] text-white px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest shadow-xl"
            >
              Reservar Ahora
            </a>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        id="inicio"
        className="relative pt-32 pb-20 overflow-hidden z-10 px-4 text-center"
      >
        <span className="inline-block py-1 px-4 rounded-full bg-rose-50 border border-rose-100 text-[#700824] text-[10px] font-bold tracking-widest uppercase mb-6 shadow-sm">
          Ayacucho, Perú
        </span>
        <h1 className="text-4xl md:text-6xl font-serif font-medium mb-4 text-rose-950 leading-tight">
          Descubre la magia <br /> de los Andes
        </h1>
        <p className="text-base md:text-xl text-stone-600 max-w-2xl mx-auto mb-8 font-light">
          Un refugio donde la historia colonial se encuentra con el confort
          contemporáneo.
        </p>
        <a
          href="#habitaciones"
          className="inline-block px-8 py-4 bg-[#700824] text-white rounded-xl font-bold shadow-xl"
        >
          Ver Habitaciones
        </a>
      </section>

      {/* --- SERVICIOS --- */}
      <section id="servicios" className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "☕",
              title: "Desayuno Local",
              desc: "Pan chapla y café recién pasado.",
            },
            {
              icon: "📡",
              title: "Wi-Fi Veloz",
              desc: "Fibra óptica ideal para trabajar.",
            },
            {
              icon: "🚕",
              title: "Traslados",
              desc: "Coordinación de tours seguros.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white border border-stone-100 shadow-lg flex flex-col items-center text-center"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-rose-950 mb-2">
                {item.title}
              </h3>
              <p className="text-stone-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- HABITACIONES --- */}
      <section id="habitaciones" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950">
              Nuestras Habitaciones
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-2">
            {groupedRooms.map((room: any) => (
              <div
                key={room.name}
                className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-stone-100"
              >
                <div className="relative h-64 md:h-80">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-[#700824] text-white px-4 py-1.5 rounded-xl shadow-lg">
                    <p className="text-[10px] uppercase font-bold opacity-80">
                      Desde
                    </p>
                    <p className="text-lg font-black">
                      S/ {room.price_per_night}
                    </p>
                  </div>
                  <div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                      room.availableCount > 0 ? "bg-emerald-500" : "bg-rose-600"
                    }`}
                  >
                    {room.availableCount > 0
                      ? `🟢 ${room.availableCount} Libres`
                      : "🔴 Agotado"}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={14} className="text-[#700824] fill-[#700824]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Premium
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-rose-950 mb-3">
                    {room.name}
                  </h3>
                  <p className="text-stone-500 text-sm mb-6 font-light leading-relaxed">
                    {room.description ||
                      "Espacio confortable para tu descanso."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6 pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2 text-[#700824]">
                      <Tv size={16} />
                      <span className="text-[10px] font-bold text-stone-600">
                        TV Cable
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#700824]">
                      <Wifi size={16} />
                      <span className="text-[10px] font-bold text-stone-600">
                        WiFi 5G
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#700824]">
                      <Clock size={16} />
                      <span className="text-[10px] font-bold text-stone-600">
                        Agua Caliente
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#700824]">
                      <Users size={16} />
                      <span className="text-[10px] font-bold text-stone-600">
                        Baño Privado
                      </span>
                    </div>
                  </div>

                  {room.availableCount > 0 ? (
                    <form
                      action={createBooking}
                      className="flex flex-col gap-3"
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
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          name="checkIn"
                          required
                          className="p-3 border rounded-xl text-xs bg-stone-50"
                        />
                        <input
                          type="date"
                          name="checkOut"
                          required
                          className="p-3 border rounded-xl text-xs bg-stone-50"
                        />
                      </div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Tu Nombre"
                        required
                        className="p-3 border rounded-xl text-xs bg-stone-50"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Tu Correo"
                        required
                        className="p-3 border rounded-xl text-xs bg-stone-50"
                      />
                      <button
                        type="submit"
                        className="w-full bg-[#700824] text-white font-black py-4 rounded-xl hover:bg-black transition-all flex justify-center gap-2 uppercase text-xs tracking-widest"
                      >
                        Reservar <ArrowRight size={16} />
                      </button>
                    </form>
                  ) : (
                    <div className="bg-stone-100 text-stone-400 p-4 rounded-xl text-center font-bold text-xs">
                      Sin Disponibilidad Hoy
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- UBICACIÓN --- */}
      <section id="ubicacion" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold text-rose-950 mb-4">
              Ubicación Perfecta
            </h2>
            <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-stone-100">
              <p className="font-bold text-stone-800">
                Jirón Las Américas #154
              </p>
              <p className="text-rose-700 text-sm">
                Ref. Óvalo Magdalena, Ayacucho
              </p>
            </div>
          </div>
          <div className="h-64 bg-stone-200 rounded-3xl overflow-hidden border-4 border-stone-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15550.00000000000!2d-74.223!3d-13.16!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA5JzM2LjAiUyA3NMKwMTMnMjIuOCJX!5e0!3m2!1ses!2spe!4v1710000000000!5m2!1ses!2spe"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              title="Mapa"
            ></iframe>
          </div>
        </div>
      </section>

      {/* --- CONTACTO --- */}
      <section id="contacto" className="py-16 bg-[#700824] px-4 text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-8">
          Contáctanos
        </h2>
        <div className="grid gap-4 max-w-lg mx-auto mb-12">
          <a
            href="https://wa.me/51966556622"
            className="flex items-center justify-center gap-3 bg-white/10 p-4 rounded-2xl text-white hover:bg-white/20"
          >
            <span>💬</span>{" "}
            <span className="font-bold">WhatsApp: 966 556 622</span>
          </a>
          <a
            href="tel:+51920042099"
            className="flex items-center justify-center gap-3 bg-white/10 p-4 rounded-2xl text-white hover:bg-white/20"
          >
            <span>📞</span>{" "}
            <span className="font-bold">Llamar: 920 042 099</span>
          </a>
        </div>
        <div className="flex justify-center gap-4">
          <a
            href="https://facebook.com"
            className="text-white text-xs font-bold uppercase tracking-widest border border-white/30 px-4 py-2 rounded-full"
          >
            Facebook
          </a>
          <a
            href="https://instagram.com"
            className="text-white text-xs font-bold uppercase tracking-widest border border-white/30 px-4 py-2 rounded-full"
          >
            Instagram
          </a>
          <a
            href="https://tiktok.com"
            className="text-white text-xs font-bold uppercase tracking-widest border border-white/30 px-4 py-2 rounded-full"
          >
            TikTok
          </a>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-stone-900 text-stone-500 py-12 text-center">
        <img
          src="/logo.jpg"
          alt="Logo Footer"
          className="h-32 mx-auto mb-6 object-contain opacity-80"
        />
        <p className="text-xs">© 2025 Hotel Kametza</p>
        <a
          href="/admin"
          className="text-[10px] mt-2 inline-block opacity-50 hover:opacity-100"
        >
          Admin
        </a>
      </footer>
    </div>
  );
}
