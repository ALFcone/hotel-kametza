"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { MercadoPagoConfig, Preference } from "mercadopago";

// 1. CONFIGURACIÓN DE MERCADO PAGO
// He colocado un Token de Prueba.
// Para ver el dinero en TU cuenta real, luego tendrás que poner el tuyo aquí.
const client = new MercadoPagoConfig({
  accessToken:
    "TEST-7434598007363249-102513-e453188d9076f03407c57077a988d519-195979069",
});

export async function createBooking(formData: FormData) {
  const roomId = formData.get("roomId");
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const email = formData.get("email");
  const name = formData.get("name") as string;
  const price = formData.get("price");
  const paymentMethod = formData.get("paymentMethod") as string;

  // 1. Verificar disponibilidad
  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: Number(roomId),
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) {
    return { error: "Esas fechas ya están ocupadas. Por favor elige otras." };
  }

  // 2. Crear reserva en Base de Datos (Estado: Pendiente)
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      room_id: Number(roomId),
      client_name: name,
      client_email: email,
      check_in: checkIn,
      check_out: checkOut,
      total_price: Number(price),
      payment_method: paymentMethod,
      status: "pendiente",
    })
    .select()
    .single();

  if (error || !booking) {
    console.error("Error Base de Datos:", error);
    return { error: "Error interno al guardar la reserva." };
  }

  // 3. MERCADO PAGO (Solo si eligió Pago Online)
  if (paymentMethod === "online") {
    try {
      const preference = new Preference(client);

      const result = await preference.create({
        body: {
          items: [
            {
              id: roomId as string,
              title: `Reserva Hotel Kametza - Habitación`,
              quantity: 1,
              unit_price: Number(price),
              currency_id: "PEN",
            },
          ],
          payer: {
            email: email as string,
          },
          back_urls: {
            success: `https://hotel-kametza.vercel.app/exito?method=online&status=approved&amount=${price}&id=${booking.id}`,
            failure: `https://hotel-kametza.vercel.app/exito?method=online&status=failure&id=${booking.id}`,
            pending: `https://hotel-kametza.vercel.app/exito?method=online&status=pending&id=${booking.id}`,
          },
          auto_return: "approved",
          external_reference: booking.id.toString(),
        },
      });

      if (result.init_point) {
        return {
          success: true,
          url: result.init_point,
          type: "online",
          bookingId: booking.id,
          price,
        };
      } else {
        return { error: "Mercado Pago no devolvió el link de pago." };
      }
    } catch (e: any) {
      console.error("ERROR MERCADO PAGO:", e);
      // Devolvemos el mensaje exacto del error para que sepas qué pasó
      return { error: `Error MP: ${e.message || "No se pudo conectar"}` };
    }
  }

  // 4. MÉTODOS MANUALES (Yape, BCP, etc)
  return {
    success: true,
    url: `/exito?method=${paymentMethod}&amount=${price}&id=${booking.id}`,
    type: "manual",
  };
}

// --- FUNCIÓN ADMIN (NO TOCAR) ---
export async function updateRoom(formData: FormData) {
  const roomId = formData.get("roomId");
  const price = formData.get("price");
  const description = formData.get("description");
  const imageFile = formData.get("image") as File;
  let imageUrlToUpdate = null;

  if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
    const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, "-")}`;
    const { error: uploadError } = await supabase.storage
      .from("room-images")
      .upload(fileName, imageFile, { cacheControl: "3600", upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage
        .from("room-images")
        .getPublicUrl(fileName);
      imageUrlToUpdate = data.publicUrl;
    }
  }
  const updateData: any = {
    price_per_night: Number(price),
    description: description,
  };
  if (imageUrlToUpdate) updateData.image_url = imageUrlToUpdate;
  await supabase.from("rooms").update(updateData).eq("id", roomId);
  revalidatePath("/admin");
  revalidatePath("/");
}
