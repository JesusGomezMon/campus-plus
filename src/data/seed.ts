import type { Actividad, Estado, Rol, Tutorado } from "./types";

export const ESTADOS: Estado[] = ["Pendiente", "En proceso", "Terminada"];
export const GRUPO_COMPLETO = "Grupo completo";

/** Usuarios de demostración para la versión 1 (sin autenticación). */
export const USUARIOS: Record<Rol, string> = {
  estudiante: "Ana Sofía Canul",
  profesor: "Mtro. Jorge Interián",
  tutor: "Mtra. Rocío Villanueva"
};

export const TUTORADOS: Tutorado[] = [
  { id: 1, nombre: "Ana Sofía Canul", matricula: "1901234", programa: "Ing. en Redes" },
  { id: 2, nombre: "Luis Pech Uc", matricula: "1901288", programa: "Ing. en Redes" },
  { id: 3, nombre: "Marisol Cruz Tun", matricula: "1902017", programa: "Sistemas Comerciales" },
  { id: 4, nombre: "Diego Balam Kú", matricula: "1902145", programa: "Sistemas Comerciales" }
];

const PROF = USUARIOS.profesor;

export const ACTIVIDADES_INICIALES: Actividad[] = [
  { id: 1, titulo: "Ejercicio de Matemáticas", descripcion: "Resolver los problemas 1 al 20 del capítulo 4 y entregar el procedimiento.", fecha: "2026-09-19", hora: "16:00", estado: "Pendiente", estudiante: "Ana Sofía Canul", materia: "Matemáticas", profesor: PROF },
  { id: 2, titulo: "Ejercicio de Programación", descripcion: "Implementar el ejercicio de listas enlazadas visto en clase y subir el repositorio.", fecha: "2026-09-21", hora: "17:00", estado: "En proceso", estudiante: "Ana Sofía Canul", materia: "Programación", profesor: PROF },
  { id: 3, titulo: "Ejercicio de Física", descripcion: "Reporte de la práctica de caída libre con gráficas y conclusiones.", fecha: "2026-09-21", hora: "18:00", estado: "Pendiente", estudiante: "Ana Sofía Canul", materia: "Física", profesor: PROF },
  { id: 4, titulo: "Cuestionario unidad 1", descripcion: "Resolver el cuestionario en la plataforma antes de la fecha límite.", fecha: "2026-09-12", hora: "23:59", estado: "Terminada", estudiante: "Ana Sofía Canul", materia: "Bases de datos", profesor: PROF },
  { id: 5, titulo: "Diagrama entidad-relación", descripcion: "Modelo del caso de estudio asignado, entregado en PDF.", fecha: "2026-09-29", hora: "12:00", estado: "En proceso", estudiante: "Marisol Cruz Tun", materia: "Bases de datos", profesor: PROF },
  { id: 6, titulo: "Reporte de lectura", descripcion: "Síntesis del capítulo 4 con comentario personal.", fecha: "2026-09-08", hora: "09:00", estado: "Terminada", estudiante: "Diego Balam Kú", materia: "Metodología", profesor: PROF }
];
