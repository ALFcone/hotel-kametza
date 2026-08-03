import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Parameters<typeof cookieStore.set>[2]) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Se ignora si se llama desde Server Components
          }
        },
        remove(name: string, options: Parameters<typeof cookieStore.set>[2]) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Se ignora si se llama desde Server Components
          }
        },
      },
    }
  );
}
