/**
 * Pruebas de la base de datos: esquema, restricciones de integridad,
 * políticas RLS por rol, privilegios por columna y bitácora de auditoría.
 * Se ejecutan contra PostgreSQL real (PGlite) con la misma migración que Supabase.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { crearBase, ID } from "./pg";

type Base = Awaited<ReturnType<typeof crearBase>>;

async function crearActividad(b: Base, estudiante: string | null, profesor: string = ID.profesor): Promise<number> {
  return b.como(profesor, async () => {
    const r = await b.db.query<{ id: number }>(
      "select public.guardar_actividad(null, 'Tarea', 'desc', 'Redes', '2026-10-01', '10:00', $1) as id",
      [estudiante]
    );
    return Number(r.rows[0].id);
  });
}

describe("Base de datos · integridad", () => {
  let b: Base;
  beforeEach(async () => {
    b = await crearBase();
  });

  it("rechaza títulos vacíos o demasiado largos (CHECK)", async () => {
    await expect(b.db.query(`insert into actividades (titulo, fecha, profesor_id) values ('  ', '2026-10-01', '${ID.profesor}')`)).rejects.toThrow(/check/i);
    await expect(b.db.query(`insert into actividades (titulo, fecha, profesor_id) values ('${"x".repeat(121)}', '2026-10-01', '${ID.profesor}')`)).rejects.toThrow(/check/i);
  });

  it("rechaza estados fuera del catálogo (ENUM)", async () => {
    const id = await crearActividad(b, ID.ana);
    await expect(b.db.query(`update asignaciones set estado = 'Cancelada' where actividad_id = ${id}`)).rejects.toThrow(/enum/i);
  });

  it("rechaza matrículas duplicadas o con formato inválido", async () => {
    await b.db.query(`insert into auth.users (id) values ('00000000-0000-4000-8000-0000000000aa'), ('00000000-0000-4000-8000-0000000000ab')`);
    await expect(
      b.db.query(`insert into profiles (id, nombre, rol, matricula) values ('00000000-0000-4000-8000-0000000000aa', 'Otra', 'estudiante', '1901234')`)
    ).rejects.toThrow(/unique|duplicate/i);
    await expect(
      b.db.query(`insert into profiles (id, nombre, rol, matricula) values ('00000000-0000-4000-8000-0000000000ab', 'Otra', 'estudiante', 'ABC')`)
    ).rejects.toThrow(/check/i);
  });

  it("un profesor no puede tener matrícula", async () => {
    await expect(b.db.query(`update profiles set matricula = '1234567' where id = '${ID.profesor}'`)).rejects.toThrow(/check/i);
  });

  it("borrar una actividad elimina sus asignaciones (CASCADE)", async () => {
    const id = await crearActividad(b, null);
    await b.db.query(`delete from actividades where id = ${id}`);
    const r = await b.db.query(`select count(*)::int as n from asignaciones where actividad_id = ${id}`);
    expect(r.rows[0]).toEqual({ n: 0 });
  });

  it("guardar_actividad para grupo asigna a todos los estudiantes", async () => {
    const id = await crearActividad(b, null);
    const r = await b.db.query<{ n: number }>(`select count(*)::int as n from asignaciones where actividad_id = ${id}`);
    expect(r.rows[0].n).toBe(3);
  });

  it("guardar_actividad rechaza un destinatario que no es estudiante", async () => {
    await expect(crearActividad(b, ID.tutor)).rejects.toThrow(/no es un estudiante/);
  });
});

describe("Base de datos · seguridad por rol (RLS)", () => {
  let b: Base;
  beforeEach(async () => {
    b = await crearBase();
  });

  const contar = (uid: string | null, sql: string) =>
    b.como(uid, async () => (await b.db.query(sql)).rows.length);

  it("un usuario anónimo no puede leer nada", async () => {
    await crearActividad(b, ID.ana);
    await expect(b.como(null, () => b.db.query("select * from actividades"))).rejects.toThrow(/permission denied/i);
    await expect(b.como(null, () => b.db.query("select * from profiles"))).rejects.toThrow(/permission denied/i);
  });

  it("el estudiante solo ve sus asignaciones y actividades", async () => {
    await crearActividad(b, ID.ana);
    await crearActividad(b, ID.luis);
    expect(await contar(ID.ana, "select * from asignaciones")).toBe(1);
    expect(await contar(ID.ana, "select * from actividades")).toBe(1);
    expect(await contar(ID.marisol, "select * from actividades")).toBe(0);
  });

  it("el estudiante no puede crear, editar ni borrar actividades", async () => {
    const id = await crearActividad(b, ID.ana);
    await expect(
      b.como(ID.ana, () => b.db.query(`insert into actividades (titulo, fecha, profesor_id) values ('X', '2026-10-01', '${ID.ana}')`))
    ).rejects.toThrow(/row-level security/i);
    await expect(b.como(ID.ana, () => b.db.query(`select public.guardar_actividad(null,'X','','','2026-10-01',null,null)`))).rejects.toThrow(/Solo un profesor/);
    // La RLS filtra la fila: el UPDATE no afecta ningún registro.
    const editadas = await b.como(ID.ana, async () => (await b.db.query(`update actividades set titulo = 'Hack' where id = ${id} returning id`)).rows.length);
    expect(editadas).toBe(0);
    expect((await b.db.query<{ titulo: string }>(`select titulo from actividades where id = ${id}`)).rows[0].titulo).toBe("Tarea");
    const borradas = await b.como(ID.ana, async () => (await b.db.query(`delete from actividades where id = ${id} returning id`)).rows.length);
    expect(borradas).toBe(0);
  });

  it("el estudiante cambia solo SU estado y no otras columnas", async () => {
    const id = await crearActividad(b, null);
    const propias = await b.como(ID.ana, async () => (await b.db.query(`update asignaciones set estado = 'Terminada' where actividad_id = ${id} returning estudiante_id`)).rows);
    expect(propias).toHaveLength(1);
    await expect(
      b.como(ID.ana, () => b.db.query(`update asignaciones set estudiante_id = '${ID.luis}' where actividad_id = ${id}`))
    ).rejects.toThrow(/permission denied/i);
    const r = await b.db.query<{ estado: string }>(`select estado from asignaciones where actividad_id = ${id} and estudiante_id = '${ID.luis}'`);
    expect(r.rows[0].estado).toBe("Pendiente");
  });

  it("un profesor no ve ni modifica actividades de otro profesor", async () => {
    const id = await crearActividad(b, ID.ana, ID.profesor);
    expect(await contar(ID.profesor2, "select * from actividades")).toBe(0);
    const editadas = await b.como(ID.profesor2, async () => (await b.db.query(`update actividades set titulo = 'Otro' where id = ${id} returning id`)).rows.length);
    expect(editadas).toBe(0);
    await expect(b.como(ID.profesor2, () => b.db.query(`insert into asignaciones (actividad_id, estudiante_id) values (${id}, '${ID.luis}')`))).rejects.toThrow(/row-level security/i);
  });

  it("el profesor no puede cambiar la autoría de una actividad", async () => {
    const id = await crearActividad(b, ID.ana);
    await expect(b.como(ID.profesor, () => b.db.query(`update actividades set profesor_id = '${ID.profesor2}' where id = ${id}`))).rejects.toThrow(/permission denied/i);
  });

  it("el tutor ve solo a sus tutorados y sus actividades", async () => {
    await crearActividad(b, ID.ana);
    await crearActividad(b, ID.marisol);
    const perfiles = await b.como(ID.tutor, async () => (await b.db.query<{ nombre: string }>("select nombre from profiles where rol = 'estudiante' order by nombre")).rows.map((r) => r.nombre));
    expect(perfiles).toEqual(["Ana Sofía Canul", "Luis Pech Uc"]);
    expect(await contar(ID.tutor, "select * from actividades")).toBe(1);
  });

  it("el tutor no puede modificar estados", async () => {
    const id = await crearActividad(b, ID.ana);
    const n = await b.como(ID.tutor, async () => (await b.db.query(`update asignaciones set estado = 'Terminada' where actividad_id = ${id} returning 1`)).rows.length);
    expect(n).toBe(0);
  });

  it("nadie puede leer la bitácora desde la app", async () => {
    await crearActividad(b, ID.ana);
    expect(await contar(ID.profesor, "select * from bitacora")).toBe(0);
  });

  it("los usuarios no pueden editar perfiles (roles) desde la app", async () => {
    await expect(b.como(ID.ana, () => b.db.query(`update profiles set rol = 'profesor' where id = '${ID.ana}'`))).resolves.toMatchObject({ affectedRows: 0 });
    const r = await b.db.query<{ rol: string }>(`select rol from profiles where id = '${ID.ana}'`);
    expect(r.rows[0].rol).toBe("estudiante");
  });

  it("es inmune a inyección SQL en los parámetros", async () => {
    const malicioso = "x'); delete from actividades; --";
    const id = await b.como(ID.profesor, async () =>
      Number((await b.db.query<{ id: number }>("select public.guardar_actividad(null, $1, '', '', '2026-10-01', null, null) as id", [malicioso])).rows[0].id)
    );
    const r = await b.db.query<{ titulo: string }>(`select titulo from actividades where id = ${id}`);
    expect(r.rows[0].titulo).toBe(malicioso);
  });
});

describe("Base de datos · auditoría", () => {
  it("registra quién crea, modifica y elimina", async () => {
    const b = await crearBase();
    const id = await crearActividad(b, ID.ana);
    await b.como(ID.ana, () => b.db.query(`update asignaciones set estado = 'En proceso' where actividad_id = ${id}`));
    await b.como(ID.profesor, () => b.db.query(`delete from actividades where id = ${id}`));
    const r = await b.db.query<{ tabla: string; operacion: string; usuario_id: string }>("select tabla, operacion, usuario_id from bitacora order by id");
    expect(r.rows.map((x) => `${x.tabla}:${x.operacion}`)).toEqual([
      "actividades:INSERT",
      "asignaciones:INSERT",
      "asignaciones:UPDATE",
      "actividades:DELETE",
      "asignaciones:DELETE"
    ]);
    expect(r.rows[2].usuario_id).toBe(ID.ana);
    expect(r.rows[3].usuario_id).toBe(ID.profesor);
  });
});
