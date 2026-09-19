export type Estado = "Pendiente" | "En proceso" | "Terminada";
export type Rol = "estudiante" | "profesor" | "tutor";

export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  /** Fecha ISO (AAAA-MM-DD) */
  fecha: string;
  /** Hora HH:MM */
  hora: string;
  estado: Estado;
  estudiante: string;
  materia: string;
  profesor: string;
}

export interface Tutorado {
  id: number;
  nombre: string;
  matricula: string;
  programa: string;
}
