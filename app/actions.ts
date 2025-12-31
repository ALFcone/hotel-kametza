"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- FUNCIÓN PARA CREAR RESERVA (CLIENTE) ---
export async function createBooking(formData: FormData) {
  const roomId = formData.get("roomId");
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const email = formData.get("email");
  const name = formData.get("name");
  const price = formData.get("price");

  // 1. Verificamos disponibilidad
  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: Number(roomId),
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) {
    console.error("Fechas ocupadas");
    return;
  }

  // 2. Insertamos la reserva
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

  redirect("/exito");
}

// --- FUNCIÓN PARA ACTUALIZAR HABITACIÓN (ADMIN) ---
export async function updateRoom(formData: FormData) {
  const roomId = formData.get("roomId");
  const price = formData.get("price");
  const description = formData.get("description");

  const { error } = await supabase
    .from("rooms")
    .update({
      price_per_night: Number(price),
      description: description,
    })
    .eq("id", roomId);

  if (error) {
    console.error("Error al actualizar la habitación:", error);
    throw new Error("No se pudo actualizar la habitación");
  }

  // Actualiza la información en ambas páginas al instante
  revalidatePath("/admin");
  revalidatePath("/");
}
