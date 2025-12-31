import { supabase } from "@/lib/supabase";
import { createBooking } from "./actions";
import { Tv, Wifi, Clock, Users, ArrowRight, Star } from "lucide-react";

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
  // 1. Traer todas las habitaciones
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
      </div>

      {/* --- NAVBAR --- */}
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
              <a href="#inicio" className="hover:text-[#700824] transition">
                Inicio
              </a>
              <a
                href="#habitaciones"
                className="hover:text-[#700824] transition"
              >
                Habitaciones
              </a>
              <a href="#servicios" className="hover:text-[#700824] transition">
                Servicios
              </a>
              <a href="#contacto" className="hover:text-[#700824] transition">
                Contacto
              </a>
            </div>
            <div className="hidden md:block">
              <a
                href="#habitaciones"
                className="bg-[#700824] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-rose-800 transition shadow-lg shadow-rose-900/20"
              >
                Reservar
              </a>
            </div>
            <label
              htmlFor="menu-toggle"
              className="md:hidden text-3xl text-[#700824] cursor-pointer p-2"
            >
              ☰
            </label>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        id="inicio"
        className="relative pt-40 pb-24 overflow-hidden z-10 px-4 text-center"
      >
        <span className="inline-block py-1.5 px-4 rounded-full bg-rose-50 border border-rose-100 text-[#700824] text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
          Ayacucho, Perú
        </span>
        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 text-rose-950 tracking-tight leading-tight">
          Descubre la magia <br /> de los Andes
        </h1>
        <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          Tu hogar lejos de casa en el corazón de Huamanga. Un refugio de
          confort colonial.
        </p>
      </section>

      {/* --- SECCIÓN HABITACIONES --- */}
      <section id="habitaciones" className="py-20 relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950">
              Nuestras Habitaciones
            </h2>
            <p className="text-stone-500 mt-2">
              Espacios diseñados para tu máximo descanso.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto">
            {groupedRooms.map((room: any) => (
              <div
                key={room.name}
                className="group bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/40 overflow-hidden border border-stone-100 flex flex-col hover:shadow-2xl transition-all duration-500"
              >
                {/* IMAGEN CON ETIQUETAS */}
                <div className="relative h-72 md:h-96 w-full overflow-hidden">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />

                  {/* Etiqueta de Precio Flotante */}
                  <div className="absolute top-6 left-6 bg-[#700824] text-white px-5 py-2 rounded-2xl shadow-xl z-20">
                    <p className="text-[10px] uppercase font-bold opacity-80 mb-0.5">
                      Desde
                    </p>
                    <p className="text-xl font-black">
                      S/ {room.price_per_night}
                    </p>
                  </div>

                  {/* Estado de Disponibilidad */}
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

                  {/* DESCRIPCIÓN */}
                  <div className="text-stone-500 text-sm mb-8 leading-relaxed font-light">
                    {room.name === "Individual Estándar" && (
                      <p>
                        Especialmente diseñada para el viajero que busca
                        eficiencia sin sacrificar confort. Disfrute de una
                        amplia cama de 2 plazas en un entorno privado y
                        silencioso.
                      </p>
                    )}
                    {room.name === "Matrimonial Estándar" && (
                      <p>
                        Un santuario de calidez para parejas. Espacio
                        elegantemente decorado con cama de 2 plazas, iluminación
                        cálida y todas las facilidades necesarias.
                      </p>
                    )}
                    {room.name === "Doble Estándar" && (
                      <p>
                        La opción perfecta para viajes compartidos o de
                        negocios. Dos amplias camas independientes y mobiliario
                        funcional que garantiza el espacio de cada huésped.
                      </p>
                    )}
                    {room.name === "Triple Estándar" && (
                      <p>
                        Amplitud total para familias o grupos. Tres camas
                        distribuidas en un ambiente ventilado y espacioso,
                        asegurando que todos disfruten de su propio espacio.
                      </p>
                    )}
                    {room.name === "Ejecutiva" && (
                      <p>
                        Nuestra máxima expresión de exclusividad. Cama Queen
                        Size, acabados de primera y un escritorio ergonómico
                        pensado para quienes buscan un espacio premium.
                      </p>
                    )}
                  </div>

                  {/* SERVICIOS MODERNOS */}
                  <div className="grid grid-cols-2 gap-4 mb-10 pt-8 border-t border-stone-100">
                    <ServiceItem
                      icon={<Tv size={18} />}
                      label="Smart TV Cable"
                    />
                    <ServiceItem
                      icon={<Wifi size={18} />}
                      label="WiFi Fibra 5G"
                    />
                    <ServiceItem
                      icon={<Clock size={18} />}
                      label="Agua Caliente"
                    />
                    <ServiceItem
                      icon={<Users size={18} />}
                      label="Baño Privado"
                    />
                  </div>

                  {/* FORMULARIO */}
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
                            className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
                          />
                          <input
                            type="date"
                            name="checkOut"
                            required
                            className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
                          />
                        </div>
                        <input
                          type="text"
                          name="name"
                          placeholder="Nombre completo"
                          required
                          className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
                        />
                        <input
                          type="email"
                          name="email"
                          placeholder="Correo electrónico"
                          required
                          className="w-full p-4 border border-stone-200 rounded-2xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#700824]/20 outline-none transition-all"
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

      {/* --- SECCIÓN CONTACTO --- */}
      <section
        id="contacto"
        className="py-24 bg-[#700824]/90 relative overflow-hidden z-10 px-4"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-4 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase mb-6">
            Atención 24/7
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-12 text-white">
            ¿Deseas atención directa?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <ContactCard
              href="https://wa.me/51966556622"
              icon="💬"
              title="WhatsApp"
              value="966 556 622"
              sub="Click para chatear"
            />
            <ContactCard
              href="tel:+51920042099"
              icon="📞"
              title="Llamar ahora"
              value="920 042 099"
              sub="Atención inmediata"
            />
            <ContactCard
              href="mailto:reservas@hotelkametza.com"
              icon="✉️"
              title="Correo"
              value="reservas@hotelkametza.com"
              sub="Envíanos un mensaje"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-10 border-t border-white/20">
            <SocialBtn
              href="https://facebook.com"
              icon="https://cdn-icons-png.flaticon.com/512/124/124010.png"
              label="Facebook"
              hover="hover:bg-[#1877F2]"
            />
            <SocialBtn
              href="https://instagram.com"
              icon="https://cdn-icons-png.flaticon.com/512/174/174855.png"
              label="Instagram"
              hover="hover:bg-[#E4405F]"
            />
            <SocialBtn
              href="https://tiktok.com"
              icon="https://cdn-icons-png.flaticon.com/512/3046/3046121.png"
              label="TikTok"
              hover="hover:bg-black"
            />
          </div>
        </div>
      </section>

      <footer className="bg-stone-900 text-stone-500 py-12 text-center text-xs">
        <p>© 2025 Hotel Kametza. Ayacucho, Perú.</p>
        <Link
          href="/admin"
          className="mt-4 inline-block hover:text-white transition"
        >
          Admin Access
        </Link>
      </footer>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
function ServiceItem({ icon, label }: any) {
  return (
    <div className="flex items-center gap-3 group/item">
      <div className="p-2.5 bg-rose-50 rounded-xl group-hover/item:bg-rose-100 transition-colors text-[#700824]">
        {icon}
      </div>
      <span className="text-[11px] font-black text-stone-600 uppercase tracking-tighter">
        {label}
      </span>
    </div>
  );
}

function ContactCard({ href, icon, title, value, sub }: any) {
  return (
    <a
      href={href}
      target="_blank"
      className="p-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/20 transition group shadow-2xl"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="font-black text-xl mb-1 text-white uppercase text-[10px] tracking-[0.2em]">
        {title}
      </h3>
      <p className="text-rose-200 font-black text-xl">{value}</p>
      <span className="text-[10px] text-white/40 mt-3 block font-bold uppercase tracking-widest">
        {sub}
      </span>
    </a>
  );
}

function SocialBtn({ href, icon, label, hover }: any) {
  return (
    <a
      href={href}
      target="_blank"
      className={`flex items-center gap-3 bg-white/10 px-8 py-4 rounded-2xl border border-white/10 transition font-black text-white text-[10px] tracking-widest uppercase ${hover}`}
    >
      <img
        src={icon}
        className="w-5 h-5 brightness-0 invert group-hover:invert-0 transition"
        alt={label}
      />
      {label}
    </a>
  );
}
