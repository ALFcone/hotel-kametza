"use server";
/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/actions.ts
 * PROPÓSITO: Contiene todas las funciones del servidor (Server Actions).
 *            Sirve para conectar la web con la base de datos Supabase
 *            (Crear reservas, registrar pagos, editar fechas, etc.)
 * ---------------------------------------------------------------------
 */

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { leerXmlComprobante } from "@/lib/cpe-xml";
import { HOTEL_RUC } from "@/lib/site";
import { HORA_CHECK_IN } from "@/lib/fecha-peru";
import { codigoReserva } from "@/lib/reserva";

const ROOM_IMAGES_BUCKET = "rooms";
// Debe coincidir con el tope de la política bookings_insert_huesped (supabase/reservas_pendientes.sql)
const MAX_RESERVAS_PENDIENTES = 3;

async function uploadRoomImage(supabaseServer: any, file: File): Promise<{ url?: string; error?: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, '_')}`;

  const { error: uploadError } = await supabaseServer.storage
    .from(ROOM_IMAGES_BUCKET)
    .upload(filename, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error subiendo imagen a Supabase Storage:", uploadError.message);
    return { error: "No se pudo subir la imagen." };
  }

  const { data: publicUrlData } = supabaseServer.storage
    .from(ROOM_IMAGES_BUCKET)
    .getPublicUrl(filename);

  return { url: publicUrlData.publicUrl };
}

// ==============================================================================
// 1. HELPER: GET USER ROLE
// ==============================================================================
export async function getUserRole() {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();
  
  if (!user) return { user: null, role: null };
  
  const { data } = await supabaseServer
    .from("hotel_staff")
    .select("role")
    .eq("email", user.email)
    .single();

  return { 
    user, 
    role: data?.role || null
  };
}

// El personal de limpieza solo cambia el estado de las habitaciones; el resto del panel es de recepción.
// Se excluye "limpieza" en lugar de listar los roles de recepción porque en la base hay filas
// escritas como "receptionist" y "recepcionista".
function canOperate(role: string | null | undefined) {
  return !!role && role !== "limpieza";
}

// ==============================================================================
// 2. FUNCIÓN: BUSCAR HUÉSPED FRECUENTE POR DNI + API RENIEC
// ==============================================================================
export async function searchGuestByDocument(documentNumber: string) {
  // Sin esta comprobación cualquiera podía consultar nombres por DNI y gastar la cuota de la API
  const { role } = await getUserRole();
  if (!canOperate(role)) return null;

  const supabaseServer = await getSupabaseServer();

  const { data, error } = await supabaseServer
    .from("clients")
    .select("id, name, email, country, phone, document_type, document_number")
    .eq("document_number", documentNumber)
    .maybeSingle();

  // Si lo encontró en la base de datos local, lo devolvemos
  if (!error && data) {
    return data;
  }

  // Si no se encontró localmente y parece un DNI válido (8 dígitos numéricos)
  if (documentNumber.length === 8 && /^\d+$/.test(documentNumber)) {
    try {
      // Usar API pública gratuita de Perú
      const res = await fetch(`https://api.apis.net.pe/v1/dni?numero=${documentNumber}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${process.env.DNI_API_TOKEN}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        // Evitar caché persistente agresivo si hay error, pero guardarlo si funciona
        cache: "no-store" 
      });

      if (res.ok) {
        const apiData = await res.json();
        if (apiData && apiData.nombre) {
          // Capitalizar nombres (ej: JUAN PEREZ -> Juan Perez)
          const formatName = (str: string) =>
            str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

          return {
            name: formatName(apiData.nombre),
            country: "Perú",
            document_type: "DNI",
            email: "",
            phone: ""
          };
        }
      } else if (res.status === 429) {
        // Límite de consultas de la API alcanzado: no es que el DNI no exista
        console.error("API DNI: límite de consultas alcanzado (429)");
        return { rateLimited: true as const };
      } else {
        console.error("API Error Status:", res.status, res.statusText);
        const text = await res.text();
        console.error("API Error Text:", text);
      }
    } catch (err) {
      console.error("Error consultando API externa de RENIEC:", err);
    }
  }

  return null;
}

