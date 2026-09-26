import type { ActividadAlumno, ActividadInput, ActividadProfesor, Estado, Estudiante, Lista, Rol, Usuario } from "../domain/tipos";

/**
 * Tope de registros que la aplicación pide en una consulta. Ninguna pantalla
 * descarga la tabla completa: el servidor ordena y recorta, así que la
 * respuesta pesa lo mismo con 50 actividades que con 50 000.
 */
export const TOPE_CONSULTA = 200;

/** Cuántos registros muestra una lista al abrirla, antes de «Mostrar más». */
export const TAM_PAGINA = 20;

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
  misActividades(u: Usuario, limite?: number): Promise<Lista<ActividadAlumno>>;
  cambiarEstado(u: Usuario, actividadId: number, estado: Estado): Promise<void>;

  // Profesor
  actividadesProfesor(u: Usuario, limite?: number): Promise<Lista<ActividadProfesor>>;
  estudiantes(u: Usuario): Promise<Lista<Estudiante>>;
  guardarActividad(u: Usuario, datos: ActividadInput, id?: number): Promise<number>;
  eliminarActividad(u: Usuario, id: number): Promise<void>;

  // Tutor
  tutorados(u: Usuario): Promise<Lista<Estudiante>>;
  actividadesDeTutorado(u: Usuario, estudianteId: string, limite?: number): Promise<Lista<ActividadAlumno>>;
}
