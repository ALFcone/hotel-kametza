"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";


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
  const price = Number(formData.get("price"));
  const description = formData.get("description") as string;
  const imageFile = formData.get("image") as File;
  const oldImage = formData.get("oldImage") as string;

  let imageUrl = oldImage;

  console.log("DEBUG updateRoom:", {
    idHabitacion,
    price,
    description,
    imageFileType: typeof imageFile,
    imageFileExists: !!imageFile,
    imageFileName: imageFile ? (imageFile as any).name : null,
    imageFileSize: imageFile ? (imageFile as any).size : null,
    oldImage
  });

  const isUpload = imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile && (imageFile as any).size > 0;

  if (isUpload) {
    const arrayBuffer = await (imageFile as any).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `${Date.now()}-${(imageFile as any).name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), "public", "rooms");
    
    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      imageUrl = `/rooms/${filename}`;
      console.log("DEBUG: Imagen guardada exitosamente en:", imageUrl);
    } catch (err) {
      console.error("Error guardando imagen:", err);
    }
  } else {
    console.log("DEBUG: No se detectó un archivo File válido o el tamaño es 0.");
  }

  const { data: updateData, error } = await supabaseServer.from("rooms").update({ 
    price_per_night: price,
    description: description,
    image_url: imageUrl,
  }).eq("id", idHabitacion).select();

  console.log("DEBUG: Supabase update response:", { updateData, error });

  if (error) {
    console.error("No se pudo actualizar la habitación:", error.message);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function adminCreateBooking(formData: FormData) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user || user.email !== "alfesco86@gmail.com") {
    return { error: "No autorizado." };
  }

  const idHabitacion = Number(formData.get("roomId"));
  const price = Number(formData.get("price"));
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  // Verificación de disponibilidad
  const { data: isAvailable } = await supabaseServer.rpc("check_availability", {
    room_id_input: idHabitacion,
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) {
    return { error: "Habitación no disponible en esas fechas." };
  }

  const amountPaid = formData.get("amountPaid") ? Number(formData.get("amountPaid")) : price;
  const status = amountPaid >= price ? "pagado" : "parcial";

  const { error } = await supabaseServer
    .from("bookings")
    .insert({
      user_id: user.id,
      room_id: idHabitacion,
      check_in: checkIn,
      check_out: checkOut,
      total_price: price,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      status: status,
      client_name: formData.get("name"),
      client_email: formData.get("email") || null,
      client_country: formData.get("country") || "Perú",
      client_phone: formData.get("phone"),
      document_type: formData.get("documentType"),
      document_number: formData.get("documentNumber"),
    });

  if (error) {
    console.error("Error al registrar reserva por admin:", error.message);
    return { error: `Error en base de datos: ${error.message}` };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function adminRegisterPayment(bookingId: number, amount: number) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user || user.email !== "alfesco86@gmail.com") {
    return { error: "No autorizado." };
  }

  // Obtener la reserva actual
  const { data: booking, error: fetchError } = await supabaseServer
    .from("bookings")
    .select("total_price, amount_paid, status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Reserva no encontrada." };
  }

  const newAmountPaid = (Number(booking.amount_paid) || 0) + amount;
  const newStatus = newAmountPaid >= Number(booking.total_price) ? "pagado" : "parcial";

  const { error: updateError } = await supabaseServer
    .from("bookings")
    .update({ 
      amount_paid: newAmountPaid,
      status: newStatus 
    })
    .eq("id", bookingId);

  if (updateError) {
    return { error: "Error al actualizar el pago." };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleRoomCleanliness(formData: FormData) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user || user.email !== "alfesco86@gmail.com") {
    return;
  }

  const roomId = Number(formData.get("roomId"));
  const isCleanStr = formData.get("isClean") as string;
  const isClean = isCleanStr === "true";

  const { data, error } = await supabaseServer
    .from("rooms")
    .update({ is_clean: isClean })
    .eq("id", roomId)
    .select();

  if (error || !data || data.length === 0) {
    console.error("Error toggling room cleanliness:", error?.message || "No rows updated. (Check RLS policies)");
    return;
  }

  revalidatePath("/admin");
}

export async function adminUpdateBookingDates(bookingId: number, newCheckOut: string, newTotal: number) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user || user.email !== "alfesco86@gmail.com") {
    return { error: "No autorizado." };
  }

  const { data, error } = await supabaseServer
    .from("bookings")
    .update({ 
      check_out: newCheckOut,
      total_price: newTotal
    })
    .eq("id", bookingId)
    .select();

  if (error || !data || data.length === 0) {
    console.error("Error al actualizar la reserva:", error?.message);
    return { error: "No se pudo actualizar la reserva. Revisa si hay conflictos." };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addBookingExtra(formData: FormData) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user || user.email !== "alfesco86@gmail.com") {
    return { error: "No autorizado." };
  }

  const bookingId = Number(formData.get("bookingId"));
  const itemName = formData.get("itemName") as string;
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity")) || 1;

  if (!itemName || price <= 0 || quantity <= 0) {
    return { error: "Datos inválidos para el consumo." };
  }

  const { error } = await supabaseServer
    .from("booking_extras")
    .insert({
      booking_id: bookingId,
      item_name: itemName,
      price,
      quantity
    });

  if (error) {
    console.error("Error al añadir consumo extra:", error.message);
    return { error: "No se pudo guardar el consumo." };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteBookingExtra(formData: FormData) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user || user.email !== "alfesco86@gmail.com") {
    return { error: "No autorizado." };
  }

  const extraId = Number(formData.get("extraId"));

  const { error } = await supabaseServer
    .from("booking_extras")
    .delete()
    .eq("id", extraId);

  if (error) {
    console.error("Error al borrar consumo extra:", error.message);
    return { error: "No se pudo eliminar el consumo." };
  }

  revalidatePath("/admin");
  return { success: true };
}