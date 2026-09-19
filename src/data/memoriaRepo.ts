import { exigir, normalizarActividad, validarActividad } from "../domain/reglas";
import type { ActividadAlumno, ActividadInput, ActividadProfesor, Estado, Estudiante, Rol, Usuario } from "../domain/tipos";
import { ErrorDominio } from "../domain/tipos";
import type { Repositorio } from "./repositorio";
import { ACTIVIDADES, ASIGNACIONES, ESTUDIANTES, PROFESOR, TUTOR, TUTOR_DE, USUARIO_DEMO, type ActividadSemilla, type AsignacionSemilla } from "./seed";

interface Estado_ {
  actividades: ActividadSemilla[];
  asignaciones: AsignacionSemilla[];
  siguienteId: number;
}

const CLAVE_DATOS = "campus-plus:demo:datos:v2";
const CLAVE_SESION = "campus-plus:demo:sesion";

const USUARIOS: Usuario[] = [PROFESOR, TUTOR, ...ESTUDIANTES];

function inicial(): Estado_ {
  return {
    actividades: ACTIVIDADES.map((a) => ({ ...a })),
    asignaciones: ASIGNACIONES.map((s) => ({ ...s })),
    siguienteId: Math.max(...ACTIVIDADES.map((a) => a.id)) + 1
  };
}

/**
 * Adaptador de demostración: guarda los datos en el almacenamiento local del navegador
 * y aplica las mismas reglas de permisos que la base de datos (RLS).
 */
