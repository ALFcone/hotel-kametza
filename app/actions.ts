"use server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function createBooking(formData: FormData) {
  // 1. Capturamos los datos del formulario
  const roomId = formData.get("roomId");
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const email = formData.get("email");
  const name = formData.get("name");
  const price = formData.get("price");

  // 2. Verificamos disponibilidad en la BD (usando la función que creamos en SQL)
  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: Number(roomId),
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  // Si devuelve false o null, detenemos todo
  if (!isAvailable) {
    // En un caso real, aquí devolveríamos un error al usuario.
    // Por ahora, lanzamos un error simple en consola server-side.
    console.error("Fechas ocupadas");
    return;
  }

  // 3. Si está libre, insertamos la reserva
  const { error } = await supabase.from("bookings").insert({
    room_id: Number(roomId),
    client_name: name,
    client_email: email,
    check_in: checkIn,
    check_out: checkOut,
    total_price: Number(price),
    status: "pendiente",
  });

  if (error) {
    console.error("Error al guardar:", error);
    return;
  }

  // 4. Redirigimos a la página de éxito
  redirect("/exito");
}
