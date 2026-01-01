"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- FUNCIÓN PARA CREAR RESERVA (CLIENTE) - SIN CAMBIOS ---
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

  if (error) return;
  redirect("/exito");
}

// --- FUNCIÓN MEJORADA PARA ACTUALIZAR HABITACIÓN ---
export async function updateRoom(formData: FormData) {
  const roomId = formData.get("roomId");
  const price = formData.get("price");
  const description = formData.get("description");
  const imageFile = formData.get("image") as File;

  let imageUrlToUpdate = null;

  // 1. Verificar imagen
  if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
    // Usamos Date.now() para que el nombre sea siempre único y evitar caché
    const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, "-")}`;

    // Subimos con upsert y cacheControl
    const { error: uploadError } = await supabase.storage
      .from("room-images")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError);
      throw new Error("Error al subir imagen");
    }

    const { data: publicUrlData } = supabase.storage
      .from("room-images")
      .getPublicUrl(fileName);

    imageUrlToUpdate = publicUrlData.publicUrl;
  }

  // 2. Preparar datos
  const updateData: any = {
    price_per_night: Number(price),
    description: description,
  };

  if (imageUrlToUpdate) {
    updateData.image_url = imageUrlToUpdate;
  }

  // 3. Actualizar BD
  const { error } = await supabase
    .from("rooms")
    .update(updateData)
    .eq("id", roomId);

  if (error) {
    console.error("Error BD:", error);
    throw new Error("No se pudo actualizar");
  }

  // 4. Forzar revalidación de caché en todas las rutas posibles
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}
