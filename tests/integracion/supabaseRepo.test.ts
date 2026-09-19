/**
 * Integración del adaptador SupabaseRepo con la base de datos real.
 * Se omite automáticamente si no hay configuración de Supabase en .env.local
 * (por ejemplo en CI). Ejecutar con: npm run test:integracion
 */
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { SupabaseRepo } from "../../src/data/supabaseRepo";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const password = process.env.SEED_PASSWORD;
const hayConfig = !!(url && key && password);

const nuevoRepo = () => new SupabaseRepo(createClient(url!, key!, { auth: { persistSession: false } }));

describe.skipIf(!hayConfig)("SupabaseRepo contra Supabase", () => {
  it("rechaza credenciales incorrectas con un mensaje claro", async () => {
    await expect(nuevoRepo().iniciarSesion({ email: "ana@campusplus.test", password: "incorrecta-123" })).rejects.toThrow(
      "Correo o contraseña incorrectos."
    );
  });

  it("estudiante: inicia sesión, lee sus actividades y cambia un estado", async () => {
    const repo = nuevoRepo();
    const ana = await repo.iniciarSesion({ email: "ana@campusplus.test", password: password! });
    expect(ana).toMatchObject({ nombre: "Ana Sofía Canul", rol: "estudiante" });
    expect((await repo.sesionActual())?.id).toBe(ana.id);

    const mias = await repo.misActividades(ana);
    expect(mias).toHaveLength(4);
    expect(mias.every((a) => a.profesorNombre === "Mtro. Jorge Interián")).toBe(true);
    expect(mias.find((a) => a.titulo === "Ejercicio de Matemáticas")).toMatchObject({ hora: "16:00", fecha: "2026-09-19" });

    const act = mias.find((a) => a.titulo === "Ejercicio de Física")!;
    await repo.cambiarEstado(ana, act.id, "Terminada");
    expect((await repo.misActividades(ana)).find((a) => a.id === act.id)?.estado).toBe("Terminada");
    await repo.cambiarEstado(ana, act.id, act.estado);

    await expect(repo.cambiarEstado(ana, 999999, "Terminada")).rejects.toMatchObject({ codigo: "no-encontrado" });
    await repo.cerrarSesion();
    expect(await repo.sesionActual()).toBeNull();
  });

  it("profesor: registra, edita, consulta avance y elimina", async () => {
    const repo = nuevoRepo();
    const prof = await repo.iniciarSesion({ email: "profesor@campusplus.test", password: password! });
    const estudiantes = await repo.estudiantes(prof);
    expect(estudiantes).toHaveLength(4);
    const luis = estudiantes.find((e) => e.nombre === "Luis Pech Uc")!;

    const id = await repo.guardarActividad(prof, { titulo: "Integración", descripcion: "Prueba", materia: "", fecha: "2026-12-10", hora: "09:30", estudianteId: null });
    let act = (await repo.actividadesProfesor(prof)).find((a) => a.id === id)!;
    expect(act).toMatchObject({ paraGrupo: true, materia: "General", hora: "09:30" });
    expect(act.asignaciones).toHaveLength(4);

    await repo.guardarActividad(prof, { titulo: "Integración II", descripcion: "", materia: "QA", fecha: "2026-12-11", hora: "", estudianteId: luis.id }, id);
    act = (await repo.actividadesProfesor(prof)).find((a) => a.id === id)!;
    expect(act).toMatchObject({ titulo: "Integración II", paraGrupo: false, hora: "" });
    expect(act.asignaciones.map((s) => s.estudianteNombre)).toEqual(["Luis Pech Uc"]);

    await repo.eliminarActividad(prof, id);
    expect((await repo.actividadesProfesor(prof)).some((a) => a.id === id)).toBe(false);
    await expect(repo.eliminarActividad(prof, id)).rejects.toMatchObject({ codigo: "no-encontrado" });
  });

  it("tutor: ve a sus tutorados y sus actividades", async () => {
    const repo = nuevoRepo();
    const tutor = await repo.iniciarSesion({ email: "tutor@campusplus.test", password: password! });
    const tut = await repo.tutorados(tutor);
    expect(tut.map((t) => t.nombre)).toEqual(["Ana Sofía Canul", "Diego Balam Kú", "Luis Pech Uc", "Marisol Cruz Tun"]);
    const marisol = tut.find((t) => t.nombre === "Marisol Cruz Tun")!;
    expect(marisol).toMatchObject({ matricula: "1902017", programa: "Sistemas Comerciales" });
    const acts = await repo.actividadesDeTutorado(tutor, marisol.id);
    expect(acts.map((a) => a.titulo).sort()).toEqual(["Cuestionario unidad 1", "Diagrama entidad-relación"]);
  });

  it("los permisos del dominio se aplican antes de llegar a la red", async () => {
    const repo = nuevoRepo();
    const tutor = await repo.iniciarSesion({ email: "tutor@campusplus.test", password: password! });
    await expect(repo.guardarActividad(tutor, { titulo: "X", descripcion: "", materia: "", fecha: "2026-10-01", hora: "", estudianteId: null })).rejects.toMatchObject({ codigo: "permiso" });
  });
});
