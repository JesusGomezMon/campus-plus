/**
 * Base de datos PostgreSQL real (PGlite, en memoria) que imita el entorno de Supabase:
 * esquema `auth`, función `auth.uid()` y roles `anon` / `authenticated`.
 * Permite probar la migración, las restricciones y las políticas RLS sin servicios externos.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MIGRACION = readFileSync(fileURLToPath(new URL("../../supabase/migrations/0001_esquema.sql", import.meta.url)), "utf8");

const ENTORNO_SUPABASE = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text unique);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  -- Privilegios por omisión que Supabase concede en el esquema public
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`;

export const ID = {
  profesor: "00000000-0000-4000-8000-000000000001",
  profesor2: "00000000-0000-4000-8000-000000000002",
  tutor: "00000000-0000-4000-8000-000000000003",
  ana: "00000000-0000-4000-8000-000000000011",
  luis: "00000000-0000-4000-8000-000000000012",
  marisol: "00000000-0000-4000-8000-000000000013"
} as const;

export async function crearBase() {
  const db = new PGlite();
  await db.exec(ENTORNO_SUPABASE);
  await db.exec(MIGRACION);

  // Datos base (como administrador, sin RLS)
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ID.profesor}', 'profesor@campus.test'), ('${ID.profesor2}', 'profesor2@campus.test'),
      ('${ID.tutor}', 'tutor@campus.test'), ('${ID.ana}', 'ana@campus.test'),
      ('${ID.luis}', 'luis@campus.test'), ('${ID.marisol}', 'marisol@campus.test');
    insert into public.profiles (id, nombre, rol) values
      ('${ID.profesor}', 'Mtro. Jorge Interián', 'profesor'),
      ('${ID.profesor2}', 'Mtra. Laura Chan', 'profesor'),
      ('${ID.tutor}', 'Mtra. Rocío Villanueva', 'tutor');
    insert into public.profiles (id, nombre, rol, matricula, programa, tutor_id) values
      ('${ID.ana}', 'Ana Sofía Canul', 'estudiante', '1901234', 'Ing. en Redes', '${ID.tutor}'),
      ('${ID.luis}', 'Luis Pech Uc', 'estudiante', '1901288', 'Ing. en Redes', '${ID.tutor}'),
      ('${ID.marisol}', 'Marisol Cruz Tun', 'estudiante', '1902017', 'Sistemas Comerciales', null);
  `);

  /** Ejecuta `fn` como el usuario autenticado `uid` (o como anónimo si es null). */
  async function como<T>(uid: string | null, fn: () => Promise<T>): Promise<T> {
    await db.exec(uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`);
    try {
      return await fn();
    } finally {
      await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
    }
  }

  return { db, como };
}
