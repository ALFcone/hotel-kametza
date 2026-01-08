import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { updateRoom } from "../actions"; // Importamos la acción de actualizar cuarto
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  User,
  Home as HomeIcon,
  Search,
} from "lucide-react";

// --- ACCIÓN PARA MARCAR COMO PAGADO (Server Action) ---
async function markAsPaid(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");

  await supabase
    .from("bookings")
    .update({ status: "pagado" })
    .eq("id", bookingId);

  revalidatePath("/admin");
}

async function deleteBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId");

  await supabase.from("bookings").delete().eq("id", bookingId);

  revalidatePath("/admin");
}

export default async function AdminPage() {
  // 1. OBTENER HABITACIONES
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");

  // 2. OBTENER RESERVAS (Ordenadas por las más nuevas primero)
  // Hacemos un 'join' manual simple obteniendo todo
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  // Función auxiliar para buscar el nombre del cuarto
  const getRoomName = (id: number) =>
    rooms?.find((r) => r.id === id)?.name || "Habitación desconocida";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-rose-950 mb-8 flex items-center gap-3">
          <User className="bg-rose-900 text-white p-2 rounded-lg" size={48} />
          Panel de Administración
        </h1>

        {/* --- SECCIÓN 1: GESTIÓN DE RESERVAS (LO NUEVO) --- */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100 mb-12">
          <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
            <Calendar className="text-rose-600" /> Últimas Reservas
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                  <th className="p-4">Estado</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Habitación</th>
                  <th className="p-4">Fechas (In - Out)</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Método</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {bookings?.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-stone-50 hover:bg-stone-50 transition"
                  >
                    {/* ESTADO CON COLORES */}
                    <td className="p-4">
                      {booking.status === "pagado" ||
                      booking.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle size={12} /> PAGADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          <Clock size={12} /> PENDIENTE
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-stone-700">
                      {booking.client_name}
                      <div className="text-[10px] text-stone-400 font-normal">
                        {booking.client_email}
                      </div>
                    </td>

                    <td className="p-4 text-rose-900 font-medium">
                      {getRoomName(booking.room_id)}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold">📅 {booking.check_in}</span>
                        <span className="text-stone-400">
                          al {booking.check_out}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-black text-stone-700">
                      S/ {booking.total_price}
                    </td>

                    <td className="p-4 capitalize text-stone-500">
                      {booking.payment_method === "online"
                        ? "💳 Tarjeta/Web"
                        : booking.payment_method}
                    </td>

                    {/* BOTONES DE ACCIÓN */}
                    <td className="p-4 flex gap-2 justify-center">
                      {/* Botón para confirmar pago manualmente (si pagaron por Yape) */}
                      {booking.status !== "pagado" &&
                        booking.status !== "approved" && (
                          <form action={markAsPaid}>
                            <input
                              type="hidden"
                              name="bookingId"
                              value={booking.id}
                            />
                            <button
                              title="Marcar como Pagado"
                              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow-sm"
                            >
                              <DollarSign size={16} />
                            </button>
                          </form>
                        )}

                      {/* Botón Eliminar (Cuidado) */}
                      <form action={deleteBooking}>
                        <input
                          type="hidden"
                          name="bookingId"
                          value={booking.id}
                        />
                        <button
                          title="Eliminar Reserva"
                          className="p-2 bg-stone-200 text-stone-500 rounded-lg hover:bg-rose-500 hover:text-white transition shadow-sm"
                        >
                          <X size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}

                {(!bookings || bookings.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      No hay reservas registradas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- SECCIÓN 2: EDITAR HABITACIONES (YA EXISTÍA) --- */}
        <section>
          <h2 className="text-2xl font-bold text-stone-700 mb-6 flex items-center gap-2">
            <HomeIcon className="text-rose-600" /> Editar Habitaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="bg-white p-6 rounded-[2rem] shadow-lg border border-stone-100 flex flex-col gap-4"
              >
                <div className="relative h-40 rounded-xl overflow-hidden bg-stone-200">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                    ID: {room.id}
                  </div>
                </div>

                <h3 className="font-bold text-xl text-rose-900">{room.name}</h3>

                <form action={updateRoom} className="flex flex-col gap-3">
                  <input type="hidden" name="roomId" value={room.id} />

                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Precio (S/)
                    </label>
                    <input
                      name="price"
                      defaultValue={room.price_per_night}
                      type="number"
                      className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 font-bold text-stone-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={room.description}
                      rows={3}
                      className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-stone-400 ml-1">
                      Actualizar Foto
                    </label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                    />
                  </div>

                  <button className="bg-stone-900 text-white font-bold py-3 rounded-xl mt-2 hover:bg-rose-900 transition">
                    Guardar Cambios
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// Icono X pequeño para el botón eliminar
function X({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
