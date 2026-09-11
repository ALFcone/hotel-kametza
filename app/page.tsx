import { getSupabaseServer } from "@/lib/supabase-server";
import HomeClient from "./HomeClient";

export default async function Home() {
  const supabaseServer = await getSupabaseServer();
  const { data: rooms } = await supabaseServer.from("rooms").select("*").order("id");

  return <HomeClient initialRooms={rooms || []} />;
}
