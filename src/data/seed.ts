import type { Estado, Estudiante, Usuario } from "../domain/tipos";

/** Datos de demostración (modo sin conexión). En Supabase se cargan con `npm run db:seed`. */

export const PROFESOR: Usuario = { id: "u-prof", nombre: "Mtro. Jorge Interián", rol: "profesor" };
export const TUTOR: Usuario = { id: "u-tutor", nombre: "Mtra. Rocío Villanueva", rol: "tutor" };

export const ESTUDIANTES: Estudiante[] = [
  { id: "u-ana", nombre: "Ana Sofía Canul", rol: "estudiante", matricula: "1901234", programa: "Ing. en Redes" },
  { id: "u-luis", nombre: "Luis Pech Uc", rol: "estudiante", matricula: "1901288", programa: "Ing. en Redes" },
  { id: "u-marisol", nombre: "Marisol Cruz Tun", rol: "estudiante", matricula: "1902017", programa: "Sistemas Comerciales" },
  { id: "u-diego", nombre: "Diego Balam Kú", rol: "estudiante", matricula: "1902145", programa: "Sistemas Comerciales" }
];

/** Todos los estudiantes de demostración están asignados a la tutora. */
export const TUTOR_DE: Record<string, string> = Object.fromEntries(ESTUDIANTES.map((e) => [e.id, TUTOR.id]));

export interface ActividadSemilla {
  id: number;
  titulo: string;
  descripcion: string;
  materia: string;
  fecha: string;
  hora: string;
  paraGrupo: boolean;
  profesorId: string;
}

export interface AsignacionSemilla {
  actividadId: number;
  estudianteId: string;
  estado: Estado;
}

export const ACTIVIDADES: ActividadSemilla[] = [
  { id: 1, titulo: "Ejercicio de Matemáticas", descripcion: "Resolver los problemas 1 al 20 del capítulo 4 y entregar el procedimiento.", materia: "Matemáticas", fecha: "2026-09-19", hora: "16:00", paraGrupo: false, profesorId: PROFESOR.id },
  { id: 2, titulo: "Ejercicio de Programación", descripcion: "Implementar el ejercicio de listas enlazadas visto en clase y subir el repositorio.", materia: "Programación", fecha: "2026-09-21", hora: "17:00", paraGrupo: false, profesorId: PROFESOR.id },
  { id: 3, titulo: "Ejercicio de Física", descripcion: "Reporte de la práctica de caída libre con gráficas y conclusiones.", materia: "Física", fecha: "2026-09-21", hora: "18:00", paraGrupo: false, profesorId: PROFESOR.id },
  { id: 4, titulo: "Cuestionario unidad 1", descripcion: "Resolver el cuestionario en la plataforma antes de la fecha límite.", materia: "Bases de datos", fecha: "2026-09-12", hora: "23:59", paraGrupo: true, profesorId: PROFESOR.id },
  { id: 5, titulo: "Diagrama entidad-relación", descripcion: "Modelo del caso de estudio asignado, entregado en PDF.", materia: "Bases de datos", fecha: "2026-09-29", hora: "12:00", paraGrupo: false, profesorId: PROFESOR.id },
  { id: 6, titulo: "Reporte de lectura", descripcion: "Síntesis del capítulo 4 con comentario personal.", materia: "Metodología", fecha: "2026-09-08", hora: "09:00", paraGrupo: false, profesorId: PROFESOR.id }
];

export const ASIGNACIONES: AsignacionSemilla[] = [
  { actividadId: 1, estudianteId: "u-ana", estado: "Pendiente" },
  { actividadId: 2, estudianteId: "u-ana", estado: "En proceso" },
  { actividadId: 3, estudianteId: "u-ana", estado: "Pendiente" },
  { actividadId: 4, estudianteId: "u-ana", estado: "Terminada" },
  { actividadId: 4, estudianteId: "u-luis", estado: "Terminada" },
  { actividadId: 4, estudianteId: "u-marisol", estado: "En proceso" },
  { actividadId: 4, estudianteId: "u-diego", estado: "Pendiente" },
  { actividadId: 5, estudianteId: "u-marisol", estado: "En proceso" },
  { actividadId: 6, estudianteId: "u-diego", estado: "Terminada" }
];

/** Usuario que se usa al entrar a cada perfil en modo demostración. */
export const USUARIO_DEMO = { estudiante: ESTUDIANTES[0], profesor: PROFESOR, tutor: TUTOR } as const;
