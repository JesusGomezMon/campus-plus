/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** "1" fuerza el modo demostración aunque exista configuración de Supabase */
  readonly VITE_MODO_DEMO?: string;
}
