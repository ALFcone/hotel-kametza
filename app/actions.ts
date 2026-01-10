"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ------------------------------------------------------------------
// TU TOKEN
// ------------------------------------------------------------------
const client = new MercadoPagoConfig({
  accessToken:
    "TEST-7434598007363249-102513-e453188d9076f03407c57077a988d519-195979069",
});

// --- FUNCIÓN CORREGIDA PARA NEXT.JS 15 ---
async function getUser() {
  // AQUI ESTABA EL ERROR: En Next.js 15 cookies() lleva await
  const cookieStore = await cookies();

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  return user;
}

export async function createBooking(formData: FormData) {
  const roomId = formData.get("roomId");
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const email = formData.get("email");
  const name = formData.get("name") as string;
  const price = formData.get("price");
  const paymentMethod = formData.get("paymentMethod") as string;

  const documentType = formData.get("documentType") as string;
  const documentNumber = formData.get("documentNumber") as string;

  // 1. OBTENER USUARIO (Con la corrección)
  const user = await getUser();

  // 2. Verificar disponibilidad
  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: Number(roomId),
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) {
    return { error: "Fechas ocupadas. Por favor elige otras." };
  }

  // 3. Crear reserva
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
      document_type: documentType,
      document_number: documentNumber,
      user_id: user ? user.id : null,
    })
    .select()
    .single();

  if (error || !booking) {
    return { error: "Error interno al guardar la reserva." };
  }

  // 4. MERCADO PAGO
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
          payer: { email: email as string },
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
        return { error: "No se pudo generar el link de pago." };
      }
    } catch (e: any) {
      console.error("ERROR MERCADO PAGO:", e);
      return { error: `Error MP: ${e.message}` };
    }
  }

  // 5. MÉTODOS MANUALES
  return {
    success: true,
    url: `/exito?method=${paymentMethod}&amount=${price}&id=${booking.id}`,
    type: "manual",
  };
}

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