async function upsertClient(formData: FormData, supabaseServer: any) {
  const docNum = formData.get("documentNumber") as string;
  if (!docNum) return null;

  const { data: clientData, error } = await supabaseServer.from("clients").upsert({
    document_number: docNum,
    document_type: formData.get("documentType"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country") || "Perú",
  }, { onConflict: "document_number" }).select("id").single();
  
  if (error) {
    console.error("Error upserting client:", error.message);
    return null;
  }
  return clientData ? clientData.id : null;
}

// ==============================================================================
// 2. FUNCIÓN: CREAR RESERVA (Directa a tabla 'reserva')
// ==============================================================================
export async function createBooking(formData: FormData) {
  const supabaseServer = await getSupabaseServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para reservar." };

  const idHabitacion = Number(formData.get("roomId"));
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  // El precio se calcula aquí: nunca se confía en el monto que envía el navegador
  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
  if (!checkIn || !checkOut || !Number.isFinite(nights) || nights < 1) {
    return { error: "La fecha de salida debe ser posterior a la de entrada." };
  }

  const { data: room } = await supabaseServer
    .from("rooms")
    .select("price_per_night")
    .eq("id", idHabitacion)
    .maybeSingle();
  if (!room) return { error: "Habitación no encontrada." };

  const total = nights * Number(room.price_per_night);

  // Tope de reservas sin pagar por huésped: evita bloquear habitaciones sin intención de pagar.
  // La función cuenta las pendientes vigentes (una reserva con Yape sin constancia vence a las 24 h).
  const { data: pendientes } = await supabaseServer.rpc("reservas_pendientes");
  if (Number(pendientes ?? 0) >= MAX_RESERVAS_PENDIENTES) {
    return {
      error: `Ya tienes ${MAX_RESERVAS_PENDIENTES} reservas pendientes de pago. Cancela alguna o escríbenos por WhatsApp al 966 556 622.`,
    };
  }

  // Verificación de disponibilidad
  const { data: isAvailable } = await supabaseServer.rpc("check_availability", {
    room_id_input: idHabitacion,
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  if (!isAvailable) return { error: "Habitación no disponible en esas fechas." };

  // Manejo del cliente
  const clientId = await upsertClient(formData, supabaseServer);

  // Inserción en Base de Datos - ESQUEMA REAL
  const { data: booking, error } = await supabaseServer
    .from("bookings")
    .insert({
      user_id: user.id,
      room_id: idHabitacion,
      check_in: checkIn,
      check_out: checkOut,
      total_price: total,
      payment_method: paymentMethod, 
      status: "pendiente",
      client_id: clientId,
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

  // El personal puede anular cualquier reserva; el huésped solo las suyas y con 24 h de anticipación
  const { role } = await getUserRole();
  const isStaff = canOperate(role);

  let lookup = supabaseServer.from("bookings").select("check_in").eq("id", bookingId);
  if (!isStaff) lookup = lookup.eq("user_id", user.id);
  const { data: existing } = await lookup.maybeSingle();
  if (!existing) return { error: "Reserva no encontrada." };

  if (!isStaff) {
    const hoursToCheckIn = (new Date(`${existing.check_in}T${HORA_CHECK_IN}`).getTime() - Date.now()) / 3600000;
    if (hoursToCheckIn < 24) {
      return { error: "Solo se puede cancelar con 24 horas de anticipación. Contacta a recepción." };
    }
  }

  let update = supabaseServer
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (!isStaff) update = update.eq("user_id", user.id);
  const { error } = await update;

  if (error) return { error: "No se pudo cancelar." };

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateRoom(formData: FormData) {
  const { role } = await getUserRole();

  if (role !== "admin" && role !== "dueño") {
    console.error("No autorizado: Solo admin o dueño puede actualizar habitaciones");
    return;
  }
  const supabaseServer = await getSupabaseServer();

  const idHabitacion = Number(formData.get("roomId"));
  const price = Number(formData.get("price"));
  const description = formData.get("description") as string;
  const imageFile = formData.get("image") as File;
  const oldImage = formData.get("oldImage") as string;

  let imageUrl = oldImage;

  const isUpload = imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile && (imageFile as any).size > 0;

  if (isUpload) {
    const result = await uploadRoomImage(supabaseServer, imageFile);
    if (result.error) return { error: result.error };
    imageUrl = result.url!;
  }

  const { error } = await supabaseServer.from("rooms").update({
    price_per_night: price,
    description: description,
    image_url: imageUrl,
  }).eq("id", idHabitacion).select();

  if (error) {
    console.error("No se pudo actualizar la habitación:", error.message);
    return { error: "No se pudo actualizar la habitación." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

// ==============================================================================
// GALERÍA DE FOTOS POR HABITACIÓN (varias imágenes además de la portada)
// ==============================================================================
export async function addRoomGalleryImages(formData: FormData) {
  const { role } = await getUserRole();
  if (role !== "admin" && role !== "dueño") {
    return { error: "No autorizado." };
  }
  const supabaseServer = await getSupabaseServer();

  const roomId = Number(formData.get("roomId"));
  const files = formData.getAll("images") as File[];
  const validFiles = files.filter((f) => f && typeof f === "object" && "arrayBuffer" in f && f.size > 0);

  if (validFiles.length === 0) {
    return { error: "Selecciona al menos una imagen." };
  }

  const { data: room, error: fetchError } = await supabaseServer
    .from("rooms")
    .select("gallery_urls")
    .eq("id", roomId)
    .single();

  if (fetchError || !room) {
    return { error: "Habitación no encontrada." };
  }

  const uploadedUrls: string[] = [];
  for (const file of validFiles) {
    const result = await uploadRoomImage(supabaseServer, file);
    if (result.error) return { error: result.error };
    uploadedUrls.push(result.url!);
  }

  const newGallery = [...(room.gallery_urls || []), ...uploadedUrls];

  const { error: updateError } = await supabaseServer
    .from("rooms")
    .update({ gallery_urls: newGallery })
    .eq("id", roomId);

  if (updateError) {
    console.error("Error al guardar la galería:", updateError.message);
    return { error: "No se pudo guardar la galería." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function removeRoomGalleryImage(roomId: number, imageUrl: string) {
  const { role } = await getUserRole();
  if (role !== "admin" && role !== "dueño") {
    return { error: "No autorizado." };
  }
  const supabaseServer = await getSupabaseServer();

  const { data: room, error: fetchError } = await supabaseServer
    .from("rooms")
    .select("gallery_urls")
    .eq("id", roomId)
    .single();

  if (fetchError || !room) {
    return { error: "Habitación no encontrada." };
  }

  const newGallery = (room.gallery_urls || []).filter((url: string) => url !== imageUrl);

  const { error: updateError } = await supabaseServer
    .from("rooms")
    .update({ gallery_urls: newGallery })
    .eq("id", roomId);

  if (updateError) {
    console.error("Error al quitar la imagen de la galería:", updateError.message);
    return { error: "No se pudo quitar la imagen." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function checkRoomAvailability(roomId: number, checkIn: string, checkOut: string) {
  const { role } = await getUserRole();
  if (!canOperate(role)) return { available: false };

  const supabaseServer = await getSupabaseServer();
  const { data: isAvailable } = await supabaseServer.rpc("check_availability", {
    room_id_input: roomId,
    check_in_input: checkIn,
    check_out_input: checkOut,
  });

  return { available: !!isAvailable };
}

export async function adminCreateBooking(formData: FormData) {
  const { user, role } = await getUserRole();

  if (!user || !canOperate(role)) {
    return { error: "No autorizado." };
  }
  const supabaseServer = await getSupabaseServer();

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

  const clientId = await upsertClient(formData, supabaseServer);

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
      client_id: clientId,
      special_requests: formData.get("notes"),
    });

  if (error) {
    console.error("Error al registrar reserva por admin:", error.message);
    return { error: `Error en base de datos: ${error.message}` };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function adminRegisterPayment(bookingId: number, amount: number) {
  const { role } = await getUserRole();

  if (!canOperate(role)) {
    return { error: "No autorizado." };
  }
  const supabaseServer = await getSupabaseServer();

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
  const { role } = await getUserRole();

  if (!role) {
    return;
  }
  const supabaseServer = await getSupabaseServer();

  const roomId = Number(formData.get("roomId"));
  const isCleanStr = formData.get("isClean") as string;
  const isClean = isCleanStr === "true";

  const { error } = await supabaseServer
    .from("rooms")
    .update({ is_clean: isClean })
    .eq("id", roomId);

  if (error) {
    console.error("Error toggling room cleanliness:", error?.message || "No rows updated. (Check RLS policies)");
    return;
  }

  revalidatePath("/admin");
}

export async function adminUpdateBookingDates(bookingId: number, newCheckOut: string, newTotal: number) {
  const { role } = await getUserRole();

  if (!canOperate(role)) {
    return { error: "No autorizado." };
  }
  const supabaseServer = await getSupabaseServer();

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
  const { role } = await getUserRole();

  if (!canOperate(role)) {
    return { error: "No autorizado." };
  }
  const supabaseServer = await getSupabaseServer();

  const bookingId = Number(formData.get("bookingId"));
  const itemName = formData.get("itemName") as string;
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity")) || 1;
  const productId = formData.get("productId") ? Number(formData.get("productId")) : null;

  if (!itemName || price < 0 || quantity <= 0) {
    return { error: "Datos inválidos para el consumo." };
  }

  // 1. Descontar stock si es un producto real
  if (productId) {
    // Obtener el stock actual
    const { data: product, error: fetchErr } = await supabaseServer
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      return { error: "Producto no encontrado." };
    }

    if (product.stock < quantity) {
      return { error: "Stock insuficiente." };
    }

    // Actualizar stock
    const { error: updateErr } = await supabaseServer
      .from("products")
      .update({ stock: product.stock - quantity })
      .eq("id", productId);
      
    if (updateErr) {
      return { error: "Error al actualizar stock del producto." };
    }
  }

  // 2. Insertar el consumo en la reserva
  const { error } = await supabaseServer
    .from("booking_extras")
    .insert({
      booking_id: bookingId,
      item_name: itemName,
      price,
      quantity,
      product_id: productId
    });

  if (error) {
    console.error("Error al añadir consumo extra:", error.message);
    // Nota: en un sistema robusto habría que revertir el stock aquí si falla.
    return { error: "No se pudo guardar el consumo." };
  }

  // 3. Si la reserva estaba pagada, cambiarla a parcial porque ahora debe consumos
  const { data: bookingData } = await supabaseServer
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  if (bookingData && (bookingData.status === "pagado" || bookingData.status === "approved")) {
    await supabaseServer
      .from("bookings")
      .update({ status: "parcial" })
      .eq("id", bookingId);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteBookingExtra(formData: FormData) {
  const { role } = await getUserRole();

  if (!canOperate(role)) {
    return { error: "No autorizado." };
  }
  const supabaseServer = await getSupabaseServer();

  const extraId = Number(formData.get("extraId"));

  // Obtener la información del extra antes de borrarlo
  const { data: extra } = await supabaseServer
    .from("booking_extras")
    .select("product_id, quantity")
    .eq("id", extraId)
    .single();

  const { error } = await supabaseServer
    .from("booking_extras")
    .delete()
    .eq("id", extraId);

  if (error) {
    console.error("Error al borrar consumo extra:", error.message);
    return { error: "No se pudo eliminar el consumo." };
  }

  // Devolver el stock si estaba enlazado a un producto
  if (extra && extra.product_id) {
    const { data: product } = await supabaseServer
      .from("products")
      .select("stock")
      .eq("id", extra.product_id)
      .single();
      
    if (product) {
      await supabaseServer
        .from("products")
        .update({ stock: product.stock + extra.quantity })
        .eq("id", extra.product_id);
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

// ==============================================================================
// 9. FUNCIÓN: FETCH RUC DATA SERVER-SIDE
// ==============================================================================
async function fetchPeruDocument(kind: "ruc" | "dni", numero: string, digits: number) {
  const { role } = await getUserRole();
  if (!canOperate(role)) return { error: "No autorizado." };
  if (!new RegExp(`^\\d{${digits}}$`).test(numero)) return { error: "Número de documento inválido." };

  try {
    const res = await fetch(`https://api.apis.net.pe/v1/${kind}?numero=${numero}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.DNI_API_TOKEN}`,
      },
      cache: "no-store",
    });
    if (res.status === 429) return { error: "Muchas consultas seguidas. Espera unos segundos e intenta de nuevo." };
    if (!res.ok) return { error: "No se encontró el documento." };
    return { data: await res.json() };
  } catch {
    return { error: "No se pudo conectar con el servicio de consulta." };
  }
}

export async function fetchRucData(ruc: string) {
  return fetchPeruDocument("ruc", ruc, 11);
}

// ==============================================================================
// 10. FUNCIÓN: FETCH DNI DATA SERVER-SIDE
// ==============================================================================
export async function fetchDniData(dni: string) {
  return fetchPeruDocument("dni", dni, 8);
}

// ==============================================================================
// 11. FUNCIONES DE PRODUCTOS E INVENTARIO
// ==============================================================================
export async function createProduct(formData: FormData) {
  const { role } = await getUserRole();
  if (role !== "admin" && role !== "dueño") return { error: "No autorizado" };
  const supabaseServer = await getSupabaseServer();

  const name = formData.get("name") as string;
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));

  if (!name || isNaN(price) || isNaN(stock)) return { error: "Datos inválidos" };

  const { error } = await supabaseServer.from("products").insert({ name, price, stock });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const { role } = await getUserRole();
  if (role !== "admin" && role !== "dueño") return { error: "No autorizado" };
  const supabaseServer = await getSupabaseServer();

  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));

  if (!id || !name || isNaN(price) || isNaN(stock)) return { error: "Datos inválidos" };

  const { error } = await supabaseServer.from("products").update({ name, price, stock }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const { role } = await getUserRole();
  if (role !== "admin" && role !== "dueño") return { error: "No autorizado" };
  const supabaseServer = await getSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) return { error: "ID inválido" };

  const { error } = await supabaseServer.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

// ==============================================================================
// 12. FUNCIONES DE GESTIÓN DE PERSONAL Y ROLES (MÓDULO DUEÑO)
// ==============================================================================
export async function getStaffList() {
  const { user, role } = await getUserRole();
  if (!user || (role !== "admin" && role !== "dueño")) {
    return { error: "No autorizado", data: [] };
  }

  const supabaseServer = await getSupabaseServer();
  const { data, error } = await supabaseServer
    .from("hotel_staff")
    .select("*");

  if (error) {
    console.error("Error fetching staff:", error.message);
    return { error: error.message, data: [] };
  }

  return { data: data || [] };
}

export async function addOrUpdateStaff(formData: FormData) {
  const { user, role } = await getUserRole();
  if (!user || (role !== "admin" && role !== "dueño")) {
    return { error: "No autorizado" };
  }

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const name = (formData.get("name") as string)?.trim() || null;
  const newRole = (formData.get("role") as string)?.toLowerCase().trim() || "recepcionista";

  if (!email || !email.includes("@")) {
    return { error: "Correo electrónico no válido." };
  }

  const validRoles = ["dueño", "admin", "recepcionista", "limpieza"];
  if (!validRoles.includes(newRole)) {
    return { error: "Rol no válido." };
  }

  const supabaseServer = await getSupabaseServer();

  const payload: any = { email, role: newRole };
  if (name) payload.name = name;

  let { error } = await supabaseServer
    .from("hotel_staff")
    .upsert(payload, { onConflict: "email" });

  // Si da error porque la columna 'name' no ha sido creada aún en Supabase, reintentar solo con email y role
  if (error && (error.message.includes("name") || error.code === "42703")) {
    const fallback = await supabaseServer
      .from("hotel_staff")
      .upsert({ email, role: newRole }, { onConflict: "email" });
    error = fallback.error;
  }

  if (error) {
    console.error("Error upserting staff member:", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateStaffRole(targetEmail: string, newRole: string) {
  const { user, role } = await getUserRole();
  if (!user || (role !== "admin" && role !== "dueño")) {
    return { error: "No autorizado" };
  }

  const validRoles = ["dueño", "admin", "recepcionista", "limpieza"];
  if (!validRoles.includes(newRole)) {
    return { error: "Rol no válido." };
  }

  const supabaseServer = await getSupabaseServer();
  const { error } = await supabaseServer
    .from("hotel_staff")
    .update({ role: newRole })
    .eq("email", targetEmail.toLowerCase().trim());

  if (error) {
    console.error("Error updating staff role:", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteStaffMember(targetEmail: string) {
  const { user, role } = await getUserRole();
  if (!user || (role !== "admin" && role !== "dueño")) {
    return { error: "No autorizado" };
  }

  const cleanEmail = targetEmail.toLowerCase().trim();

  // Protección contra auto-bloqueo
  if (user.email?.toLowerCase().trim() === cleanEmail) {
    return { error: "No puedes eliminarte a ti mismo del panel de administración." };
  }

  const supabaseServer = await getSupabaseServer();
  const { error } = await supabaseServer
    .from("hotel_staff")
    .delete()
    .eq("email", cleanEmail);

  if (error) {
    console.error("Error deleting staff member:", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
// ==============================================================================
// 13. COMPROBANTES SUNAT (XML descargado del portal SEE-SOL)
// ==============================================================================
// La boleta o factura se emite en SUNAT; aquí solo se registra su XML para imprimir
// el ticket con la serie, el número y el QR oficiales, y para enlazarla con la reserva.

const ERROR_TABLA_COMPROBANTES = "Falta crear la tabla de comprobantes en Supabase (supabase/comprobantes.sql).";
const ERROR_TABLA_ENLACES = "Falta crear la tabla de enlaces en Supabase (supabase/comprobante_reservas.sql).";

// 42P01/PGRST205: la tabla no existe; PGRST200: no existe la relación comprobantes → comprobante_reservas
const faltaTabla = (code?: string) => code === "42P01" || code === "PGRST205" || code === "PGRST200";

type SupabaseServer = Awaited<ReturnType<typeof getSupabaseServer>>;

// Reservas que se ofrecen para enlazar: las ya enlazadas, luego las que coinciden con el
// documento del cliente o con el total, y después las más recientes.
async function reservasParaEnlazar(
  supabaseServer: SupabaseServer,
  clienteNumDoc: string | null,
  total: number,
  enlazadas: number[] = [],
) {
  const columnas = "id, check_in, total_price, status, rooms(room_number), clients(name, document_number), booking_extras(price, quantity)";
  const [recientes, yaEnlazadas] = await Promise.all([
    supabaseServer.from("bookings").select(columnas).order("check_in", { ascending: false }).limit(60),
    enlazadas.length
      ? supabaseServer.from("bookings").select(columnas).in("id", enlazadas)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const unicas = new Map<number, any>();
  for (const b of [...(yaEnlazadas.data || []), ...(recientes.data || [])] as any[]) unicas.set(b.id, b);

  return [...unicas.values()]
    .map((b: any) => {
      const extras = (b.booking_extras || []).reduce((s: number, e: any) => s + Number(e.price) * Number(e.quantity), 0);
      const totalReserva = Number(b.total_price || 0) + extras;
      return {
        id: b.id as number,
        huesped: (b.clients?.name as string) || "Huésped",
        habitacion: b.rooms?.room_number ? String(b.rooms.room_number) : "",
        checkIn: b.check_in as string,
        total: totalReserva,
        cancelada: b.status === "cancelled" || b.status === "cancelada",
        enlazada: enlazadas.includes(b.id),
        coincide:
          (!!clienteNumDoc && b.clients?.document_number === clienteNumDoc) ||
          Math.abs(totalReserva - total) < 0.01,
      };
    })
    .sort((x, y) => Number(y.enlazada) - Number(x.enlazada) || Number(y.coincide) - Number(x.coincide));
}

// Quita repetidos y comprueba que todas las reservas existan.
async function validarReservas(supabaseServer: SupabaseServer, bookingIds: number[]) {
  const ids = [...new Set((bookingIds || []).filter((id) => Number.isInteger(id) && id > 0))];
  if (ids.length === 0) return { ids };
  const { data } = await supabaseServer.from("bookings").select("id").in("id", ids);
  if ((data || []).length !== ids.length) return { ids, error: "Alguna de las reservas elegidas no existe." };
  return { ids };
}

export async function leerComprobanteXml(xml: string) {
  const { role } = await getUserRole();
  if (!canOperate(role)) return { error: "No autorizado." };

  const leido = leerXmlComprobante(xml);
  if ("error" in leido) return { error: leido.error };
  const datos = leido.data;

  if (datos.emisorRuc !== HOTEL_RUC) {
    return { error: `Este comprobante lo emitió el RUC ${datos.emisorRuc}, no el del hotel (${HOTEL_RUC}).` };
  }

  const avisos: string[] = [];
  if (datos.moneda !== "PEN") avisos.push(`El comprobante está en ${datos.moneda}, no en soles.`);
  if (!datos.hash) avisos.push("El XML no trae el código hash de la firma: el QR del ticket saldrá incompleto.");

  const supabaseServer = await getSupabaseServer();
  const { data: existente, error: errorTabla } = await supabaseServer
    .from("comprobantes")
    .select("id, comprobante_reservas(booking_id)")
    .eq("tipo", datos.tipo)
    .eq("serie", datos.serie)
    .eq("numero", datos.numero)
    .maybeSingle();
  if (faltaTabla(errorTabla?.code)) {
    return { error: errorTabla?.code === "PGRST200" ? ERROR_TABLA_ENLACES : ERROR_TABLA_COMPROBANTES };
  }
  if (existente) {
    const codigos = ((existente as any).comprobante_reservas || []).map((r: any) => codigoReserva(r.booking_id));
    avisos.push(
      `Este comprobante ya está registrado${codigos.length ? ` en ${codigos.join(", ")}` : ""}. ` +
        "Para cambiar sus reservas usa «Reservas» en la lista de comprobantes registrados.",
    );
  }

  const candidatas = await reservasParaEnlazar(supabaseServer, datos.clienteNumDoc, datos.total);
  return { data: datos, avisos, candidatas };
}

export async function guardarComprobante(xml: string, bookingIds: number[]) {
  const { user, role } = await getUserRole();
  if (!user || !canOperate(role)) return { error: "No autorizado." };

  // Se vuelve a leer en el servidor: no se confía en lo que mostró el navegador.
  const leido = leerXmlComprobante(xml);
  if ("error" in leido) return { error: leido.error };
  const d = leido.data;
  if (d.emisorRuc !== HOTEL_RUC) return { error: "El comprobante no es del RUC del hotel." };

  const supabaseServer = await getSupabaseServer();
  const reservas = await validarReservas(supabaseServer, bookingIds);
  if (reservas.error) return { error: reservas.error };

  const { data: creado, error } = await supabaseServer
    .from("comprobantes")
    .insert({
      tipo: d.tipo,
      serie: d.serie,
      numero: d.numero,
      fecha_emision: d.fechaEmision,
      emisor_ruc: d.emisorRuc,
      cliente_tipo_doc: d.clienteTipoDoc,
      cliente_num_doc: d.clienteNumDoc,
      cliente_nombre: d.clienteNombre,
      moneda: d.moneda,
      total_gravado: d.totalGravado,
      igv: d.igv,
      total: d.total,
      hash: d.hash,
      items: d.items,
      xml,
    })
    .select("id")
    .single();

  if (error || !creado) {
    if (error?.code === "23505") return { error: "Este comprobante ya está registrado." };
    if (faltaTabla(error?.code)) return { error: ERROR_TABLA_COMPROBANTES };
    console.error("Error guardando comprobante:", error?.message);
    return { error: "No se pudo guardar el comprobante." };
  }

  if (reservas.ids.length) {
    const { error: errorEnlace } = await supabaseServer
      .from("comprobante_reservas")
      .insert(reservas.ids.map((booking_id) => ({ comprobante_id: creado.id, booking_id })));
    if (errorEnlace) {
      console.error("Error enlazando comprobante:", errorEnlace.message);
      revalidatePath("/admin");
      return {
        error: faltaTabla(errorEnlace.code)
          ? `El comprobante se guardó sin reservas. ${ERROR_TABLA_ENLACES}`
          : "El comprobante se guardó, pero no se pudo enlazar con las reservas. Enlázalo con «Reservas» en la lista.",
      };
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

// Reservas que se pueden enlazar a un comprobante ya registrado (marcadas las que ya tiene).
export async function reservasDeComprobante(id: number) {
  const { role } = await getUserRole();
  if (!canOperate(role)) return { error: "No autorizado." };

  const supabaseServer = await getSupabaseServer();
  const { data: c, error } = await supabaseServer
    .from("comprobantes")
    .select("cliente_num_doc, total, comprobante_reservas(booking_id)")
    .eq("id", id)
    .maybeSingle();
  if (faltaTabla(error?.code)) return { error: ERROR_TABLA_ENLACES };
  if (!c) return { error: "El comprobante no existe." };

  const enlazadas = ((c as any).comprobante_reservas || []).map((r: any) => r.booking_id as number);
  const candidatas = await reservasParaEnlazar(supabaseServer, c.cliente_num_doc, Number(c.total), enlazadas);
  return { candidatas };
}

// Reemplaza las reservas enlazadas a un comprobante.
export async function enlazarComprobante(id: number, bookingIds: number[]) {
  const { role } = await getUserRole();
  if (!canOperate(role)) return { error: "No autorizado." };

  const supabaseServer = await getSupabaseServer();
  const reservas = await validarReservas(supabaseServer, bookingIds);
  if (reservas.error) return { error: reservas.error };

  const { data: c } = await supabaseServer.from("comprobantes").select("id").eq("id", id).maybeSingle();
  if (!c) return { error: "El comprobante no existe." };

  const { error: errorBorrar } = await supabaseServer.from("comprobante_reservas").delete().eq("comprobante_id", id);
  if (errorBorrar) {
    return { error: faltaTabla(errorBorrar.code) ? ERROR_TABLA_ENLACES : "No se pudieron cambiar las reservas." };
  }

  if (reservas.ids.length) {
    const { error } = await supabaseServer
      .from("comprobante_reservas")
      .insert(reservas.ids.map((booking_id) => ({ comprobante_id: id, booking_id })));
    if (error) {
      console.error("Error enlazando comprobante:", error.message);
      revalidatePath("/admin");
      return { error: "No se pudieron guardar las reservas; el comprobante quedó sin enlazar." };
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function eliminarComprobante(id: number) {
  const { role } = await getUserRole();
  if (role !== "admin" && role !== "dueño") return { error: "Solo el dueño o un administrador puede quitar un comprobante." };

  const supabaseServer = await getSupabaseServer();
  const { error } = await supabaseServer.from("comprobantes").delete().eq("id", id);
  if (error) return { error: "No se pudo quitar el comprobante." };

  revalidatePath("/admin");
  return { success: true };
}

// ==============================================================================
// 14. LIBRO DE RECLAMACIONES VIRTUAL
// ==============================================================================
// El público registra su hoja mediante la función registrar_reclamacion() de Supabase
// (supabase/reclamaciones.sql); el personal la ve y anota la respuesta en el panel.

const ERROR_TABLA_RECLAMACIONES = "Falta crear el Libro de Reclamaciones en Supabase (supabase/reclamaciones.sql).";

export interface DatosReclamacion {
  tipo: string;
  consumidor_nombre: string;
  consumidor_tipo_doc: string;
  consumidor_num_doc: string;
  consumidor_domicilio: string;
  consumidor_telefono: string;
  consumidor_email: string;
  menor_de_edad: boolean;
  apoderado_nombre: string;
  bien_tipo: string;
  bien_descripcion: string;
  monto: string;
  codigo_reserva: string;
  detalle: string;
  pedido: string;
  sitio_web?: string; // campo trampa: lo llenan los robots, no las personas
}

const FORMATO_DOCUMENTO: Record<string, RegExp> = {
  DNI: /^\d{8}$/,
  RUC: /^\d{11}$/,
  CE: /^[A-Z0-9]{6,12}$/,
  PASAPORTE: /^[A-Z0-9]{6,12}$/,
};

export async function registrarReclamacion(datos: DatosReclamacion) {
  // Un robot llenó el campo oculto: se responde como si nada para no darle pistas
  if (datos.sitio_web) return { error: "No se pudo registrar la hoja. Inténtalo de nuevo." };

  const texto = (v: string | undefined) => (v || "").trim();
  const doc = texto(datos.consumidor_num_doc).toUpperCase();
  const email = texto(datos.consumidor_email).toLowerCase();
  const monto = texto(datos.monto);

  if (datos.tipo !== "reclamo" && datos.tipo !== "queja") return { error: "Elige si es un reclamo o una queja." };
  if (texto(datos.consumidor_nombre).length < 3) return { error: "Escribe tu nombre completo." };
  if (!FORMATO_DOCUMENTO[datos.consumidor_tipo_doc]?.test(doc)) return { error: "Revisa el número de documento." };
  if (texto(datos.consumidor_domicilio).length < 5) return { error: "Escribe tu domicilio." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Revisa el correo electrónico." };
  if (datos.menor_de_edad && texto(datos.apoderado_nombre).length < 3) {
    return { error: "Si eres menor de edad, escribe el nombre de tu padre o madre." };
  }
  if (datos.bien_tipo !== "producto" && datos.bien_tipo !== "servicio") return { error: "Elige producto o servicio." };
  if (texto(datos.bien_descripcion).length < 3) return { error: "Describe el producto o servicio contratado." };
  if (monto && !(Number(monto) >= 0)) return { error: "Revisa el monto reclamado." };
  if (texto(datos.detalle).length < 10) return { error: "Cuéntanos con más detalle qué pasó." };
  if (texto(datos.pedido).length < 3) return { error: "Escribe qué pides al hotel." };

  const supabaseServer = await getSupabaseServer();
  const { data, error } = await supabaseServer.rpc("registrar_reclamacion", {
    datos: {
      tipo: datos.tipo,
      consumidor_nombre: texto(datos.consumidor_nombre),
      consumidor_tipo_doc: datos.consumidor_tipo_doc,
      consumidor_num_doc: doc,
      consumidor_domicilio: texto(datos.consumidor_domicilio),
      consumidor_telefono: texto(datos.consumidor_telefono),
      consumidor_email: email,
      menor_de_edad: !!datos.menor_de_edad,
      apoderado_nombre: datos.menor_de_edad ? texto(datos.apoderado_nombre) : "",
      bien_tipo: datos.bien_tipo,
      bien_descripcion: texto(datos.bien_descripcion),
      monto: monto ? Number(monto).toFixed(2) : "",
      codigo_reserva: texto(datos.codigo_reserva),
      detalle: texto(datos.detalle),
      pedido: texto(datos.pedido),
    },
  });

  const fila = Array.isArray(data) ? data[0] : data;
  if (error || !fila) {
    if (error?.code === "PGRST202" || error?.code === "42883") return { error: ERROR_TABLA_RECLAMACIONES };
    if (error?.message?.includes("Demasiadas hojas")) return { error: error.message };
    console.error("Error registrando reclamación:", error?.message);
    return { error: "No se pudo registrar la hoja. Inténtalo de nuevo o escríbenos al correo del hotel." };
  }

  revalidatePath("/admin");
  return { id: fila.id as number, created_at: fila.created_at as string };
}

export async function responderReclamacion(id: number, respuesta: string, fecha: string) {
  const { user, role } = await getUserRole();
  if (!user || !canOperate(role)) return { error: "No autorizado." };

  const texto = respuesta.trim();
  if (texto.length < 5) return { error: "Escribe la respuesta que se dio al consumidor." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Elige la fecha en que se comunicó la respuesta." };

  const supabaseServer = await getSupabaseServer();
  const { data, error } = await supabaseServer
    .from("reclamaciones")
    .update({ respuesta: texto, fecha_respuesta: fecha, respondido_por: user.id })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    console.error("Error respondiendo reclamación:", error?.message);
    return { error: "No se pudo guardar la respuesta." };
  }

  revalidatePath("/admin");
  return { success: true };
}
