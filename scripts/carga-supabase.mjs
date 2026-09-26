/**
 * Prueba de carga contra Supabase: repite la consulta más pesada de la app
 * (la pantalla "Mis actividades") con distintos números de usuarios al mismo
 * tiempo, para ver cómo se comporta cuando sube el volumen.
 *
 * Uso: npm run db:carga
 * Resultado: reportes/carga-supabase.json
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const password = process.env.SEED_PASSWORD;

/** Niveles de concurrencia que se prueban, y cuántas consultas hace cada usuario. */
const NIVELES = [1, 5, 10, 25];
const POR_USUARIO = 10;
const TOPE = 200; // el mismo límite que usa la aplicación

const COLS = "id, titulo, descripcion, materia, fecha, hora, para_grupo, profesor_id, profesor:profiles!actividades_profesor_id_fkey(nombre)";

async function sesion(email) {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { sb, uid: data.user.id };
}

/** La consulta real de la pantalla "Mis actividades": ordenada y recortada en el servidor. */
const consulta = ({ sb, uid }) =>
  sb
    .from("actividades")
    .select(`${COLS}, asignaciones!inner(estado, estudiante_id)`)
    .eq("asignaciones.estudiante_id", uid)
    .order("fecha")
    .order("hora", { nullsFirst: false })
    .order("id")
    .limit(TOPE + 1);

function percentil(ordenados, p) {
  if (!ordenados.length) return 0;
  const i = Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1);
  return +ordenados[i].toFixed(0);
}

async function nivel(ana, usuarios) {
  const tiempos = [];
  let errores = 0;

  const trabajador = async () => {
    for (let i = 0; i < POR_USUARIO; i++) {
      const t0 = performance.now();
      const { error } = await consulta(ana);
      tiempos.push(performance.now() - t0);
      if (error) errores += 1;
    }
  };

  const inicio = performance.now();
  await Promise.all(Array.from({ length: usuarios }, trabajador));
  const total = (performance.now() - inicio) / 1000;

  tiempos.sort((a, b) => a - b);
  const resultado = {
    usuariosSimultaneos: usuarios,
    consultas: tiempos.length,
    errores,
    mediana: percentil(tiempos, 50),
    p95: percentil(tiempos, 95),
    p99: percentil(tiempos, 99),
    consultasPorSegundo: +(tiempos.length / total).toFixed(1)
  };
  console.log(resultado);
  return resultado;
}

const ana = await sesion("ana@campusplus.test");
await consulta(ana); // calentamiento: la primera petición abre la conexión

const resultados = [];
for (const usuarios of NIVELES) resultados.push(await nivel(ana, usuarios));

mkdirSync("reportes", { recursive: true });
writeFileSync(
  "reportes/carga-supabase.json",
  JSON.stringify({ fecha: new Date().toISOString(), consultasPorUsuario: POR_USUARIO, resultados }, null, 2)
);
console.log("\nResultado en reportes/carga-supabase.json");
