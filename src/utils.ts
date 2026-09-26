import type { Actividad, Estado } from "./domain/tipos";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** 2026-09-19 → "19 - 09 - 26" */
function fechaCorta(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d} - ${m} - ${y.slice(2)}`;
}

/** 2026-09-19 → "19 de septiembre de 2026" */
export function fechaLarga(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

export function fechaHora(a: Pick<Actividad, "fecha" | "hora">): string {
  return `${fechaCorta(a.fecha)}   ${a.hora || "—"}`;
}

/** Fecha de hoy en el formato de la base de datos (AAAA-MM-DD), en hora local. */
function hoyISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

/** Una actividad está vencida si ya pasó su fecha de entrega y no está terminada. */
export function vencida(a: Pick<Actividad, "fecha"> & { estado: Estado }): boolean {
  return a.estado !== "Terminada" && !!a.fecha && a.fecha < hoyISO();
}

export function tagClass(e: Estado): string {
  return e === "Pendiente" ? "tag tag-pendiente" : e === "En proceso" ? "tag tag-proceso" : "tag tag-terminada";
}

export function iniciales(nombre: string): string {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function primerNombre(nombre: string): string {
  return nombre.replace(/^(Mtro\.|Mtra\.)\s*/, "").split(" ")[0];
}
