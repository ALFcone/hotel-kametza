import { createClient } from "@supabase/supabase-js";
import HomeClient from "./HomeClient";

// La lista de habitaciones es igual para todos los visitantes, así que la página
// se sirve desde caché (CDN). Se regenera sola cada 5 min y al instante cuando el
// admin edita una habitación (revalidatePath("/") en app/actions.ts).
export const revalidate = 300;

export default async function Home() {
  // Cliente anónimo sin cookies: usar las cookies de sesión obligaría a generar
  // la página de nuevo en cada visita. El usuario logueado se resuelve en HomeClient.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: rooms } = await supabase.from("rooms").select("*").order("id");

  return <HomeClient initialRooms={rooms || []} />;
}
