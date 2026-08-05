/**
 * ---------------------------------------------------------------------
 * ARCHIVO: lib/supabase.ts
 * PROPÓSITO: Cliente de Base de Datos para el Navegador (Frontend).
 *            Se usa en componentes "use client" para leer datos
 *            directamente desde el navegador del usuario.
 * ---------------------------------------------------------------------
 */
import { createBrowserClient } from "@supabase/ssr";

// El signo de exclamación (!) al final le dice a TypeScript:
// "Confía en mí, esta variable existe, ya la puse en .env.local"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);



