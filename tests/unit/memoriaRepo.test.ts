import { beforeEach, describe, expect, it } from "vitest";
import { MemoriaRepo } from "../../src/data/memoriaRepo";
import { ESTUDIANTES, PROFESOR, TUTOR } from "../../src/data/seed";
import type { ActividadInput } from "../../src/domain/tipos";

/** Almacenamiento en memoria que imita localStorage. */
function almacen() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

const [ana, luis] = ESTUDIANTES;
const nueva: ActividadInput = { titulo: "Práctica de redes", descripcion: "VLANs", materia: "Redes", fecha: "2026-10-05", hora: "10:30", estudianteId: luis.id };

describe("MemoriaRepo (adaptador de demostración)", () => {
  let repo: MemoriaRepo;
  let storage: ReturnType<typeof almacen>;

  beforeEach(() => {
    storage = almacen();
    repo = new MemoriaRepo(storage);
  });

  it("inicia sesión por rol y recuerda la sesión", async () => {
    expect(await repo.sesionActual()).toBeNull();
    const u = await repo.iniciarSesion({ rol: "tutor" });
    expect(u.id).toBe(TUTOR.id);
    expect((await new MemoriaRepo(storage).sesionActual())?.id).toBe(TUTOR.id);
    await repo.cerrarSesion();
    expect(await repo.sesionActual()).toBeNull();
  });

  it("recorta la lista al límite pedido y avisa que quedan más", async () => {
    const dos = await repo.misActividades(ana, 2);
    expect(dos.length).toBe(2);
    expect(dos.hayMas).toBe(true);

    const todas = await repo.misActividades(ana, 50);
    expect(todas.length).toBe(4);
    expect(todas.hayMas).toBe(false);

    // La primera página trae las primeras de la lista completa, no otras cualesquiera.
    expect(dos.map((a) => a.id)).toEqual(todas.slice(0, 2).map((a) => a.id));
  });

  it("devuelve las actividades ordenadas por fecha y hora desde el repositorio", async () => {
    const mias = await repo.misActividades(ana);
    const claves = mias.map((a) => `${a.fecha} ${a.hora || "99:99"}`);
    expect(claves).toEqual([...claves].sort());
  });

  it("el estudiante solo ve sus propias actividades", async () => {
    const mias = await repo.misActividades(ana);
    expect(mias.length).toBe(4);
    expect(mias.every((a) => a.profesorNombre === PROFESOR.nombre)).toBe(true);
  });

  it("el estudiante cambia el estado de su actividad y persiste", async () => {
    await repo.cambiarEstado(ana, 1, "Terminada");
    const recargado = new MemoriaRepo(storage);
    expect((await recargado.misActividades(ana)).find((a) => a.id === 1)?.estado).toBe("Terminada");
  });

  it("no permite cambiar el estado de una actividad ajena", async () => {
    await expect(repo.cambiarEstado(luis, 1, "Terminada")).rejects.toMatchObject({ codigo: "no-encontrado" });
  });

  it("rechaza operaciones fuera del rol", async () => {
    await expect(repo.guardarActividad(ana, nueva)).rejects.toMatchObject({ codigo: "permiso" });
    await expect(repo.eliminarActividad(TUTOR, 1)).rejects.toMatchObject({ codigo: "permiso" });
    await expect(repo.cambiarEstado(PROFESOR, 1, "Terminada")).rejects.toMatchObject({ codigo: "permiso" });
    await expect(repo.tutorados(PROFESOR)).rejects.toMatchObject({ codigo: "permiso" });
  });

  it("registra una actividad individual y el estudiante la recibe como Pendiente", async () => {
    const id = await repo.guardarActividad(PROFESOR, nueva);
    const deLuis = await repo.misActividades(luis);
    expect(deLuis.find((a) => a.id === id)).toMatchObject({ titulo: "Práctica de redes", estado: "Pendiente" });
    expect((await repo.misActividades(ana)).some((a) => a.id === id)).toBe(false);
  });

  it("una actividad de grupo se asigna a todos los estudiantes", async () => {
    const id = await repo.guardarActividad(PROFESOR, { ...nueva, estudianteId: null });
    const act = (await repo.actividadesProfesor(PROFESOR)).find((a) => a.id === id)!;
    expect(act.paraGrupo).toBe(true);
    expect(act.asignaciones).toHaveLength(ESTUDIANTES.length);
  });

  it("al editar conserva el avance si el destinatario no cambia", async () => {
    await repo.guardarActividad(PROFESOR, { titulo: "Ejercicio de Programación v2", descripcion: "", materia: "", fecha: "2026-09-22", hora: "", estudianteId: ana.id }, 2);
    const a = (await repo.misActividades(ana)).find((x) => x.id === 2)!;
    expect(a).toMatchObject({ titulo: "Ejercicio de Programación v2", estado: "En proceso", materia: "General" });
  });

  it("al cambiar de grupo a un estudiante quita las demás asignaciones", async () => {
    await repo.guardarActividad(PROFESOR, { ...nueva, titulo: "Cuestionario", estudianteId: luis.id }, 4);
    const act = (await repo.actividadesProfesor(PROFESOR)).find((a) => a.id === 4)!;
    expect(act.asignaciones.map((s) => s.estudianteId)).toEqual([luis.id]);
  });

  it("rechaza datos inválidos aunque se salte la validación de la UI", async () => {
    await expect(repo.guardarActividad(PROFESOR, { ...nueva, titulo: "" })).rejects.toMatchObject({ codigo: "validacion" });
    await expect(repo.guardarActividad(PROFESOR, { ...nueva, estudianteId: TUTOR.id })).rejects.toThrow(/estudiante/);
  });

  it("elimina la actividad y sus asignaciones", async () => {
    await repo.eliminarActividad(PROFESOR, 4);
    expect((await repo.misActividades(ana)).some((a) => a.id === 4)).toBe(false);
    await expect(repo.eliminarActividad(PROFESOR, 4)).rejects.toMatchObject({ codigo: "no-encontrado" });
  });

  it("el tutor ve a sus tutorados y sus actividades", async () => {
    expect(await repo.tutorados(TUTOR)).toHaveLength(4);
    expect(await repo.actividadesDeTutorado(TUTOR, ana.id)).toHaveLength(4);
  });

  it("se recupera de datos dañados en el almacenamiento", async () => {
    storage.setItem("campus-plus:demo:datos:v2", "{no es json");
    expect(await new MemoriaRepo(storage).misActividades(ana)).toHaveLength(4);
  });

  it("restablecer vuelve a los datos de ejemplo", async () => {
    await repo.eliminarActividad(PROFESOR, 1);
    repo.restablecer();
    expect(await repo.misActividades(ana)).toHaveLength(4);
  });
});
