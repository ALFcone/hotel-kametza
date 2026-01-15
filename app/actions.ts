"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ==============================================================================
// 1. CONFIGURACIÓN: Conexiones a servicios externos
// ==============================================================================
// Conecta con Mercado Pago para procesar cobros
const client = new MercadoPagoConfig({
  accessToken:
    "TEST-7434598007363249-102513-e453188d9076f03407c57077a988d519-195979069",
});

// Función auxiliar para leer la sesión del usuario (Usada al crear reserva)
async function getUser() {
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

// ==============================================================================
// 2. FUNCIÓN: CREAR RESERVA (createBooking)
// ==============================================================================
// Recibe el formulario, verifica disponibilidad y guarda en la base de datos.
export async function createBooking(formData: FormData) {
  // A. Extracción de datos del formulario HTML
  const roomId = formData.get("roomId");
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const email = formData.get("email");
  const name = formData.get("name") as string;
  const price = formData.get("price");
  const paymentMethod = formData.get("paymentMethod") as string;
  const documentType = formData.get("documentType") as string;
  const documentNumber = formData.get("documentNumber") as string;
  const phone = formData.get("phone") as string;
  const country = formData.get("country") as string;
  const userIdFromForm = formData.get("userId") as string; // <--- EL DATO CLAVE

  // B. Identificación del Usuario (Lógica blindada)
  // Intentamos obtenerlo por cookie, si falla, usamos el que viene oculto en el form
  const user = await getUser();
  const finalUserId = user
    ? user.id
    : userIdFromForm && userIdFromForm !== "undefined" && userIdFromForm !== ""
    ? userIdFromForm
    : null;

  // C. Verificación de Disponibilidad (Llama a la función SQL)
  const { data: isAvailable } = await supabase.rpc("check_availability", {
    room_id_input: Number(roomId),
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) {
    return { error: "Fechas ocupadas. Por favor elige otras." };
  }

  // D. Guardado en Base de Datos (INSERT)
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      room_id: Number(roomId),
      client_name: name,
      client_email: email,
      client_phone: phone,
      client_country: country,
      check_in: checkIn,
      check_out: checkOut,
      total_price: Number(price),
      payment_method: paymentMethod,
      status: "pendiente",
      document_type: documentType,
      document_number: documentNumber,
      user_id: finalUserId, // <--- Aquí guardamos el dueño
    })
    .select()
    .single();

  if (error || !booking) {
    console.error("Error creando reserva:", error);
    return { error: "Error interno al guardar la reserva." };
  }

  // E. Integración Mercado Pago (Solo si eligió pago online)
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
      }
    } catch (e: any) {
      return { error: `Error MP: ${e.message}` };
    }
  }

  // F. Retorno Exitoso (Pago Manual)
  return {
    success: true,
    url: `/exito?method=${paymentMethod}&amount=${price}&id=${booking.id}`,
    type: "manual",
  };
}

// ==============================================================================
// 3. FUNCIÓN: ACTUALIZAR HABITACIÓN (updateRoom)
// ==============================================================================
// Permite al administrador cambiar precios, fotos y descripciones.
export async function updateRoom(formData: FormData) {
  const roomId = formData.get("roomId");
  const price = formData.get("price");
  const description = formData.get("description");
  const imageFile = formData.get("image") as File;

  let imageUrlToUpdate = null;

  // A. Subida de imagen a Supabase Storage (si existe nueva imagen)
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

  // B. Actualización en Base de Datos (UPDATE)
  const updateData: any = {
    price_per_night: Number(price),
    description: description,
  };
  if (imageUrlToUpdate) updateData.image_url = imageUrlToUpdate;

  await supabase.from("rooms").update(updateData).eq("id", roomId);

  // C. Refrescar cachés para que los cambios se vean al instante
  revalidatePath("/admin");
  revalidatePath("/");
}

// ==============================================================================
// 4. FUNCIÓN: CANCELAR RESERVA (cancelBooking)
// ==============================================================================
// Cambia el estado a "cancelled".

export async function cancelBooking(bookingId: number, userId: string) {
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

  console.log(
    "--> Iniciando cancelación. Reserva:",
    bookingId,
    "Usuario:",
    userId
  );

  // A. Ejecución Directa (UPDATE)
  // Ahora guardamos TAMBIÉN la fecha actual en 'cancelled_at'
  const { error } = await supabaseServer
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(), // <--- ¡AQUÍ GUARDAMOS LA HORA EXACTA!
    })
    .eq("id", bookingId)
    .eq("user_id", userId);

  if (error) {
    console.error("❌ ERROR BD:", error.message);
    return { error: `No se pudo cancelar: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin"); // Actualizamos también el admin para que salga la fecha
  return { success: true };
}
