import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, useConsulta } from "../app/contexto";
import { Screen } from "../components/Shell";
import { ConDatos, ConfirmDialog, Datos, EstadoTag, Filtros, PillButton, Vacio, type Filtro } from "../components/ui";
import { avance, estadoGlobal, LIMITES, porFecha, validarActividad, type ErroresActividad } from "../domain/reglas";
import type { ActividadInput, ActividadProfesor, Estudiante } from "../domain/tipos";
import { fechaHora, fechaLarga, primerNombre } from "../utils";
import NoEncontrado from "./NoEncontrado";

function useActividadesProfesor() {
  return useConsulta(async (repo, u) =>
    (await repo.actividadesProfesor(u)).sort(porFecha).map((a) => ({ ...a, estado: estadoGlobal(a.asignaciones) }))
  );
}

function destinatario(a: ActividadProfesor): string {
  if (a.paraGrupo) {
    const { terminadas, total } = avance(a.asignaciones);
    return `Grupo completo · ${terminadas}/${total} terminadas`;
  }
  return a.asignaciones[0]?.estudianteNombre ?? "Sin asignar";
}

/** Modal de confirmación para eliminar una actividad. */
function useEliminar(despues?: () => void) {
  const { repo, mutar } = useApp();
  const [objetivo, setObjetivo] = useState<ActividadProfesor | null>(null);
  const dialogo = objetivo && (
    <ConfirmDialog
      titulo="Eliminar actividad"
      mensaje={`Se eliminará “${objetivo.titulo}”. Esta acción no se puede deshacer.`}
      confirmar="Eliminar"
      onCancel={() => setObjetivo(null)}
      onConfirm={async () => {
        const id = objetivo.id;
        setObjetivo(null);
        try {
          await mutar((u) => repo.eliminarActividad(u, id), "Actividad eliminada");
          despues?.();
        } catch {
          /* aviso ya mostrado */
        }
      }}
    />
  );
  return { pedir: setObjetivo, dialogo };
}

export function DashProfesor() {
  const navigate = useNavigate();
  const { usuario } = useApp();
  const consulta = useActividadesProfesor();

  return (
    <Screen title="Campus +">
      <p className="greeting">Hola, {primerNombre(usuario?.nombre ?? "")}!</p>
      <section className="section">
        <h2 className="h-section center-text">Actividades próximas</h2>
        <ConDatos consulta={consulta}>
          {(lista) => {
            const prox = lista.filter((a) => a.estado !== "Terminada").slice(0, 3);
            return (
              <div className="stack">
                {prox.map((a) => (
                  <PillButton key={a.id} titulo={a.titulo} subtitulo={fechaHora(a)} onClick={() => navigate(`/profesor/actividades/${a.id}`)} />
                ))}
                {prox.length === 0 && <Vacio>No hay actividades próximas.</Vacio>}
              </div>
            );
          }}
        </ConDatos>
      </section>
      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/profesor/actividades/nueva")}>
          Registra actividad
        </button>
      </div>
    </Screen>
  );
}

export function ActividadesProfesor() {
  const navigate = useNavigate();
  const consulta = useActividadesProfesor();
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const { pedir, dialogo } = useEliminar();

  return (
    <Screen title="Actividades">
      <Filtros value={filtro} onChange={setFiltro} />
      <ConDatos consulta={consulta}>
        {(todas) => {
          const lista = todas.filter((a) => filtro === "Todas" || a.estado === filtro);
          return (
            <>
              <div className="list">
                {lista.map((a) => (
                  <article key={a.id} className="card">
                    <button type="button" className="card-link" onClick={() => navigate(`/profesor/actividades/${a.id}`)}>
                      <span className="card-title">{a.titulo}</span>
                      <span className="card-meta">{destinatario(a)}</span>
                      <span className="card-meta">{fechaHora(a)}</span>
                    </button>
                    <EstadoTag estado={a.estado} className="self-start" />
                    <div className="row-actions">
                      <button type="button" className="btn btn-primary" onClick={() => navigate(`/profesor/actividades/${a.id}/editar`)}>Editar</button>
                      <button type="button" className="btn btn-danger-outline" onClick={() => pedir(a)}>Eliminar</button>
                    </div>
                  </article>
                ))}
              </div>
              {lista.length === 0 && <Vacio>No hay actividades con este estado.</Vacio>}
            </>
          );
        }}
      </ConDatos>
      {dialogo}
    </Screen>
  );
}

