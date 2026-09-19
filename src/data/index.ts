import { createClient } from "@supabase/supabase-js";
import { MemoriaRepo } from "./memoriaRepo";
import type { Repositorio } from "./repositorio";
import { SupabaseRepo } from "./supabaseRepo";

/**
 * Selecciona el adaptador de datos según la configuración:
 * con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY → base de datos en la nube;
 * sin ellas (o con VITE_MODO_DEMO=1) → modo demostración local.
 */
export function crearRepositorio(): Repositorio {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (url && key && import.meta.env.VITE_MODO_DEMO !== "1") {
    return new SupabaseRepo(
      createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "campus-plus:auth" } })
    );
  }
  return new MemoriaRepo();
}

export type { Repositorio };
