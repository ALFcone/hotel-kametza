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
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow"></div>
        <div className="absolute top-[40%] right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      {/* --- NAVBAR SOMBRA 2XL Y LOGO XL --- */}
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
              href="#servicios"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800"
            >
              Servicios
            </a>
            <a
              href="#ubicacion"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800"
            >
              Ubicación
            </a>
            <a
              href="#contacto"
              onClick={closeMenu}
              className="text-2xl font-bold uppercase text-stone-800"
            >
              Contacto
            </a>
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
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

      {/* --- SERVICIOS --- */}
      <section id="servicios" className="py-20 relative z-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                className="p-8 rounded-3xl bg-white border border-stone-100 shadow-xl hover:shadow-2xl transition duration-300"
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
        </div>
      </section>

      {/* --- HABITACIONES CON ICONOS Y DESC --- */}
      <section id="habitaciones" className="py-20 relative z-10 px-4">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950">
            {" "}
            Nuestras Habitaciones{" "}
          </h2>
        </div>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto">
          {groupedRooms.map((room: any) => (
            <div
              key={room.name}
              className="group bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-stone-100 flex flex-col hover:shadow-[0_20px_50px_rgba(112,8,36,0.15)] transition-all duration-500"
            >
              <div className="relative h-72 md:h-80 w-full overflow-hidden">
                <img
                  src={room.image_url}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute top-6 left-6 bg-[#700824] text-white px-5 py-2 rounded-2xl shadow-xl z-20">
                  <p className="text-xl font-black">
                    {" "}
                    S/ {room.price_per_night}{" "}
                  </p>
                </div>
              </div>
              <div className="p-8 md:p-10 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={14} className="fill-[#700824] text-[#700824]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                    {" "}
                    Premium{" "}
                  </span>
                </div>
                <h3 className="text-3xl font-serif font-bold text-rose-950 mb-4">
                  {" "}
                  {room.name}{" "}
                </h3>

                {/* DESCRIPCIÓN */}
                <div className="text-stone-500 text-sm mb-6 leading-relaxed font-light">
                  {room.name === "Individual Estándar" && (
                    <p>
                      Diseñada para el viajero moderno que busca eficiencia y
                      confort. Disfrute de una cama de 2 plazas en un entorno
                      privado.
                    </p>
                  )}
                  {room.name === "Matrimonial Estándar" && (
                    <p>
                      Un santuario de calidez para parejas. Espacio
                      elegantemente decorado con cama matrimonial e iluminación
                      cálida.
                    </p>
                  )}
                  {room.name === "Doble Estándar" && (
                    <p>
                      La opción perfecta para viajes compartidos. Dos amplias
                      camas independientes que garantizan espacio para ambos
                      huéspedes.
                    </p>
                  )}
                  {room.name === "Triple Estándar" && (
                    <p>
                      Amplitud sin compromisos para grupos o familias. Tres
                      camas distribuidas en un ambiente ventilado y cómodo.
                    </p>
                  )}
                  {room.name === "Ejecutiva" && (
                    <p>
                      Nuestra máxima expresión de lujo. Cama Queen Size,
                      acabados de primera y escritorio ergonómico para trabajo
                      premium.
                    </p>
                  )}
                </div>

                {/* LOGOS DE SERVICIOS (WIFI, TV, ETC) */}
                <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-stone-100">
                  <div className="flex items-center gap-2 text-[#700824]">
                    <Tv size={18} />
                    <span className="text-[11px] font-bold text-stone-600 uppercase">
                      Smart TV
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#700824]">
                    <Wifi size={18} />
                    <span className="text-[11px] font-bold text-stone-600 uppercase">
                      WiFi Fibra
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#700824]">
                    <Clock size={18} />
                    <span className="text-[11px] font-bold text-stone-600 uppercase">
                      Agua Caliente
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#700824]">
                    <Users size={18} />
                    <span className="text-[11px] font-bold text-stone-600 uppercase">
                      Baño Privado
                    </span>
                  </div>
                </div>

                <div className="mt-auto">
                  <form action={createBooking} className="flex flex-col gap-4">
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
                        className="p-4 border rounded-2xl text-xs bg-stone-50"
                      />
                      <input
                        type="date"
                        name="checkOut"
                        required
                        className="p-4 border rounded-2xl text-xs bg-stone-50"
                      />
                    </div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Tu Nombre"
                      required
                      className="p-4 border rounded-2xl text-xs bg-stone-50"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#700824] text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                    >
                      {" "}
                      Reservar Ahora <ArrowRight size={16} />{" "}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- UBICACIÓN --- */}
      <section id="ubicacion" className="py-20 bg-white relative z-10 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950 mb-6">
              Ubicación Estratégica
            </h2>
            <div className="mb-8 bg-[#FDFBF7] p-6 rounded-2xl border border-stone-100">
              <p className="text-xl font-bold text-stone-800">
                Jirón Las Américas #154
              </p>
              <p className="text-rose-700 font-medium">
                Ref. Óvalo Magdalena, Ayacucho
              </p>
            </div>
            <p className="text-stone-600 leading-relaxed">
              {" "}
              Conectados con toda la ciudad, ideal para un descanso reparador.{" "}
            </p>
          </div>
          <div className="h-96 w-full bg-stone-200 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15550.00000000000!2d-74.223!3d-13.16!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA5JzM2LjAiUyA3NMKwMTMnMjIuOCJX!5e0!3m2!1ses!2spe!4v1710000000000!5m2!1ses!2spe"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      {/* --- CONTACTO Y REDES --- */}
      <section
        id="contacto"
        className="py-24 bg-[#700824]/90 relative overflow-hidden z-10 px-4 text-center text-white"
      >
        <h2 className="text-4xl font-serif font-bold mb-12">Atención 24/7</h2>
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          <a
            href="https://wa.me/51966556622"
            className="p-8 bg-white/10 rounded-[2.5rem] hover:bg-white/20 transition shadow-2xl"
          >
            {" "}
            💬 <h3 className="font-bold mt-2">WhatsApp</h3>{" "}
            <p className="text-rose-200">966 556 622</p>{" "}
          </a>
          <a
            href="tel:+51920042099"
            className="p-8 bg-white/10 rounded-[2.5rem] hover:bg-white/20 transition shadow-2xl"
          >
            {" "}
            📞 <h3 className="font-bold mt-2">Llamar</h3>{" "}
            <p className="text-rose-200">920 042 099</p>{" "}
          </a>
          <a
            href="mailto:kametzahotelayacucho@gmail.com"
            className="p-8 bg-white/10 rounded-[2.5rem] hover:bg-white/20 transition shadow-2xl"
          >
            {" "}
            ✉️ <h3 className="font-bold mt-2">Correo</h3>{" "}
            <p className="text-rose-200 text-xs">
              kametzahotelayacucho@gmail.com
            </p>{" "}
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pt-10 border-t border-white/20">
          <a
            href="https://facebook.com/share/1KhmvycDcR/"
            className="flex items-center gap-2 text-sm font-bold uppercase"
          >
            {" "}
            <img
              src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
              className="w-5 h-5"
              alt="FB"
            />{" "}
            Facebook{" "}
          </a>
          <a
            href="https://instagram.com/kametzahotelayacucho/"
            className="flex items-center gap-2 text-sm font-bold uppercase"
          >
            {" "}
            <img
              src="https://cdn-icons-png.flaticon.com/512/174/174855.png"
              className="w-5 h-5"
              alt="IG"
            />{" "}
            Instagram{" "}
          </a>
        </div>
      </section>

      <footer className="bg-stone-900 text-stone-400 py-12 text-center text-sm">
        <p>© 2025 Hotel Kametza. Ayacucho, Perú.</p>
        <a
          href="/admin"
          className="text-[9px] mt-4 inline-block bg-white/5 px-3 py-1 rounded-full"
        >
          Admin Login
        </a>
      </footer>
    </div>
  );
}
