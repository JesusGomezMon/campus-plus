/**
 * Carga usuarios y actividades de ejemplo en Supabase.
 * Uso:  npm run db:seed
 * Requiere en .env.local (NO se sube al repositorio):
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings → API → service_role)
 *   SEED_PASSWORD=...               (contraseña para las cuentas de prueba, mínimo 8 caracteres)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;

if (!url || !serviceKey || !password || password.length < 8) {
  console.error("Faltan VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o SEED_PASSWORD (≥ 8 caracteres) en .env.local");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const USUARIOS = [
  { email: "profesor@campusplus.test", nombre: "Mtro. Jorge Interián", rol: "profesor" },
  { email: "tutor@campusplus.test", nombre: "Mtra. Rocío Villanueva", rol: "tutor" },
  { email: "ana@campusplus.test", nombre: "Ana Sofía Canul", rol: "estudiante", matricula: "1901234", programa: "Ing. en Redes" },
  { email: "luis@campusplus.test", nombre: "Luis Pech Uc", rol: "estudiante", matricula: "1901288", programa: "Ing. en Redes" },
  { email: "marisol@campusplus.test", nombre: "Marisol Cruz Tun", rol: "estudiante", matricula: "1902017", programa: "Sistemas Comerciales" },
  { email: "diego@campusplus.test", nombre: "Diego Balam Kú", rol: "estudiante", matricula: "1902145", programa: "Sistemas Comerciales" }
];

async function obtenerOCrear(u) {
  const { data, error } = await sb.auth.admin.createUser({ email: u.email, password, email_confirm: true });
  if (!error) return data.user.id;
  if (!/already|registered|exists/i.test(error.message)) throw error;
  const lista = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (lista.error) throw lista.error;
  const existente = lista.data.users.find((x) => x.email === u.email);
  await sb.auth.admin.updateUserById(existente.id, { password });
  return existente.id;
}

const ids = {};
for (const u of USUARIOS) ids[u.email] = await obtenerOCrear(u);
const tutorId = ids["tutor@campusplus.test"];
const profId = ids["profesor@campusplus.test"];

const perfiles = USUARIOS.map((u) => ({
  id: ids[u.email],
  nombre: u.nombre,
  rol: u.rol,
  matricula: u.matricula ?? null,
  programa: u.programa ?? null,
  tutor_id: u.rol === "estudiante" ? tutorId : null
}));
// Primero los que no son estudiantes (el tutor debe existir antes de referenciarlo).
for (const grupo of [perfiles.filter((p) => p.rol !== "estudiante"), perfiles.filter((p) => p.rol === "estudiante")]) {
  const { error } = await sb.from("profiles").upsert(grupo);
  if (error) throw error;
}

// Reinicia las actividades de ejemplo del profesor demo.
await sb.from("actividades").delete().eq("profesor_id", profId);

const e = (email) => ids[email];
const ACTIVIDADES = [
  { titulo: "Ejercicio de Matemáticas", descripcion: "Resolver los problemas 1 al 20 del capítulo 4 y entregar el procedimiento.", materia: "Matemáticas", fecha: "2026-09-19", hora: "16:00", asignaciones: [[e("ana@campusplus.test"), "Pendiente"]] },
  { titulo: "Ejercicio de Programación", descripcion: "Implementar el ejercicio de listas enlazadas visto en clase y subir el repositorio.", materia: "Programación", fecha: "2026-09-21", hora: "17:00", asignaciones: [[e("ana@campusplus.test"), "En proceso"]] },
  { titulo: "Ejercicio de Física", descripcion: "Reporte de la práctica de caída libre con gráficas y conclusiones.", materia: "Física", fecha: "2026-09-21", hora: "18:00", asignaciones: [[e("ana@campusplus.test"), "Pendiente"]] },
  { titulo: "Cuestionario unidad 1", descripcion: "Resolver el cuestionario en la plataforma antes de la fecha límite.", materia: "Bases de datos", fecha: "2026-09-12", hora: "23:59", para_grupo: true, asignaciones: [[e("ana@campusplus.test"), "Terminada"], [e("luis@campusplus.test"), "Terminada"], [e("marisol@campusplus.test"), "En proceso"], [e("diego@campusplus.test"), "Pendiente"]] },
  { titulo: "Diagrama entidad-relación", descripcion: "Modelo del caso de estudio asignado, entregado en PDF.", materia: "Bases de datos", fecha: "2026-09-29", hora: "12:00", asignaciones: [[e("marisol@campusplus.test"), "En proceso"]] },
  { titulo: "Reporte de lectura", descripcion: "Síntesis del capítulo 4 con comentario personal.", materia: "Metodología", fecha: "2026-09-08", hora: "09:00", asignaciones: [[e("diego@campusplus.test"), "Terminada"]] }
];

for (const { asignaciones, ...a } of ACTIVIDADES) {
  const { data, error } = await sb.from("actividades").insert({ para_grupo: false, ...a, profesor_id: profId }).select("id").single();
  if (error) throw error;
  const { error: e2 } = await sb.from("asignaciones").insert(asignaciones.map(([estudiante_id, estado]) => ({ actividad_id: data.id, estudiante_id, estado })));
  if (e2) throw e2;
}

console.log("Listo. Cuentas creadas (misma contraseña SEED_PASSWORD):");
for (const u of USUARIOS) console.log(`  ${u.rol.padEnd(10)} ${u.email}`);