export function DetalleProfesor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const consulta = useActividadesProfesor();
  const volver = () => navigate("/profesor/actividades");
  const { pedir, dialogo } = useEliminar(volver);

  if (consulta.datos && !consulta.datos.some((a) => a.id === Number(id))) return <NoEncontrado volver="/profesor/actividades" />;

  return (
    <Screen title="Detalle de actividad">
      <ConDatos consulta={consulta}>
        {(lista) => {
          const a = lista.find((x) => x.id === Number(id))!;
          return (
            <>
              <div className="section">
                <EstadoTag estado={a.estado} className="self-start" />
                <h2 className="h-detail">{a.titulo}</h2>
                <p className="body-text">{a.descripcion || "Sin descripción."}</p>
              </div>
              <Datos
                items={[
                  { label: "Destinatario", value: a.paraGrupo ? "Grupo completo" : a.asignaciones[0]?.estudianteNombre ?? "—" },
                  { label: "Materia", value: a.materia },
                  { label: "Fecha de entrega", value: fechaLarga(a.fecha) },
                  { label: "Hora", value: a.hora || "—" }
                ]}
              />
              <section className="section">
                <h3 className="h-sub">Avance por estudiante</h3>
                <Datos items={a.asignaciones.map((s) => ({ label: s.estudianteNombre, value: <EstadoTag estado={s.estado} /> }))} />
              </section>
              <div className="row-actions">
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/profesor/actividades/${a.id}/editar`)}>Editar</button>
                <button type="button" className="btn btn-danger-outline" onClick={() => pedir(a)}>Eliminar</button>
              </div>
            </>
          );
        }}
      </ConDatos>
      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={volver}>Regresar</button>
      </div>
      {dialogo}
    </Screen>
  );
}

const VACIA: ActividadInput = { titulo: "", descripcion: "", materia: "", fecha: "", hora: "", estudianteId: null };

/** Registro (nueva) y edición de actividades. */
export function FormActividad() {
  const { id } = useParams();
  const editando = id != null;
  const actividades = useActividadesProfesor();
  const estudiantes = useConsulta((repo, u) => repo.estudiantes(u));

  if (editando && actividades.datos && !actividades.datos.some((a) => a.id === Number(id))) {
    return <NoEncontrado volver="/profesor/actividades" />;
  }

  return (
    <Screen title="Registro de actividades">
      <h2 className="h-section center-text">{editando ? "Editar actividad" : "Nueva Actividad"}</h2>
      <ConDatos consulta={estudiantes}>
        {(ests) =>
          editando ? (
            <ConDatos consulta={actividades}>
              {(lista) => {
                const a = lista.find((x) => x.id === Number(id))!;
                return (
                  <Formulario
                    id={a.id}
                    estudiantes={ests}
                    inicial={{
                      titulo: a.titulo,
                      descripcion: a.descripcion,
                      materia: a.materia,
                      fecha: a.fecha,
                      hora: a.hora,
                      estudianteId: a.paraGrupo ? null : a.asignaciones[0]?.estudianteId ?? null
                    }}
                  />
                );
              }}
            </ConDatos>
          ) : (
            <Formulario estudiantes={ests} inicial={VACIA} />
          )
        }
      </ConDatos>
    </Screen>
  );
}

function Formulario({ id, inicial, estudiantes }: { id?: number; inicial: ActividadInput; estudiantes: Estudiante[] }) {
  const navigate = useNavigate();
  const { repo, mutar } = useApp();
  const [form, setForm] = useState<ActividadInput>(inicial);
  const [errores, setErrores] = useState<ErroresActividad>({});
  const [enviando, setEnviando] = useState(false);

  const set = <K extends keyof ActividadInput>(k: K, v: ActividadInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k in errores) setErrores((e) => ({ ...e, [k]: undefined }));
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const err = validarActividad(form);
    setErrores(err);
    if (Object.keys(err).length) return;
    setEnviando(true);
    try {
      await mutar((u) => repo.guardarActividad(u, form, id), id ? "Cambios guardados" : "Actividad registrada");
      navigate("/profesor/actividades");
    } catch {
      setEnviando(false);
    }
  };

  const err = (k: keyof ErroresActividad) =>
    errores[k] ? (
      <span id={`e-${k}`} className="field-error">
        {errores[k]}
      </span>
    ) : null;
  const aria = (k: keyof ErroresActividad) => ({ "aria-invalid": !!errores[k], "aria-describedby": errores[k] ? `e-${k}` : undefined });

  return (
    <form className="form" onSubmit={guardar} noValidate>
      <div className="field">
        <label htmlFor="f-titulo">Nombre de actividad</label>
        <input id="f-titulo" type="text" className="input" maxLength={LIMITES.titulo} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} enterKeyHint="next" {...aria("titulo")} />
        {err("titulo")}
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="f-fecha">Fecha</label>
          <input id="f-fecha" type="date" className="input" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} {...aria("fecha")} />
          {err("fecha")}
        </div>
        <div className="field">
          <label htmlFor="f-hora">Hora</label>
          <input id="f-hora" type="time" className="input" value={form.hora} onChange={(e) => set("hora", e.target.value)} {...aria("hora")} />
          {err("hora")}
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-materia">Materia</label>
        <input id="f-materia" type="text" className="input" placeholder="General" maxLength={LIMITES.materia} value={form.materia} onChange={(e) => set("materia", e.target.value)} {...aria("materia")} />
        {err("materia")}
      </div>
      <div className="field">
        <label htmlFor="f-desc">Descripción</label>
        <textarea id="f-desc" rows={4} className="input" maxLength={LIMITES.descripcion} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} {...aria("descripcion")} />
        {err("descripcion")}
      </div>
      <div className="field">
        <label htmlFor="f-est">Estudiante</label>
        <select id="f-est" className="input" value={form.estudianteId ?? ""} onChange={(e) => set("estudianteId", e.target.value || null)}>
          <option value="">Grupo completo</option>
          {estudiantes.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>
      <div className="stack form-actions">
        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? "Guardando…" : id ? "Guardar cambios" : "Guardar"}
        </button>
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/profesor/actividades")}>Regresar</button>
      </div>
    </form>
  );
}
