import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { exigir, normalizarActividad, validarActividad } from "../domain/reglas";
import type { Actividad, ActividadAlumno, ActividadInput, ActividadProfesor, Estado, Estudiante, Rol, Usuario } from "../domain/tipos";
import { ErrorDominio } from "../domain/tipos";
import type { Repositorio } from "./repositorio";

/** Columnas que se leen de una actividad (incluye el nombre del profesor). */
const COLS_ACTIVIDAD = "id, titulo, descripcion, materia, fecha, hora, para_grupo, profesor_id, profesor:profiles!actividades_profesor_id_fkey(nombre)";

interface FilaActividad {
  id: number;
  titulo: string;
  descripcion: string;
  materia: string;
  fecha: string;
  hora: string | null;
  para_grupo: boolean;
  profesor_id: string;
  profesor: { nombre: string } | null;
}

interface FilaPerfil {
  id: string;
  nombre: string;
  rol: Rol;
  matricula: string | null;
  programa: string | null;
}

function aActividad(f: FilaActividad): Actividad {
  return {
    id: f.id,
    titulo: f.titulo,
    descripcion: f.descripcion,
    materia: f.materia,
    fecha: f.fecha,
    hora: f.hora ? f.hora.slice(0, 5) : "",
    paraGrupo: f.para_grupo,
    profesorId: f.profesor_id,
    profesorNombre: f.profesor?.nombre ?? "—"
  };
}

function aEstudiante(f: FilaPerfil): Estudiante {
  return { id: f.id, nombre: f.nombre, rol: "estudiante", matricula: f.matricula ?? "", programa: f.programa ?? "" };
}

/** Traduce errores de PostgREST/PostgreSQL a mensajes comprensibles para el usuario. */
export function traducirError(e: PostgrestError | Error | null): ErrorDominio {
  if (!e) return new ErrorDominio("Error desconocido.");
  const codigo = "code" in e ? e.code : "";
  if (codigo === "42501" || codigo === "PGRST301") return new ErrorDominio("No tienes permiso para realizar esta acción.", "permiso");
  if (codigo === "P0002" || codigo === "PGRST116") return new ErrorDominio("El registro no existe o fue eliminado.", "no-encontrado");
  if (codigo === "23514" || codigo === "22023" || codigo === "22007" || codigo === "22008") return new ErrorDominio("Los datos no son válidos.", "validacion");
  if (/fetch|network|Failed to fetch/i.test(e.message)) return new ErrorDominio("Sin conexión con el servidor. Revisa tu internet.", "red");
  return new ErrorDominio("Ocurrió un error al comunicarse con el servidor.", "red");
}

function ok<T>(r: { data: T | null; error: PostgrestError | null }): T {
  if (r.error) throw traducirError(r.error);
  return r.data as T;
}

/** Adaptador de producción: PostgreSQL en Supabase. La autorización real la aplica RLS. */
export class SupabaseRepo implements Repositorio {
  readonly modo = "supabase" as const;

  constructor(private readonly sb: SupabaseClient) {}

  private async perfil(id: string): Promise<Usuario> {
    const f = ok(await this.sb.from("profiles").select("id, nombre, rol").eq("id", id).single<FilaPerfil>());
    return { id: f.id, nombre: f.nombre, rol: f.rol };
  }

  // ---------- Sesión ----------
  async sesionActual(): Promise<Usuario | null> {
    const { data } = await this.sb.auth.getSession();
    if (!data.session) return null;
    try {
      return await this.perfil(data.session.user.id);
    } catch {
      return null;
    }
  }

