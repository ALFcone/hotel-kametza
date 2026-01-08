"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
// 1. Importamos Mercado Pago
import { MercadoPagoConfig, Preference } from "mercadopago";

// 2. CONFIGURACIÓN DE PRUEBA
// Este es un Token de Prueba (Sandbox). No cobrará dinero real.
const client = new MercadoPagoConfig({
  accessToken: "TEST-7624126759796535-091615-58580041838647000213123-147823562",
});

// --- FUNCIÓN PARA CREAR RESERVA ---
export async function createBooking(formData: FormData) {
  const roomId = formData.get("roomId");
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const email = formData.get("email");
  const name = formData.get("name") as string;
  const price = formData.get("price");
  const paymentMethod = formData.get("paymentMethod") as string;

  // A. Verificar disponibilidad
  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: Number(roomId),
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) {
    console.error("Fechas ocupadas");
    return;
  }

  // B. Insertar reserva en la Base de Datos (Estado: pendiente)
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

  if (error) {
    console.error("Error al guardar:", error);
    return;
  }

  // C. LÓGICA DE MERCADO PAGO (Solo si elige pago online)
  if (paymentMethod === "online") {
    const preference = new Preference(client);

    try {
      // Creamos la preferencia de pago (El "Ticket" digital)
      const result = await preference.create({
        body: {
          items: [
            {
              id: roomId as string,
              title: `Reserva Hotel Kametza - Habitación`,
              quantity: 1,
              unit_price: Number(price),
              currency_id: "PEN", // Soles
            },
          ],
          payer: {
            email: email as string,
          },
          // A dónde vuelve el usuario después de pagar
          back_urls: {
            success: `https://hotel-kametza.vercel.app/exito?method=online&status=approved&amount=${price}&id=${booking.id}`,
            failure: `https://hotel-kametza.vercel.app/exito?method=online&status=failure&id=${booking.id}`,
            pending: `https://hotel-kametza.vercel.app/exito?method=online&status=pending&id=${booking.id}`,
          },
          auto_return: "approved",
          external_reference: booking.id.toString(),
        },
      });

      // Redirigir al cliente a la pasarela segura de Mercado Pago
      if (result.init_point) {
        redirect(result.init_point);
      }
    } catch (e) {
      console.error("Error creando preferencia MP:", e);
    }
  }

  // D. Si es otro método (Efectivo, Yape manual), flujo normal a WhatsApp
  redirect(`/exito?method=${paymentMethod}&amount=${price}&id=${booking.id}`);
}

// --- FUNCIÓN ADMIN (UPDATE ROOM) ---
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
    if (uploadError) throw new Error("Error upload");
    const { data: publicUrlData } = supabase.storage
      .from("room-images")
      .getPublicUrl(fileName);
    imageUrlToUpdate = publicUrlData.publicUrl;
  }

  const updateData: any = {
    price_per_night: Number(price),
    description: description,
  };
  if (imageUrlToUpdate) updateData.image_url = imageUrlToUpdate;

  await supabase.from("rooms").update(updateData).eq("id", roomId);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}
