import { supabase } from "@/lib/supabase";
import { createBooking } from "./actions";
import { Tv, Wifi, Clock, Users, Star, ArrowRight } from "lucide-react";

// --- TIPOS DE DATOS ---
interface Room {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  image_url: string | null;
  room_number: string;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Traer todas las habitaciones (las 14)
  const { data: allRoomsData } = await supabase
    .from("rooms")
    .select("*")
    .order("id");
  const allRooms = (allRoomsData as Room[]) || [];

  // 2. Traer ocupación de HOY
  const today = new Date().toISOString().split("T")[0];
  const { data: busyToday } = await supabase
    .from("bookings")
    .select("room_id")
    .lte("check_in", today)
    .gte("check_out", today);

  const busyIds = busyToday?.map((b: any) => b.room_id) || [];

  // --- LÓGICA DE AGRUPACIÓN POR CATEGORÍA ---
  const roomTypes: any = {};
  allRooms.forEach((room) => {
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

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#FDFBF7] selection:bg-rose-200 selection:text-rose-900">
      {/* FONDO DECORATIVO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow"></div>
        <div className="absolute top-[40%] right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      {/* --- NAVBAR RESPONSIVO --- */}
      <nav className="fixed top-0 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-stone-200/50 z-50 shadow-sm">
        <input type="checkbox" id="menu-toggle" className="peer hidden" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center">
              <a href="#inicio" className="flex items-center gap-2">
                <img
                  src="/logo.jpg"
                  alt="Hotel Kametza"
                  className="h-14 w-auto object-contain mix-blend-multiply"
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
                className="bg-rose-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-rose-800 transition shadow-lg shadow-rose-900/20"
              >
                Reservar
              </a>
            </div>
            <label
              htmlFor="menu-toggle"
              className="md:hidden text-3xl text-rose-900 cursor-pointer select-none p-2"
            >
              ☰
            </label>
          </div>
        </div>
        <div className="hidden peer-checked:block md:hidden bg-[#FDFBF7] border-t border-stone-200 absolute w-full left-0 top-20 shadow-xl h-screen transition-all">
          <div className="flex flex-col p-8 gap-6 text-center text-lg font-medium text-stone-600">
            <a href="#inicio" className="hover:text-rose-900">
              Inicio
            </a>
            <a href="#habitaciones" className="hover:text-rose-900">
              Habitaciones
            </a>
            <a href="#servicios" className="hover:text-rose-900">
              Servicios
            </a>
            <a href="#ubicacion" className="hover:text-rose-900">
              Ubicación
            </a>
            <a href="#contacto" className="hover:text-rose-900">
              Contacto
            </a>
            <hr className="border-stone-200 my-2" />
            <a
              href="#habitaciones"
              className="bg-rose-900 text-white py-4 rounded-xl font-bold shadow-lg"
            >
              Reservar Ahora
            </a>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        id="inicio"
        className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden z-10 px-4"
      >
        <div className="max-w-7xl mx-auto text-center relative">
          <span className="inline-block py-1.5 px-4 rounded-full bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
            Ayacucho, Perú
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 text-rose-950 tracking-tight leading-tight">
            Descubre la magia <br /> de los Andes
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Un refugio donde la historia colonial se encuentra con el confort
            contemporáneo. Tu hogar lejos de casa en el corazón de Huamanga.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a
              href="#habitaciones"
              className="px-8 py-4 bg-rose-900 text-white rounded-xl font-bold hover:bg-rose-800 shadow-xl transition"
            >
              Ver Habitaciones
            </a>
            <a
              href="#contacto"
              className="px-8 py-4 bg-white text-stone-800 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition shadow-sm"
            >
              Contáctanos
            </a>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN SERVICIOS --- */}
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
                className="p-8 rounded-3xl bg-white border border-stone-100 shadow-xl shadow-stone-200/50 hover:-translate-y-1 transition duration-300"
              >
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl mb-6 text-rose-700">
                  {item.icon}
                </div>
                <h3 className="text-xl font-serif font-bold mb-3 text-rose-950">
                  {item.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECCIÓN HABITACIONES (MODERNA) --- */}
      <section id="habitaciones" className="py-20 relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950">
              Nuestras Habitaciones
            </h2>
            <p className="text-stone-500 mt-2">
              Espacios diseñados para tu máximo descanso
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto">
            {groupedRooms.map((room: any) => (
              <div
                key={room.name}
                className="group bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/40 overflow-hidden border border-stone-100 flex flex-col hover:shadow-2xl transition-all duration-500"
              >
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />

                  {/* ETIQUETA DE PRECIO FLOTANTE */}
                  <div className="absolute top-6 left-6 bg-[#700824] text-white px-5 py-2 rounded-2xl shadow-xl z-20">
                    <p className="text-[10px] uppercase font-bold opacity-80 mb-0.5">
                      Desde
                    </p>
                    <p className="text-xl font-black">
                      S/ {room.price_per_night}
                    </p>
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

                  {/* DESCRIPCIÓN ENRIQUECIDA */}
                  <div className="text-stone-500 text-sm mb-8 leading-relaxed font-light">
                    {room.name === "Individual Estándar" && (
                      <p>
                        Diseñada para el viajero moderno que busca eficiencia y
                        confort. Disfrute de una cama de 2 plazas en un entorno
                        privado y silencioso, ideal para recargar energías.
                      </p>
                    )}
                    {room.name === "Matrimonial Estándar" && (
                      <p>
                        Un santuario de calidez para parejas. Espacio
                        elegantemente decorado con cama matrimonial, iluminación
                        cálida y todas las facilidades para una estadía
                        inolvidable.
                      </p>
                    )}
                    {room.name === "Doble Estándar" && (
                      <p>
                        La opción perfecta para viajes compartidos. Dos amplias
                        camas independientes y un mobiliario funcional que
                        garantiza espacio y comodidad para ambos huéspedes.
                      </p>
                    )}
                    {room.name === "Triple Estándar" && (
                      <p>
                        Amplitud sin compromisos para grupos o familias. Tres
                        camas distribuidas en un ambiente ventilado, asegurando
                        que cada integrante disfrute de su propio espacio.
                      </p>
                    )}
                    {room.name === "Ejecutiva" && (
                      <p>
                        Nuestra máxima expresión de lujo. Cama Queen Size,
                        acabados de primera y un escritorio ergonómico pensado
                        para quienes necesitan un espacio de trabajo premium.
                      </p>
                    )}
                  </div>

                  {/* ICONOS MODERNOS */}
                  <div className="grid grid-cols-2 gap-4 mb-10 pt-8 border-t border-stone-100">
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2.5 bg-rose-50 rounded-xl group-hover/item:bg-rose-100 transition-colors text-[#700824]">
                        <Tv size={18} />
                      </div>
                      <span className="text-[11px] font-black text-stone-600 uppercase tracking-tighter">
                        Smart TV Cable
                      </span>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2.5 bg-rose-50 rounded-xl group-hover/item:bg-rose-100 transition-colors text-[#700824]">
                        <Wifi size={18} />
                      </div>
                      <span className="text-[11px] font-black text-stone-600 uppercase tracking-tighter">
                        WiFi Fibra 5G
                      </span>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2.5 bg-rose-50 rounded-xl group-hover/item:bg-rose-100 transition-colors text-[#700824]">
                        <Clock size={18} />
                      </div>
                      <span className="text-[11px] font-black text-stone-600 uppercase tracking-tighter">
                        Agua Caliente
                      </span>
                    </div>
                    <div className="flex items-center gap-3 group/item">
                      <div className="p-2.5 bg-rose-50 rounded-xl group-hover/item:bg-rose-100 transition-colors text-[#700824]">
                        <Users size={18} />
                      </div>
                      <span className="text-[11px] font-black text-stone-600 uppercase tracking-tighter">
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
                            className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none"
                          />
                          <input
                            type="date"
                            name="checkOut"
                            required
                            className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none"
                          />
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

      {/* --- SECCIÓN UBICACIÓN --- */}
      <section id="ubicacion" className="py-20 bg-white relative z-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
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
              <p className="text-stone-600 mb-6 leading-relaxed">
                Ubicados en una zona apacible cerca al Óvalo Magdalena, ideal
                para descansar lejos del bullicio pero conectados con toda la
                ciudad.
              </p>
            </div>
            <div className="h-96 w-full bg-stone-200 rounded-3xl overflow-hidden shadow-2xl shadow-stone-300 border-4 border-white">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15550.00000000000!2d-74.223!3d-13.16!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA5JzM2LjAiUyA3NMKwMTMnMjIuOCJX!5e0!3m2!1ses!2spe!4v1710000000000!5m2!1ses!2spe"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                title="Ubicación Hotel Kametza"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN CONTACTO --- */}
      <section
        id="contacto"
        className="py-24 bg-[#700824]/90 relative overflow-hidden z-10 px-4"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-4 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase mb-6 shadow-sm">
            Atención Personalizada 24/7
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-white drop-shadow-lg">
            ¿Deseas una atención directa?
          </h2>
          <p className="text-white/80 mb-12 text-lg font-medium max-w-2xl mx-auto">
            Estamos listos para coordinar tu llegada o resolver cualquier duda
            sobre tu estadía en Ayacucho.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center mb-16">
            <a
              href="https://wa.me/51966556622"
              target="_blank"
              className="p-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/20 transition duration-300 group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                💬
              </div>
              <h3 className="font-black text-xl mb-2 text-white tracking-wide">
                WhatsApp
              </h3>
              <p className="text-rose-200 font-black text-2xl">966 556 622</p>
              <span className="text-[10px] text-white/60 mt-2 block uppercase font-black">
                Click para chatear
              </span>
            </a>
            <a
              href="tel:+51920042099"
              className="p-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/20 transition duration-300 group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                📞
              </div>
              <h3 className="font-black text-xl mb-2 text-white tracking-wide">
                Llamar ahora
              </h3>
              <p className="text-rose-200 font-black text-2xl">920 042 099</p>
              <span className="text-[10px] text-white/60 mt-2 block uppercase font-black">
                Atención inmediata
              </span>
            </a>
            <a
              href="mailto:kametzahotelayacucho@gmail.com"
              className="p-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/20 transition duration-300 group shadow-2xl"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition">
                ✉️
              </div>
              <h3 className="font-black text-xl mb-2 text-white tracking-wide">
                Correo
              </h3>
              <p className="text-rose-200 font-black text-sm">
                kametzahotelayacucho@gmail.com
              </p>
              <span className="text-[10px] text-white/60 mt-2 block uppercase font-black">
                Envíanos un mensaje
              </span>
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
              />
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
              />
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
              />
              TIKTOK
            </a>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-stone-900 text-stone-400 py-12 text-sm relative z-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <p>© 2025 Hotel Kametza. Ayacucho, Perú.</p>
          <div className="flex gap-6">
            <a href="/admin" className="hover:text-white transition">
              Admin Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
