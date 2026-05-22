"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabase";

// ==============================================================================
// 1. HELPER: Obtener cliente con sesión
// ==============================================================================
async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );
}

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
  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: idHabitacion,
    check_in_input: formData.get("checkIn") as string,
    check_out_input: formData.get("checkOut") as string,
  });

  if (!isAvailable) return { error: "Habitación no disponible en esas fechas." };

  // Inserción en Base de Datos - ESQUEMA REAL
  const { data: booking, error } = await supabaseServer
    .from("reserva") 
    .insert({
      id_usuario: user.id, 
      id_habitacion: idHabitacion,
      fecha_ingreso: formData.get("checkIn"),
      fecha_salida: formData.get("checkOut"),
      total: total,
      metodo_pago: paymentMethod, 
      estado: "pendiente",
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
    .from("reserva") 
    .update({ 
      estado: "cancelled", 
      fecha_cancelacion: new Date().toISOString() 
    })
    .eq("id", bookingId)
    .eq("id_usuario", user.id); 

  if (error) return { error: "No se pudo cancelar." };

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}

// ==============================================================================
// 4. FUNCIÓN: ACTUALIZAR HABITACIÓN
// ==============================================================================
export async function updateRoom(formData: FormData) {
  const idHabitacion = formData.get("roomId");
  
  await supabase.from("habitaciones").update({ 
    precio: Number(formData.get("price")),
    descripcion: formData.get("description"),
  }).eq("id", idHabitacion);

  revalidatePath("/admin");
  revalidatePath("/");
}