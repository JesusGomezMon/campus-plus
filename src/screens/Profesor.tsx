import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "../components/Shell";
import { ConfirmDialog, Datos, EstadoTag, Filtros, PillButton, Vacio, type Filtro } from "../components/ui";
import { GRUPO_COMPLETO, TUTORADOS, USUARIOS } from "../data/seed";
import type { Actividad } from "../data/types";
import { useStore, type NuevaActividad } from "../store";
import { fechaHora, fechaLarga, porFecha, primerNombre } from "../utils";
import NoEncontrado from "./NoEncontrado";

const PROF = USUARIOS.profesor;

/** Modal de confirmación para eliminar una actividad. */
function useEliminar(despues?: () => void) {
  const { eliminar, avisar } = useStore();
  const [objetivo, setObjetivo] = useState<Actividad | null>(null);
  const dialogo = objetivo && (
    <ConfirmDialog
      titulo="Eliminar actividad"
      mensaje={`Se eliminará “${objetivo.titulo}”. Esta acción no se puede deshacer.`}
      confirmar="Eliminar"
      onCancel={() => setObjetivo(null)}
      onConfirm={() => {
        eliminar(objetivo.id);
        setObjetivo(null);
        avisar("Actividad eliminada");
        despues?.();
      }}
    />
  );
  return { pedir: setObjetivo, dialogo };
}

export function DashProfesor() {
  const navigate = useNavigate();
  const { actividades } = useStore();
  const proximas = useMemo(
    () => actividades.filter((a) => a.estado !== "Terminada").sort(porFecha).slice(0, 3),
    [actividades]
  );

  return (
    <Screen title="Campus +">
      <p className="greeting">Hola, {primerNombre(PROF)}!</p>
      <section className="section">
        <h2 className="h-section center-text">Actividades próximas</h2>
        <div className="stack">
          {proximas.map((a) => (
            <PillButton key={a.id} titulo={a.titulo} subtitulo={fechaHora(a)} onClick={() => navigate(`/profesor/actividades/${a.id}`)} />
          ))}
          {proximas.length === 0 && <Vacio>No hay actividades próximas.</Vacio>}
        </div>
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
  const { actividades } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const { pedir, dialogo } = useEliminar();
  const lista = useMemo(
    () => actividades.filter((a) => filtro === "Todas" || a.estado === filtro).sort(porFecha),
    [actividades, filtro]
  );

  return (
    <Screen title="Actividades">
      <Filtros value={filtro} onChange={setFiltro} />
      <div className="list">
        {lista.map((a) => (
          <article key={a.id} className="card">
            <button type="button" className="card-link" onClick={() => navigate(`/profesor/actividades/${a.id}`)}>
              <span className="card-title">{a.titulo}</span>
              <span className="card-meta">{a.estudiante} · {fechaHora(a)}</span>
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
      {dialogo}
    </Screen>
  );
}

export function DetalleProfesor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtener } = useStore();
  const volver = () => navigate("/profesor/actividades");
  const { pedir, dialogo } = useEliminar(volver);
  const a = obtener(Number(id));
  if (!a) return <NoEncontrado volver="/profesor/actividades" />;

  return (
    <Screen title="Detalle de actividad">
      <div className="section">
        <EstadoTag estado={a.estado} className="self-start" />
        <h2 className="h-detail">{a.titulo}</h2>
        <p className="body-text">{a.descripcion || "Sin descripción."}</p>
      </div>
      <Datos
        items={[
          { label: "Estudiante", value: a.estudiante },
          { label: "Materia", value: a.materia },
          { label: "Fecha de entrega", value: fechaLarga(a.fecha) },
          { label: "Hora", value: a.hora || "—" }
        ]}
      />
      <div className="row-actions">
        <button type="button" className="btn btn-primary" onClick={() => navigate(`/profesor/actividades/${a.id}/editar`)}>Editar</button>
        <button type="button" className="btn btn-danger-outline" onClick={() => pedir(a)}>Eliminar</button>
      </div>
      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={volver}>Regresar</button>
      </div>
      {dialogo}
    </Screen>
  );
}

const VACIA: NuevaActividad = {
  titulo: "",
  descripcion: "",
  fecha: "",
  hora: "",
  estudiante: GRUPO_COMPLETO,
  materia: "",
  estado: "Pendiente",
  profesor: PROF
};

/** Registro (nueva) y edición de actividades. */
export function FormActividad() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtener, crear, actualizar, avisar } = useStore();
  const editando = id != null;
  const original = editando ? obtener(Number(id)) : undefined;

  const [form, setForm] = useState<NuevaActividad>(() => (original ? { ...original } : { ...VACIA }));
  const [errores, setErrores] = useState<{ titulo?: string; fecha?: string }>({});

  if (editando && !original) return <NoEncontrado volver="/profesor/actividades" />;

  const set = <K extends keyof NuevaActividad>(k: K, v: NuevaActividad[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k in errores) setErrores((e) => ({ ...e, [k]: undefined }));
  };

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errores = {};
    if (!form.titulo.trim()) err.titulo = "Escribe el nombre de la actividad.";
    if (!form.fecha) err.fecha = "Selecciona la fecha de entrega.";
    setErrores(err);
    if (Object.keys(err).length) return;

    const datos = { ...form, titulo: form.titulo.trim(), materia: form.materia.trim() || "General" };
    if (original) {
      actualizar(original.id, datos);
      avisar("Cambios guardados");
    } else {
      crear(datos);
      avisar("Actividad registrada");
    }
    navigate("/profesor/actividades");
  };

  return (
    <Screen title="Registro de actividades">
      <h2 className="h-section center-text">{editando ? "Editar actividad" : "Nueva Actividad"}</h2>
      <form className="form" onSubmit={guardar} noValidate>
        <div className="field">
          <label htmlFor="f-titulo">Nombre de actividad</label>
          <input
            id="f-titulo"
            type="text"
            className="input"
            value={form.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            aria-invalid={!!errores.titulo}
            aria-describedby={errores.titulo ? "e-titulo" : undefined}
            enterKeyHint="next"
          />
          {errores.titulo && <span id="e-titulo" className="field-error">{errores.titulo}</span>}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="f-fecha">Fecha</label>
            <input
              id="f-fecha"
              type="date"
              className="input"
              value={form.fecha}
              onChange={(e) => set("fecha", e.target.value)}
              aria-invalid={!!errores.fecha}
              aria-describedby={errores.fecha ? "e-fecha" : undefined}
            />
            {errores.fecha && <span id="e-fecha" className="field-error">{errores.fecha}</span>}
          </div>
          <div className="field">
            <label htmlFor="f-hora">Hora</label>
            <input id="f-hora" type="time" className="input" value={form.hora} onChange={(e) => set("hora", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-materia">Materia</label>
          <input id="f-materia" type="text" className="input" placeholder="General" value={form.materia} onChange={(e) => set("materia", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-desc">Descripción</label>
          <textarea id="f-desc" rows={4} className="input" value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-est">Estudiante</label>
          <select id="f-est" className="input" value={form.estudiante} onChange={(e) => set("estudiante", e.target.value)}>
            <option value={GRUPO_COMPLETO}>{GRUPO_COMPLETO}</option>
            {TUTORADOS.map((t) => (
              <option key={t.id} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>
        <div className="stack form-actions">
          <button type="submit" className="btn btn-primary btn-block">{editando ? "Guardar cambios" : "Guardar"}</button>
          <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/profesor/actividades")}>Regresar</button>
        </div>
      </form>
    </Screen>
  );
}
