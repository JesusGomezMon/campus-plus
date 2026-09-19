import type { ActividadAlumno, ActividadInput, ActividadProfesor, Estado, Estudiante, Rol, Usuario } from "../domain/tipos";

/**
 * Puerto de acceso a datos (patrón Repositorio).
 * La UI solo conoce esta interfaz; hay dos adaptadores:
 *  - SupabaseRepo: PostgreSQL en la nube con autenticación y RLS (producción).
 *  - MemoriaRepo: datos locales de demostración (sin conexión / pruebas).
 */
export interface Repositorio {
  readonly modo: "supabase" | "demo";

  // Sesión
  sesionActual(): Promise<Usuario | null>;
  iniciarSesion(credenciales: { email: string; password: string } | { rol: Rol }): Promise<Usuario>;
  cerrarSesion(): Promise<void>;

  // Estudiante
  misActividades(u: Usuario): Promise<ActividadAlumno[]>;
  cambiarEstado(u: Usuario, actividadId: number, estado: Estado): Promise<void>;

  // Profesor
  actividadesProfesor(u: Usuario): Promise<ActividadProfesor[]>;
  estudiantes(u: Usuario): Promise<Estudiante[]>;
  guardarActividad(u: Usuario, datos: ActividadInput, id?: number): Promise<number>;
  eliminarActividad(u: Usuario, id: number): Promise<void>;

  // Tutor
  tutorados(u: Usuario): Promise<Estudiante[]>;
  actividadesDeTutorado(u: Usuario, estudianteId: string): Promise<ActividadAlumno[]>;
}
