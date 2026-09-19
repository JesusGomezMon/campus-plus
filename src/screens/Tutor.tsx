import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "../components/Shell";
import { ActividadResumen, Datos, PillButton, Vacio } from "../components/ui";
import { GRUPO_COMPLETO, TUTORADOS, USUARIOS } from "../data/seed";
import { useStore } from "../store";
import { iniciales, porFecha, primerNombre } from "../utils";
import NoEncontrado from "./NoEncontrado";

export function DashTutor() {
  const navigate = useNavigate();
  return (
    <Screen title="Campus +">
      <p className="greeting">Hola, {primerNombre(USUARIOS.tutor)}!</p>
      <section className="section">
        <h2 className="h-section center-text">Tus tutorados</h2>
        <div className="stack">
          {TUTORADOS.map((t) => (
            <PillButton key={t.id} titulo={t.nombre} subtitulo={t.matricula} onClick={() => navigate(`/tutor/tutorados/${t.id}`)} />
          ))}
        </div>
      </section>
    </Screen>
  );
}

export function Tutorados() {
  const navigate = useNavigate();
  return (
    <Screen title="Tutorados">
      <p className="muted center-text">{TUTORADOS.length} estudiantes asignados en el periodo actual</p>
      <div className="list">
        {TUTORADOS.map((t) => (
          <button key={t.id} type="button" className="card card-btn card-row" onClick={() => navigate(`/tutor/tutorados/${t.id}`)}>
            <span className="avatar" aria-hidden="true">{iniciales(t.nombre)}</span>
            <span className="card-col">
              <span className="card-title">{t.nombre}</span>
              <span className="card-meta small">{t.matricula} · {t.programa}</span>
            </span>
          </button>
        ))}
      </div>
    </Screen>
  );
}

export function DetalleTutorado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { actividades } = useStore();
  const t = TUTORADOS.find((x) => x.id === Number(id));
  if (!t) return <NoEncontrado volver="/tutor/tutorados" />;
  const acts = actividades.filter((a) => a.estudiante === t.nombre || a.estudiante === GRUPO_COMPLETO).sort(porFecha);

  return (
    <Screen title="Información del tutorado">
      <h2 className="h-detail">{t.nombre}</h2>
      <Datos
        items={[
          { label: "Matrícula", value: t.matricula },
          { label: "Programa", value: t.programa },
          { label: "Actividades asignadas", value: acts.length }
        ]}
      />
      <section className="section">
        <h3 className="h-sub">Actividades asignadas</h3>
        <div className="list">
          {acts.map((a) => (
            <div key={a.id} className="card">
              <ActividadResumen a={a} />
            </div>
          ))}
        </div>
        {acts.length === 0 && <Vacio>Sin actividades asignadas.</Vacio>}
      </section>
      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/tutor/tutorados")}>Regresar</button>
      </div>
    </Screen>
  );
}