  async iniciarSesion(c: { email: string; password: string } | { rol: Rol }): Promise<Usuario> {
    if ("rol" in c) throw new ErrorDominio("Inicia sesión con tu correo y contraseña.", "sesion");
    const { data, error } = await this.sb.auth.signInWithPassword({ email: c.email.trim(), password: c.password });
    if (error || !data.user) {
      if (error && /fetch|network/i.test(error.message)) throw new ErrorDominio("Sin conexión con el servidor.", "red");
      throw new ErrorDominio("Correo o contraseña incorrectos.", "sesion");
    }
    try {
      return await this.perfil(data.user.id);
    } catch {
      await this.sb.auth.signOut();
      throw new ErrorDominio("Tu cuenta no tiene un perfil asignado. Contacta al administrador.", "sesion");
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.sb.auth.signOut();
  }

  // ---------- Estudiante / tutor ----------
  private async actividadesDe(estudianteId: string): Promise<ActividadAlumno[]> {
    const filas = ok(
      await this.sb
        .from("asignaciones")
        .select(`estado, actividad:actividades(${COLS_ACTIVIDAD})`)
        .eq("estudiante_id", estudianteId)
        .returns<{ estado: Estado; actividad: FilaActividad | null }[]>()
    );
    return filas.flatMap((f) => (f.actividad ? [{ ...aActividad(f.actividad), estado: f.estado }] : []));
  }

  async misActividades(u: Usuario): Promise<ActividadAlumno[]> {
    exigir(u, "verMisActividades");
    return this.actividadesDe(u.id);
  }

  async cambiarEstado(u: Usuario, actividadId: number, estado: Estado): Promise<void> {
    exigir(u, "cambiarEstado");
    const filas = ok(
      await this.sb.from("asignaciones").update({ estado }).eq("actividad_id", actividadId).eq("estudiante_id", u.id).select("actividad_id")
    );
    if (!filas.length) throw new ErrorDominio("La actividad no existe o no está asignada a ti.", "no-encontrado");
  }

  async tutorados(u: Usuario): Promise<Estudiante[]> {
    exigir(u, "verTutorados");
    const filas = ok(
      await this.sb.from("profiles").select("id, nombre, rol, matricula, programa").eq("tutor_id", u.id).order("nombre").returns<FilaPerfil[]>()
    );
    return filas.map(aEstudiante);
  }

  async actividadesDeTutorado(u: Usuario, estudianteId: string): Promise<ActividadAlumno[]> {
    exigir(u, "verTutorados");
    return this.actividadesDe(estudianteId);
  }

  // ---------- Profesor ----------
  async actividadesProfesor(u: Usuario): Promise<ActividadProfesor[]> {
    exigir(u, "gestionarActividades");
    const filas = ok(
      await this.sb
        .from("actividades")
        .select(`${COLS_ACTIVIDAD}, asignaciones(estudiante_id, estado, estudiante:profiles!asignaciones_estudiante_id_fkey(nombre))`)
        .eq("profesor_id", u.id)
        .returns<(FilaActividad & { asignaciones: { estudiante_id: string; estado: Estado; estudiante: { nombre: string } | null }[] })[]>()
    );
    return filas.map((f) => ({
      ...aActividad(f),
      asignaciones: f.asignaciones.map((s) => ({ estudianteId: s.estudiante_id, estudianteNombre: s.estudiante?.nombre ?? "—", estado: s.estado }))
    }));
  }

  async estudiantes(u: Usuario): Promise<Estudiante[]> {
    exigir(u, "gestionarActividades");
    const filas = ok(
      await this.sb.from("profiles").select("id, nombre, rol, matricula, programa").eq("rol", "estudiante").order("nombre").returns<FilaPerfil[]>()
    );
    return filas.map(aEstudiante);
  }

  async guardarActividad(u: Usuario, entrada: ActividadInput, id?: number): Promise<number> {
    exigir(u, "gestionarActividades");
    if (Object.keys(validarActividad(entrada)).length) throw new ErrorDominio("Revisa los datos de la actividad.");
    const d = normalizarActividad(entrada);
    return ok(
      await this.sb.rpc("guardar_actividad", {
        p_id: id ?? null,
        p_titulo: d.titulo,
        p_descripcion: d.descripcion,
        p_materia: d.materia,
        p_fecha: d.fecha,
        p_hora: d.hora || null,
        p_estudiante: d.estudianteId
      })
    ) as number;
  }

  async eliminarActividad(u: Usuario, id: number): Promise<void> {
    exigir(u, "gestionarActividades");
    const filas = ok(await this.sb.from("actividades").delete().eq("id", id).select("id"));
    if (!filas.length) throw new ErrorDominio("Actividad no encontrada.", "no-encontrado");
  }
}
