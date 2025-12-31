"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- FUNCIÓN PARA CREAR RESERVA (CLIENTE) ---
// (Esta función no cambia, sigue igual)
export async function createBooking(formData: FormData) {
  const roomId = formData.get("roomId");
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const email = formData.get("email");
  const name = formData.get("name");
  const price = formData.get("price");

  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: Number(roomId),
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) {
    console.error("Fechas ocupadas");
    return;
  }

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

// --- NUEVA FUNCIÓN PARA ACTUALIZAR HABITACIÓN E IMAGEN (ADMIN) ---
export async function updateRoom(formData: FormData) {
  const roomId = formData.get("roomId");
  const price = formData.get("price");
  const description = formData.get("description");
  const imageFile = formData.get("image") as File; // Obtenemos el archivo

  let imageUrlToUpdate = null;

  // 1. Verificar si se subió una imagen nueva
  if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
    // Crear un nombre único para la imagen (usando la fecha actual)
    const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, "-")}`;

    // Subir al bucket "room-images"
    const { error: uploadError } = await supabase.storage
      .from("room-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError);
      throw new Error("Fallo al subir la imagen");
    }

    // Obtener la URL pública de la imagen subida
    const { data: publicUrlData } = supabase.storage
      .from("room-images")
      .getPublicUrl(fileName);

    imageUrlToUpdate = publicUrlData.publicUrl;
  }

  // 2. Preparar los datos para actualizar
  const updateData: any = {
    price_per_night: Number(price),
    description: description,
  };

  // Solo si hubo una imagen nueva, añadimos el campo image_url a la actualización
  if (imageUrlToUpdate) {
    updateData.image_url = imageUrlToUpdate;
  }

  // 3. Actualizar la base de datos
  const { error } = await supabase
    .from("rooms")
    .update(updateData)
    .eq("id", roomId);

  if (error) {
    console.error("Error al actualizar BD:", error);
    throw new Error("No se pudo actualizar la habitación");
  }

  // Refrescar las páginas
  revalidatePath("/admin");
  revalidatePath("/");
}
