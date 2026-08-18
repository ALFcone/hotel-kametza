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
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

// ==============================================================================
// 2. FUNCIÓN: BUSCAR HUÉSPED FRECUENTE POR DNI + API RENIEC
// ==============================================================================
export async function searchGuestByDocument(documentNumber: string) {
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
  const total = Number(formData.get("price"));
  const paymentMethod = formData.get("paymentMethod") as string;

  // Verificación de disponibilidad
  const { data: isAvailable } = await supabaseServer.rpc("check_availability", {
    room_id_input: idHabitacion,
    check_in_input: formData.get("checkIn") as string,
    check_out_input: formData.get("checkOut") as string,
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
      check_in: formData.get("checkIn"),
      check_out: formData.get("checkOut"),
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
  const { role } = await getUserRole();

  if (role !== "admin") {
    console.error("No autorizado: Solo admin puede actualizar habitaciones");
    return;
  }
  const supabaseServer = await getSupabaseServer();

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
  const { user, role } = await getUserRole();

  if (!user || !role) {
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

  if (!role) {
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

  if (!role) {
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

  if (!role) {
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

  if (!role) {
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
export async function fetchRucData(ruc: string) {
  try {
    const res = await fetch(`https://api.apis.net.pe/v1/ruc?numero=${ruc}`);
    if (!res.ok) return { error: "Failed to fetch RUC" };
    const data = await res.json();
    return { data };
  } catch (error) {
    return { error: "Network error" };
  }
}

// ==============================================================================
// 10. FUNCIÓN: FETCH DNI DATA SERVER-SIDE
// ==============================================================================
export async function fetchDniData(dni: string) {
  try {
    const res = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`);
    if (!res.ok) return { error: "Failed to fetch DNI" };
    const data = await res.json();
    return { data };
  } catch (error) {
    return { error: "Network error" };
  }
}

// ==============================================================================
// 11. FUNCIONES DE PRODUCTOS E INVENTARIO
// ==============================================================================
export async function createProduct(formData: FormData) {
  const { role } = await getUserRole();
  if (role !== "admin") return { error: "No autorizado" };
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
  if (role !== "admin") return { error: "No autorizado" };
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
  if (role !== "admin") return { error: "No autorizado" };
  const supabaseServer = await getSupabaseServer();

  const id = Number(formData.get("id"));
  if (!id) return { error: "ID inválido" };

  const { error } = await supabaseServer.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}