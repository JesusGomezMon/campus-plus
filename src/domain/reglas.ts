/** Reglas de negocio de Campus+. Funciones puras: se prueban sin UI ni base de datos. */
import type { Actividad, ActividadInput, Asignacion, Estado, Rol, Usuario } from "./tipos";
import { ErrorDominio } from "./tipos";

export const LIMITES = { titulo: 120, descripcion: 2000, materia: 80 } as const;

export type ErroresActividad = Partial<Record<"titulo" | "fecha" | "hora" | "descripcion" | "materia", string>>;

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function fechaValida(iso: string): boolean {
  if (!FECHA_RE.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

/** RN-01 a RN-04: valida los datos de una actividad antes de guardarla. */
export function validarActividad(a: ActividadInput): ErroresActividad {
  const e: ErroresActividad = {};
  const titulo = a.titulo.trim();
  if (!titulo) e.titulo = "Escribe el nombre de la actividad.";
  else if (titulo.length > LIMITES.titulo) e.titulo = `Máximo ${LIMITES.titulo} caracteres.`;

  if (!a.fecha) e.fecha = "Selecciona la fecha de entrega.";
  else if (!fechaValida(a.fecha)) e.fecha = "La fecha no es válida.";

  if (a.hora && !HORA_RE.test(a.hora)) e.hora = "La hora no es válida.";
  if (a.descripcion.length > LIMITES.descripcion) e.descripcion = `Máximo ${LIMITES.descripcion} caracteres.`;
  if (a.materia.trim().length > LIMITES.materia) e.materia = `Máximo ${LIMITES.materia} caracteres.`;
  return e;
}

/** Normaliza el formulario: recorta espacios y aplica la materia por omisión. */
export function normalizarActividad(a: ActividadInput): ActividadInput {
  return {
    ...a,
    titulo: a.titulo.trim(),
    descripcion: a.descripcion.trim(),
    materia: a.materia.trim() || "General",
    hora: a.hora || ""
  };
}

/** Matriz de permisos (RN-05): qué puede hacer cada rol. */
const PERMISOS = {
  verMisActividades: ["estudiante"],
  cambiarEstado: ["estudiante"],
  gestionarActividades: ["profesor"],
  verTutorados: ["tutor"]
} as const satisfies Record<string, readonly Rol[]>;

export type Permiso = keyof typeof PERMISOS;

export function puede(u: Pick<Usuario, "rol"> | null | undefined, p: Permiso): boolean {
  return !!u && (PERMISOS[p] as readonly Rol[]).includes(u.rol);
}

export function exigir(u: Pick<Usuario, "rol"> | null | undefined, p: Permiso): void {
  if (!u) throw new ErrorDominio("Tu sesión terminó. Vuelve a iniciar sesión.", "sesion");
  if (!puede(u, p)) throw new ErrorDominio("No tienes permiso para realizar esta acción.", "permiso");
}

/** Ordena por fecha y hora de entrega (ascendente). */
export function porFecha(a: Pick<Actividad, "fecha" | "hora">, b: Pick<Actividad, "fecha" | "hora">): number {
  return (a.fecha + (a.hora || "99:99")).localeCompare(b.fecha + (b.hora || "99:99"));
}

/** RN-06: próximas actividades = no terminadas, ordenadas por fecha, máximo `n`. */
export function proximas<T extends Actividad & { estado: Estado }>(lista: T[], n = 3): T[] {
  return lista.filter((a) => a.estado !== "Terminada").sort(porFecha).slice(0, n);
}

export function contarPorEstado(lista: { estado: Estado }[]): Record<Estado, number> {
  const c: Record<Estado, number> = { Pendiente: 0, "En proceso": 0, Terminada: 0 };
  for (const a of lista) c[a.estado] += 1;
  return c;
}

/**
 * RN-07: estado global de una actividad para el profesor.
 * Todas terminadas → Terminada; ninguna iniciada → Pendiente; cualquier otro caso → En proceso.
 */
export function estadoGlobal(asignaciones: Pick<Asignacion, "estado">[]): Estado {
  if (asignaciones.length === 0) return "Pendiente";
  if (asignaciones.every((s) => s.estado === "Terminada")) return "Terminada";
  if (asignaciones.every((s) => s.estado === "Pendiente")) return "Pendiente";
  return "En proceso";
}

export function avance(asignaciones: Pick<Asignacion, "estado">[]): { terminadas: number; total: number } {
  return { terminadas: asignaciones.filter((s) => s.estado === "Terminada").length, total: asignaciones.length };
}
