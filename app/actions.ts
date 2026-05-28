"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";


// ==============================================================================
// 2. FUNCIÓN: CREAR RESERVA (Directa a tabla 'reserva')
// ==============================================================================
export async function createBooking(formData: FormData) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para reservar." };

  const idHabitacion = Number(formData.get("roomId"));
  const total = Number(formData.get("price"));
  const paymentMethod = formData.get("paymentMethod") as string;

  // Verificación de disponibilidad
  const { data: isAvailable } = await supabaseServer.rpc("check_availability", {
    room_id_input: idHabitacion,
    check_in_input: formData.get("checkIn") as string,
    check_out_input: formData.get("checkOut") as string,
  });

  if (!isAvailable) return { error: "Habitación no disponible en esas fechas." };

  // Inserción en Base de Datos - ESQUEMA REAL
  const { data: booking, error } = await supabaseServer
    .from("bookings") 
    .insert({
      user_id: user.id, 
      room_id: idHabitacion,
      check_in: formData.get("checkIn"),
      check_out: formData.get("checkOut"),
      total_price: total,
      payment_method: paymentMethod, 
      status: "pendiente",
      client_name: formData.get("name"),
      client_email: formData.get("email"),
      client_country: formData.get("country"),
      client_phone: formData.get("phone"),
      document_type: formData.get("documentType"),
      document_number: formData.get("documentNumber"),
    })
    .select()
    .single();

  if (error || !booking) return { error: "Error al registrar la reserva." };

  return { 
    success: true, 
    url: `/exito?method=${paymentMethod}&amount=${total}&id=${booking.id}`,
    bookingId: booking.id 
  };
}

// ==============================================================================
// 3. FUNCIÓN: CANCELAR RESERVA
// ==============================================================================
export async function cancelBooking(bookingId: number) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) return { error: "No autorizado." };

  const { error } = await supabaseServer
    .from("bookings") 
    .update({ 
      status: "cancelled", 
      cancelled_at: new Date().toISOString() 
    })
    .eq("id", bookingId)
    .eq("user_id", user.id); 

  if (error) return { error: "No se pudo cancelar." };

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateRoom(formData: FormData) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user || user.email !== "alfesco86@gmail.com") {
    console.error("No autorizado: Permisos insuficientes");
    return;
  }

  const idHabitacion = Number(formData.get("roomId"));
  
  const { error } = await supabaseServer.from("rooms").update({ 
    price_per_night: Number(formData.get("price")),
    description: formData.get("description"),
    image_url: formData.get("image"),
  }).eq("id", idHabitacion);

  if (error) {
    console.error("No se pudo actualizar la habitación:", error.message);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/");
}