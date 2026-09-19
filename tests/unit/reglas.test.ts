import { describe, expect, it } from "vitest";
import { avance, contarPorEstado, estadoGlobal, exigir, normalizarActividad, porFecha, proximas, puede, validarActividad } from "../../src/domain/reglas";
import type { ActividadAlumno, ActividadInput } from "../../src/domain/tipos";
import { ErrorDominio } from "../../src/domain/tipos";

const base: ActividadInput = { titulo: "Tarea", descripcion: "", materia: "", fecha: "2026-10-01", hora: "", estudianteId: null };

const act = (id: number, fecha: string, hora: string, estado: ActividadAlumno["estado"]): ActividadAlumno => ({
  id, titulo: `A${id}`, descripcion: "", materia: "M", fecha, hora, paraGrupo: false, profesorId: "p", profesorNombre: "P", estado
});

describe("validarActividad (RN-01 a RN-04)", () => {
  it("acepta una actividad mínima válida", () => {
    expect(validarActividad(base)).toEqual({});
  });

  it("exige nombre y fecha", () => {
    const e = validarActividad({ ...base, titulo: "   ", fecha: "" });
    expect(e.titulo).toMatch(/nombre/);
    expect(e.fecha).toMatch(/fecha/);
  });

  it("rechaza nombres de más de 120 caracteres", () => {
    expect(validarActividad({ ...base, titulo: "x".repeat(121) }).titulo).toMatch(/120/);
    expect(validarActividad({ ...base, titulo: "x".repeat(120) }).titulo).toBeUndefined();
  });

  it.each(["2026-02-30", "2026-13-01", "01/10/2026", "abc"])("rechaza la fecha inválida %s", (fecha) => {
    expect(validarActividad({ ...base, fecha }).fecha).toBeDefined();
  });

  it("acepta el 29 de febrero en año bisiesto", () => {
    expect(validarActividad({ ...base, fecha: "2028-02-29" }).fecha).toBeUndefined();
  });

  it.each(["24:00", "9:00", "12:60"])("rechaza la hora inválida %s", (hora) => {
    expect(validarActividad({ ...base, hora }).hora).toBeDefined();
  });

  it("limita descripción y materia", () => {
    const e = validarActividad({ ...base, descripcion: "d".repeat(2001), materia: "m".repeat(81) });
    expect(e.descripcion).toBeDefined();
    expect(e.materia).toBeDefined();
  });
});

describe("normalizarActividad", () => {
  it("recorta espacios y usa 'General' si no hay materia", () => {
    expect(normalizarActividad({ ...base, titulo: "  Tarea  ", materia: "  " })).toMatchObject({ titulo: "Tarea", materia: "General" });
  });
});

describe("matriz de permisos (RN-05)", () => {
  it("solo el profesor gestiona actividades", () => {
    expect(puede({ rol: "profesor" }, "gestionarActividades")).toBe(true);
    expect(puede({ rol: "estudiante" }, "gestionarActividades")).toBe(false);
    expect(puede({ rol: "tutor" }, "gestionarActividades")).toBe(false);
  });

  it("solo el estudiante cambia estados y solo el tutor ve tutorados", () => {
    expect(puede({ rol: "estudiante" }, "cambiarEstado")).toBe(true);
    expect(puede({ rol: "profesor" }, "cambiarEstado")).toBe(false);
    expect(puede({ rol: "tutor" }, "verTutorados")).toBe(true);
    expect(puede({ rol: "estudiante" }, "verTutorados")).toBe(false);
  });

  it("exigir lanza error de permiso o de sesión", () => {
    expect(() => exigir({ rol: "tutor" }, "cambiarEstado")).toThrowError(ErrorDominio);
    expect(() => exigir(null, "cambiarEstado")).toThrow(/sesión/);
  });
});

describe("próximas actividades y conteos (RN-06)", () => {
  const lista = [
    act(1, "2026-09-21", "18:00", "Pendiente"),
    act(2, "2026-09-19", "16:00", "Pendiente"),
    act(3, "2026-09-10", "10:00", "Terminada"),
    act(4, "2026-09-21", "17:00", "En proceso"),
    act(5, "2026-09-30", "", "Pendiente")
  ];

  it("excluye las terminadas, ordena por fecha y hora y limita a 3", () => {
    expect(proximas(lista).map((a) => a.id)).toEqual([2, 4, 1]);
  });

  it("las actividades sin hora van al final del día", () => {
    expect([act(1, "2026-09-21", "", "Pendiente"), act(2, "2026-09-21", "08:00", "Pendiente")].sort(porFecha).map((a) => a.id)).toEqual([2, 1]);
  });

  it("cuenta por estado", () => {
    expect(contarPorEstado(lista)).toEqual({ Pendiente: 3, "En proceso": 1, Terminada: 1 });
  });
});

describe("estado global de una actividad de grupo (RN-07)", () => {
  it.each([
    [[], "Pendiente"],
    [["Pendiente", "Pendiente"], "Pendiente"],
    [["Terminada", "Terminada"], "Terminada"],
    [["Terminada", "Pendiente"], "En proceso"],
    [["En proceso"], "En proceso"]
  ] as const)("%j → %s", (estados, esperado) => {
    expect(estadoGlobal(estados.map((estado) => ({ estado })))).toBe(esperado);
  });

  it("calcula el avance", () => {
    expect(avance([{ estado: "Terminada" }, { estado: "Pendiente" }])).toEqual({ terminadas: 1, total: 2 });
  });
});
