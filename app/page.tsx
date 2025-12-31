import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Users, Wifi, Tv, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Traer habitaciones
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .order("price_per_night");

  // 2. Ver ocupación HOY
  const today = new Date().toISOString().split("T")[0];
  const { data: busyToday } = await supabase
    .from("bookings")
    .select("room_id")
    .lte("check_in", today)
    .gte("check_out", today);
  const busyIds = busyToday?.map((b: any) => b.room_id) || [];

  // 3. AGRUPAR POR TIPO (La magia para ocultar números)
  const roomTypes: any = {};
  rooms?.forEach((room) => {
    // Usamos el 'name' (ej: Matrimonial Estándar) como clave de grupo
    if (!roomTypes[room.name]) {
      roomTypes[room.name] = {
        ...room,
        count: 0,
        available: 0,
        firstAvailableId: null,
      };
    }
    roomTypes[room.name].count++;

    // Si la habitación específica (ej: 203) está libre, sumamos al grupo "Matrimonial"
    if (!busyIds.includes(room.id)) {
      roomTypes[room.name].available++;
      if (!roomTypes[room.name].firstAvailableId)
        roomTypes[room.name].firstAvailableId = room.id;
    }
  });

  const categories = Object.values(roomTypes);

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      {/* Hero */}
      <header className="h-[400px] flex items-center justify-center bg-stone-900 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb')] bg-cover bg-center opacity-40"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="text-6xl font-serif mb-2">Kametza</h1>
          <p className="text-lg tracking-widest uppercase">Ayacucho</p>
        </div>
      </header>

      {/* Lista de Categorías */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat: any) => (
            <div
              key={cat.name}
              className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden hover:-translate-y-1 transition"
            >
              <div className="h-56 overflow-hidden relative">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {cat.available > 0
                    ? `🟢 ${cat.available} Libres`
                    : "🔴 Agotado"}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{cat.name}</h3>
                  <div className="text-right">
                    <p className="text-xl font-bold text-rose-800">
                      S/ {cat.price_per_night}
                    </p>
                  </div>
                </div>
                <p className="text-stone-500 text-sm mb-4 h-10 overflow-hidden">
                  {cat.description}
                </p>
                <div className="flex gap-3 mb-6 text-stone-400">
                  <Wifi size={16} />
                  <Tv size={16} />
                  <Users size={16} />
                </div>

                {cat.available > 0 ? (
                  <Link
                    href={`/rooms/${cat.firstAvailableId}`}
                    className="block w-full bg-stone-900 text-white text-center py-3 rounded-xl font-bold hover:bg-rose-900 transition"
                  >
                    Reservar
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-stone-100 text-stone-400 py-3 rounded-xl font-bold cursor-not-allowed"
                  >
                    No Disponible
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
