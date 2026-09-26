/** Modelo de dominio de Campus+ (independiente de la base de datos y de la UI). */

export type Rol = "estudiante" | "profesor" | "tutor";
export type Estado = "Pendiente" | "En proceso" | "Terminada";

export const ESTADOS: readonly Estado[] = ["Pendiente", "En proceso", "Terminada"];

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
}

export interface Estudiante extends Usuario {
  rol: "estudiante";
  matricula: string;
  programa: string;
}

/** Datos comunes de una actividad registrada por un profesor. */
export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  materia: string;
  /** AAAA-MM-DD */
  fecha: string;
  /** HH:MM o cadena vacía */
  hora: string;
  paraGrupo: boolean;
  profesorId: string;
  profesorNombre: string;
}

/** Actividad vista por un estudiante (o por su tutor): incluye el avance propio. */
export interface ActividadAlumno extends Actividad {
  estado: Estado;
}

export interface Asignacion {
  estudianteId: string;
  estudianteNombre: string;
  estado: Estado;
}

/** Actividad vista por el profesor: incluye el avance de cada destinatario. */
export interface ActividadProfesor extends Actividad {
  asignaciones: Asignacion[];
}

/** Datos que captura el formulario de registro / edición. */
export interface ActividadInput {
  titulo: string;
  descripcion: string;
  materia: string;
  fecha: string;
  hora: string;
  /** id del estudiante destinatario; null = grupo completo */
  estudianteId: string | null;
}

export class ErrorDominio extends Error {
  constructor(
    message: string,
    readonly codigo: "permiso" | "validacion" | "no-encontrado" | "red" | "sesion" = "validacion"
  ) {
    super(message);
    this.name = "ErrorDominio";
  }
}

/**
 * Lista que además avisa si en el servidor quedaban más registros de los que
 * se pidieron. Se comporta como un arreglo normal, así que el código que solo
 * recorre los resultados no necesita saber que está paginado.
 */
export type Lista<T> = T[] & { hayMas: boolean };

export function lista<T>(filas: T[], hayMas = false): Lista<T> {
  return Object.assign(filas, { hayMas });
}
