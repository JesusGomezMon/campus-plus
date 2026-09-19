/** Mide la latencia de las consultas principales contra Supabase. Uso: npm run db:medir */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY, password = process.env.SEED_PASSWORD;
const N = 20;
async function sesion(email) {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { sb, uid: data.user.id };
}
async function medir(nombre, fn) {
  await fn(); // calentamiento
  const t = [];
  for (let i = 0; i < N; i++) { const a = performance.now(); const r = await fn(); if (r.error) throw r.error; t.push(performance.now() - a); }
  t.sort((x, y) => x - y);
  const res = { consulta: nombre, mediana: +t[Math.floor(N / 2)].toFixed(0), p95: +t[Math.floor(N * 0.95) - 1].toFixed(0), min: +t[0].toFixed(0) };
  console.log(res);
  return res;
}
const ana = await sesion("ana@campusplus.test");
const prof = await sesion("profesor@campusplus.test");
const tutor = await sesion("tutor@campusplus.test");
const COLS = "id, titulo, descripcion, materia, fecha, hora, para_grupo, profesor_id, profesor:profiles!actividades_profesor_id_fkey(nombre)";
const resultados = [
  await medir("Estudiante: mis actividades (asignaciones + actividad + profesor)", () => ana.sb.from("asignaciones").select(`estado, actividad:actividades(${COLS})`).eq("estudiante_id", ana.uid)),
  await medir("Profesor: actividades con avance por estudiante", () => prof.sb.from("actividades").select(`${COLS}, asignaciones(estudiante_id, estado, estudiante:profiles!asignaciones_estudiante_id_fkey(nombre))`).eq("profesor_id", prof.uid)),
  await medir("Tutor: lista de tutorados", () => tutor.sb.from("profiles").select("id, nombre, matricula, programa").eq("tutor_id", tutor.uid)),
  await medir("Estudiante: cambiar estado (UPDATE con RLS)", () => ana.sb.from("asignaciones").update({ estado: "Pendiente" }).eq("estudiante_id", ana.uid).eq("actividad_id", -1).select())
];
mkdirSync("reportes", { recursive: true });
writeFileSync("reportes/latencia-supabase.json", JSON.stringify({ fecha: new Date().toISOString(), repeticiones: N, resultados }, null, 2));
