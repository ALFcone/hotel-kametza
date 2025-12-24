import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Tipos de datos para TypeScript
interface Booking {
  id: number;
  client_name: string;
  client_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  rooms: {
    name: string;
  };
}

// Forzamos que esta página nunca se guarde en caché (siempre datos frescos)
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // 1. Consultamos las reservas uniendo (join) con la tabla de habitaciones
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      rooms ( name )
    `
    )
    .order("created_at", { ascending: false }); // Las más nuevas primero

  if (error) console.error("Error fetching bookings:", error);

  const bookings = data as unknown as Booking[] | null;

  // Acción de Servidor para cancelar reserva (simple)
  async function cancelBooking(formData: FormData) {
    "use server";
    const id = formData.get("bookingId");
    await supabase
      .from("bookings")
      .update({ status: "cancelado" })
      .eq("id", id);
    revalidatePath("/admin"); // Refrescar la pantalla
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Panel Administrativo 🛡️
          </h1>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm text-slate-500">
            Hotel Kametza Manager
          </div>
        </div>

        {/* TARJETAS DE RESUMEN (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase">
              Reservas Totales
            </h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">
              {bookings?.length || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase">
              Ingresos Estimados
            </h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              S/{" "}
              {bookings?.reduce(
                (acc, curr) =>
                  curr.status !== "cancelado" ? acc + curr.total_price : acc,
                0
              )}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase">
              Pendientes de Pago
            </h3>
            <p className="text-3xl font-bold text-amber-500 mt-2">
              {bookings?.filter((b) => b.status === "pendiente").length || 0}
            </p>
          </div>
        </div>

        {/* TABLA DE RESERVAS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Huésped</th>
                  <th className="px-6 py-4">Habitación</th>
                  <th className="px-6 py-4">Fechas</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings?.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      #{booking.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {booking.client_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {booking.client_email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {booking.rooms?.name || "Habitación eliminada"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="text-emerald-600">
                          In: {booking.check_in}
                        </span>
                        <span className="text-rose-500">
                          Out: {booking.check_out}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      S/ {booking.total_price}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          booking.status === "pendiente"
                            ? "bg-amber-100 text-amber-800"
                            : ""
                        }
                        ${
                          booking.status === "pagado"
                            ? "bg-emerald-100 text-emerald-800"
                            : ""
                        }
                        ${
                          booking.status === "cancelado"
                            ? "bg-slate-100 text-slate-500 decoration-line-through"
                            : ""
                        }
                      `}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {booking.status !== "cancelado" && (
                        <form action={cancelBooking}>
                          <input
                            type="hidden"
                            name="bookingId"
                            value={booking.id}
                          />
                          <button className="text-rose-600 hover:text-rose-900 text-xs font-bold border border-rose-200 px-3 py-1 rounded hover:bg-rose-50 transition">
                            Cancelar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}

                {(!bookings || bookings.length === 0) && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No hay reservas todavía. ¡Ve al inicio y haz una prueba!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