export class MemoriaRepo implements Repositorio {
  readonly modo = "demo" as const;
  private datos: Estado_;

  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null = safeStorage()) {
    this.datos = this.cargar();
  }

  private cargar(): Estado_ {
    try {
      const raw = this.storage?.getItem(CLAVE_DATOS);
      if (raw) {
        const d = JSON.parse(raw) as Estado_;
        if (Array.isArray(d.actividades) && Array.isArray(d.asignaciones)) return d;
      }
    } catch {
      /* datos dañados o almacenamiento bloqueado: se reinicia */
    }
    return inicial();
  }

  private guardar() {
    try {
      this.storage?.setItem(CLAVE_DATOS, JSON.stringify(this.datos));
    } catch {
      /* sin persistencia disponible (modo privado) */
    }
  }

  restablecer() {
    this.datos = inicial();
    this.guardar();
  }

  // ---------- Sesión ----------
  async sesionActual(): Promise<Usuario | null> {
    const id = this.storage?.getItem(CLAVE_SESION);
    return USUARIOS.find((u) => u.id === id) ?? null;
  }

  async iniciarSesion(c: { email: string; password: string } | { rol: Rol }): Promise<Usuario> {
    if (!("rol" in c)) throw new ErrorDominio("El modo demostración no usa correo y contraseña.", "sesion");
    const u = USUARIO_DEMO[c.rol];
    this.storage?.setItem(CLAVE_SESION, u.id);
    return u;
  }

  async cerrarSesion(): Promise<void> {
    this.storage?.removeItem(CLAVE_SESION);
  }

  // ---------- Consultas ----------
  private nombre(id: string) {
    return USUARIOS.find((u) => u.id === id)?.nombre ?? "—";
  }

  private base(a: ActividadSemilla) {
    return { ...a, profesorNombre: this.nombre(a.profesorId) };
  }

  private delEstudiante(estudianteId: string): ActividadAlumno[] {
    return this.datos.asignaciones
      .filter((s) => s.estudianteId === estudianteId)
      .flatMap((s) => {
        const a = this.datos.actividades.find((x) => x.id === s.actividadId);
        return a ? [{ ...this.base(a), estado: s.estado }] : [];
      });
  }

  async misActividades(u: Usuario): Promise<ActividadAlumno[]> {
    exigir(u, "verMisActividades");
    return this.delEstudiante(u.id);
  }

  async cambiarEstado(u: Usuario, actividadId: number, estado: Estado): Promise<void> {
    exigir(u, "cambiarEstado");
    const s = this.datos.asignaciones.find((x) => x.actividadId === actividadId && x.estudianteId === u.id);
    if (!s) throw new ErrorDominio("La actividad no existe o no está asignada a ti.", "no-encontrado");
    s.estado = estado;
    this.guardar();
  }

  async actividadesProfesor(u: Usuario): Promise<ActividadProfesor[]> {
    exigir(u, "gestionarActividades");
    return this.datos.actividades
      .filter((a) => a.profesorId === u.id)
      .map((a) => ({
        ...this.base(a),
        asignaciones: this.datos.asignaciones
          .filter((s) => s.actividadId === a.id)
          .map((s) => ({ estudianteId: s.estudianteId, estudianteNombre: this.nombre(s.estudianteId), estado: s.estado }))
      }));
  }

  async estudiantes(u: Usuario): Promise<Estudiante[]> {
    exigir(u, "gestionarActividades");
    return ESTUDIANTES.map((e) => ({ ...e }));
  }

  async guardarActividad(u: Usuario, entrada: ActividadInput, id?: number): Promise<number> {
    exigir(u, "gestionarActividades");
    if (Object.keys(validarActividad(entrada)).length) throw new ErrorDominio("Revisa los datos de la actividad.");
    const d = normalizarActividad(entrada);
    if (d.estudianteId && !ESTUDIANTES.some((e) => e.id === d.estudianteId)) {
      throw new ErrorDominio("El destinatario no es un estudiante.");
    }
    const campos = { titulo: d.titulo, descripcion: d.descripcion, materia: d.materia, fecha: d.fecha, hora: d.hora, paraGrupo: d.estudianteId == null };

    let actId: number;
    if (id == null) {
      actId = this.datos.siguienteId++;
      this.datos.actividades.push({ id: actId, ...campos, profesorId: u.id });
    } else {
      const a = this.datos.actividades.find((x) => x.id === id && x.profesorId === u.id);
      if (!a) throw new ErrorDominio("Actividad no encontrada.", "no-encontrado");
      Object.assign(a, campos);
      actId = a.id;
      if (d.estudianteId) {
        this.datos.asignaciones = this.datos.asignaciones.filter((s) => s.actividadId !== actId || s.estudianteId === d.estudianteId);
      }
    }

    const destinatarios = d.estudianteId ? [d.estudianteId] : ESTUDIANTES.map((e) => e.id);
    for (const est of destinatarios) {
      if (!this.datos.asignaciones.some((s) => s.actividadId === actId && s.estudianteId === est)) {
        this.datos.asignaciones.push({ actividadId: actId, estudianteId: est, estado: "Pendiente" });
      }
    }
    this.guardar();
    return actId;
  }

  async eliminarActividad(u: Usuario, id: number): Promise<void> {
    exigir(u, "gestionarActividades");
    const existe = this.datos.actividades.some((a) => a.id === id && a.profesorId === u.id);
    if (!existe) throw new ErrorDominio("Actividad no encontrada.", "no-encontrado");
    this.datos.actividades = this.datos.actividades.filter((a) => a.id !== id);
    this.datos.asignaciones = this.datos.asignaciones.filter((s) => s.actividadId !== id);
    this.guardar();
  }

  async tutorados(u: Usuario): Promise<Estudiante[]> {
    exigir(u, "verTutorados");
    return ESTUDIANTES.filter((e) => TUTOR_DE[e.id] === u.id).map((e) => ({ ...e }));
  }

  async actividadesDeTutorado(u: Usuario, estudianteId: string): Promise<ActividadAlumno[]> {
    exigir(u, "verTutorados");
    if (TUTOR_DE[estudianteId] !== u.id) throw new ErrorDominio("Este estudiante no es tu tutorado.", "permiso");
    return this.delEstudiante(estudianteId);
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}
