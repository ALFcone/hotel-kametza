import { createClient } from "@supabase/supabase-js";

// El signo de exclamación (!) al final le dice a TypeScript:
// "Confía en mí, esta variable existe, ya la puse en .env.local"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
