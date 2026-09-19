/**
 * Pruebas de aceptación contra la base de datos real en Supabase.
 * Inicia sesión con cada rol usando SOLO la llave pública (como la app) y verifica
 * que la RLS permita lo correcto y bloquee lo indebido.
 * Uso: npm run db:verificar   (requiere haber ejecutado npm run db:seed)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const password = process.env.SEED_PASSWORD;
if (!url || !key || !password) {
  console.error("Faltan VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o SEED_PASSWORD en .env.local");
  process.exit(1);
}

let fallas = 0;
const check = (nombre, ok, detalle = "") => {
  console.log(`${ok ? "  ✔" : "  ✘"} ${nombre}${detalle ? ` (${detalle})` : ""}`);
  if (!ok) fallas++;
};

async function sesion(email) {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`No se pudo iniciar sesión como ${email}: ${error.message}`);
  return { sb, uid: data.user.id };
}

// ---------- Anónimo ----------
console.log("Anónimo");
{
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await sb.from("actividades").select("id");
  check("no puede leer actividades", !!error);
  const r = await sb.auth.signInWithPassword({ email: "ana@campusplus.test", password: "incorrecta-123" });
  check("contraseña incorrecta es rechazada", !!r.error);
}

// ---------- Estudiante ----------
console.log("Estudiante (Ana)");
const ana = await sesion("ana@campusplus.test");
{
  const { data: perfil } = await ana.sb.from("profiles").select("rol").eq("id", ana.uid).single();
  check("su perfil tiene rol estudiante", perfil?.rol === "estudiante");
  const { data: asig } = await ana.sb.from("asignaciones").select("actividad_id, estudiante_id, estado");
  check("ve solo sus asignaciones", asig.length === 4 && asig.every((s) => s.estudiante_id === ana.uid), `${asig.length} filas`);
  const { data: acts } = await ana.sb.from("actividades").select("id, profesor:profiles!actividades_profesor_id_fkey(nombre)");
  check("ve 4 actividades con el nombre del profesor", acts.length === 4 && acts.every((a) => a.profesor?.nombre), `${acts.length}`);

  const id = asig[0].actividad_id;
  const up = await ana.sb.from("asignaciones").update({ estado: "En proceso" }).eq("actividad_id", id).eq("estudiante_id", ana.uid).select();
  check("puede cambiar el estado de su actividad", !up.error && up.data.length === 1);

  const ins = await ana.sb.from("actividades").insert({ titulo: "Hack", fecha: "2026-10-01", profesor_id: ana.uid });
  check("NO puede crear actividades", !!ins.error, ins.error?.code);
  const rpc = await ana.sb.rpc("guardar_actividad", { p_id: null, p_titulo: "Hack", p_descripcion: "", p_materia: "", p_fecha: "2026-10-01", p_hora: null, p_estudiante: null });
  check("NO puede usar guardar_actividad", !!rpc.error, rpc.error?.code);
  const del = await ana.sb.from("actividades").delete().eq("id", id).select();
  check("NO puede eliminar actividades", !del.error && del.data.length === 0);
  const rol = await ana.sb.from("profiles").update({ rol: "profesor" }).eq("id", ana.uid).select();
  check("NO puede cambiarse de rol", !!rol.error || rol.data.length === 0);
  const bit = await ana.sb.from("bitacora").select("id");
  check("NO puede leer la bitácora", !!bit.error || bit.data.length === 0);
  const otros = await ana.sb.from("profiles").select("id").eq("rol", "estudiante");
  check("NO ve los perfiles de otros estudiantes", otros.data.length === 1);
  // Deja el estado como estaba
  await ana.sb.from("asignaciones").update({ estado: asig[0].estado }).eq("actividad_id", id).eq("estudiante_id", ana.uid);
}

// ---------- Profesor ----------
console.log("Profesor");
const prof = await sesion("profesor@campusplus.test");
{
  const { data: ests } = await prof.sb.from("profiles").select("id").eq("rol", "estudiante");
  check("ve la lista de estudiantes", ests.length === 4);
  const { data: id, error } = await prof.sb.rpc("guardar_actividad", {
    p_id: null, p_titulo: "Prueba automática", p_descripcion: "Creada por verificar-supabase", p_materia: "QA",
    p_fecha: "2026-12-01", p_hora: "10:00", p_estudiante: null
  });
  check("crea una actividad para el grupo", !error && !!id, error?.message);
  const { data: asig } = await prof.sb.from("asignaciones").select("estudiante_id").eq("actividad_id", id);
  check("se asigna a los 4 estudiantes", asig?.length === 4);
  const invalida = await prof.sb.rpc("guardar_actividad", { p_id: null, p_titulo: "   ", p_descripcion: "", p_materia: "", p_fecha: "2026-12-01", p_hora: null, p_estudiante: null });
  check("la base rechaza un título vacío", !!invalida.error, invalida.error?.code);
  const autor = await prof.sb.from("actividades").update({ profesor_id: ana.uid }).eq("id", id);
  check("NO puede cambiar la autoría", !!autor.error, autor.error?.code);
  const estado = await prof.sb.from("asignaciones").update({ estado: "Terminada" }).eq("actividad_id", id).select();
  check("NO puede cambiar el estado de un estudiante", !!estado.error || estado.data.length === 0);
  const del = await prof.sb.from("actividades").delete().eq("id", id).select();
  check("elimina su actividad", !del.error && del.data.length === 1);
}

// ---------- Tutor ----------
console.log("Tutor");
const tutor = await sesion("tutor@campusplus.test");
{
  const { data: tut } = await tutor.sb.from("profiles").select("id").eq("tutor_id", tutor.uid);
  check("ve a sus 4 tutorados", tut.length === 4);
  const { data: asig } = await tutor.sb.from("asignaciones").select("estado").eq("estudiante_id", ana.uid);
  check("ve las actividades de un tutorado", asig.length === 4);
  const up = await tutor.sb.from("asignaciones").update({ estado: "Terminada" }).eq("estudiante_id", ana.uid).select();
  check("NO puede cambiar estados", !!up.error || up.data.length === 0);
  const ins = await tutor.sb.rpc("guardar_actividad", { p_id: null, p_titulo: "X", p_descripcion: "", p_materia: "", p_fecha: "2026-10-01", p_hora: null, p_estudiante: null });
  check("NO puede crear actividades", !!ins.error);
}

console.log(fallas ? `\n${fallas} verificación(es) fallaron` : "\nTodas las verificaciones pasaron");
process.exit(fallas ? 1 : 0);
