import { supabase } from "@/lib/supabase";
import { createBooking } from "./actions";

// --- TIPOS DE DATOS ---
interface Room {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  image_url: string | null;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await supabase.from("rooms").select("*").order("id");
  const rooms = data as Room[] | null;

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-[#FDFBF7] selection:bg-rose-200 selection:text-rose-900">
      {/* FONDO DECORATIVO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slow"></div>
        <div className="absolute top-[40%] right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      {/* --- NAVBAR RESPONSIVO (CON MENÚ MÓVIL) --- */}
      <nav className="fixed top-0 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-stone-200/50 z-50 shadow-sm">
        {/* TRUCO: Checkbox invisible para controlar abrir/cerrar menú */}
        <input type="checkbox" id="menu-toggle" className="peer hidden" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* LOGO */}
            <div className="flex-shrink-0 flex items-center">
              <a href="#inicio" className="flex items-center gap-2">
                <img
                  src="/logo.jpg"
                  alt="Hotel Kametza"
                  className="h-14 w-auto object-contain mix-blend-multiply"
                />
              </a>
            </div>

            {/* MENÚ DE ESCRITORIO (Oculto en celular) */}
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

            {/* BOTÓN RESERVAR ESCRITORIO */}
            <div className="hidden md:block">
              <a
                href="#habitaciones"
                className="bg-rose-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-rose-800 transition shadow-lg shadow-rose-900/20"
              >
                Reservar
              </a>
            </div>

            {/* BOTÓN HAMBURGUESA (Solo visible en celular) */}
            <label
              htmlFor="menu-toggle"
              className="md:hidden text-3xl text-rose-900 cursor-pointer select-none p-2"
            >
              ☰
            </label>
          </div>
        </div>

        {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
        {/* Se muestra solo cuando el checkbox 'peer' está activado */}
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
          {/* Título adaptable al celular (text-5xl) */}
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
          {/* En celular será 1 columna, en PC serán 3 */}
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

      {/* --- SECCIÓN HABITACIONES --- */}
      <section id="habitaciones" className="py-20 relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-rose-950">
              Nuestras Habitaciones
            </h2>
            <p className="text-stone-500 mt-2">
              Espacios diseñados para tu descanso
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="group bg-white rounded-3xl shadow-xl shadow-stone-200/40 overflow-hidden border border-stone-100 flex flex-col"
              >
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                  {room.image_url ? (
                    <img
                      src={room.image_url}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-stone-100 text-stone-400">
                      Sin Imagen
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50 flex items-baseline gap-1">
                    <span className="text-rose-800 font-bold text-xl">
                      S/ {room.price_per_night}
                    </span>
                    <span className="text-stone-500 text-xs">/noche</span>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-serif font-bold text-rose-950 mb-3">
                    {room.name}
                  </h3>
                  <p className="text-stone-500 text-sm mb-8 leading-relaxed font-light">
                    {room.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-stone-100">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
                      Verificar Disponibilidad
                    </p>
                    <form
                      action={createBooking}
                      className="flex flex-col gap-4"
                    >
                      <input type="hidden" name="roomId" value={room.id} />
                      <input
                        type="hidden"
                        name="price"
                        value={room.price_per_night}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <label className="text-[10px] uppercase font-bold text-stone-400 absolute top-2 left-3">
                            Llegada
                          </label>
                          <input
                            type="date"
                            name="checkIn"
                            required
                            className="w-full pt-6 pb-2 px-3 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 outline-none"
                          />
                        </div>
                        <div className="relative">
                          <label className="text-[10px] uppercase font-bold text-stone-400 absolute top-2 left-3">
                            Salida
                          </label>
                          <input
                            type="date"
                            name="checkOut"
                            required
                            className="w-full pt-6 pb-2 px-3 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          name="name"
                          placeholder="Nombre completo"
                          required
                          className="w-full p-3 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-900/20 outline-none"
                        />
                        <input
                          type="email"
                          name="email"
                          placeholder="Correo electrónico"
                          required
                          className="w-full p-3 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-900/20 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-rose-900 text-white font-bold py-4 rounded-xl hover:bg-rose-800 transition shadow-lg mt-2"
                      >
                        Reservar Ahora
                      </button>
                    </form>
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
              {/* MAPA ACTUALIZADO A LAS AMÉRICAS 154 */}
              <iframe
                src="https://maps.google.com/maps?q=Jiron+Las+Americas+154,+Ayacucho&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Hotel Kametza"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN CONTACTO --- */}
      <section
        id="contacto"
        className="py-24 bg-rose-900 text-white relative overflow-hidden z-10 px-4"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-rose-800 border border-rose-700 text-rose-100 text-xs font-bold tracking-widest uppercase mb-6">
            Atención 24/7
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-white">
            ¿Listo para reservar?
          </h2>
          <p className="text-rose-100 mb-12 text-lg font-light max-w-2xl mx-auto">
            Escríbenos para coordinar tu llegada o resolver cualquier duda.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-8 border border-rose-800/50 bg-rose-800/20 backdrop-blur-sm rounded-3xl hover:bg-rose-800/40 transition">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="font-bold text-xl mb-2">Llámanos</h3>
              <p className="text-rose-200 font-medium">+51 966 000 000</p>
            </div>
            <div className="p-8 border border-rose-800/50 bg-rose-800/20 backdrop-blur-sm rounded-3xl hover:bg-rose-800/40 transition">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-bold text-xl mb-2">WhatsApp</h3>
              <p className="text-rose-200 font-medium">966 000 000</p>
            </div>
            <div className="p-8 border border-rose-800/50 bg-rose-800/20 backdrop-blur-sm rounded-3xl hover:bg-rose-800/40 transition">
              <div className="text-4xl mb-4">✉️</div>
              <h3 className="font-bold text-xl mb-2">Email</h3>
              <p className="text-rose-200 font-medium text-sm">
                reservas@hotelkametza.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-stone-900 text-stone-400 py-12 text-sm relative z-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <p>© 2025 Hotel Kametza. Ayacucho, Perú.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">
              Instagram
            </a>
            <a href="#" className="hover:text-white transition">
              Facebook
            </a>
            <a href="/admin" className="hover:text-white transition">
              Admin Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
