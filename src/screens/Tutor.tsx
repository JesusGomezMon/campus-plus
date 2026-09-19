import { useNavigate, useParams } from "react-router-dom";
import { useApp, useConsulta } from "../app/contexto";
import { Screen } from "../components/Shell";
import { ActividadResumen, ConDatos, Datos, PillButton, Vacio } from "../components/ui";
import { porFecha } from "../domain/reglas";
import { iniciales, primerNombre } from "../utils";
import NoEncontrado from "./NoEncontrado";

function useTutorados() {
  return useConsulta((repo, u) => repo.tutorados(u));
}

export function DashTutor() {
  const navigate = useNavigate();
  const { usuario } = useApp();
  const consulta = useTutorados();
  return (
    <Screen title="Campus +">
      <p className="greeting">Hola, {primerNombre(usuario?.nombre ?? "")}!</p>
      <section className="section">
        <h2 className="h-section center-text">Tus tutorados</h2>
        <ConDatos consulta={consulta}>
          {(lista) => (
            <div className="stack">
              {lista.map((t) => (
                <PillButton key={t.id} titulo={t.nombre} subtitulo={t.matricula} onClick={() => navigate(`/tutor/tutorados/${t.id}`)} />
              ))}
              {lista.length === 0 && <Vacio>Aún no tienes tutorados asignados.</Vacio>}
            </div>
          )}
        </ConDatos>
      </section>
    </Screen>
  );
}

export function Tutorados() {
  const navigate = useNavigate();
  const consulta = useTutorados();
  return (
    <Screen title="Tutorados">
      <ConDatos consulta={consulta}>
        {(lista) => (
          <>
            <p className="muted center-text">{lista.length} estudiantes asignados en el periodo actual</p>
            <div className="list">
              {lista.map((t) => (
                <button key={t.id} type="button" className="card card-btn card-row" onClick={() => navigate(`/tutor/tutorados/${t.id}`)}>
                  <span className="avatar" aria-hidden="true">{iniciales(t.nombre)}</span>
                  <span className="card-col">
                    <span className="card-title">{t.nombre}</span>
                    <span className="card-meta small">{t.matricula} · {t.programa}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </ConDatos>
    </Screen>
  );
}

export function DetalleTutorado() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const tutorados = useTutorados();
  const esMio = tutorados.datos?.some((t) => t.id === id);
  // El repositorio valida que el estudiante sea tutorado de este tutor (RLS en Supabase).
  const actividades = useConsulta(async (repo, u) => (await repo.actividadesDeTutorado(u, id)).sort(porFecha), [id]);

  if (tutorados.datos && !esMio) return <NoEncontrado volver="/tutor/tutorados" />;

  return (
    <Screen title="Información del tutorado">
      <ConDatos consulta={tutorados}>
        {(lista) => {
          const t = lista.find((x) => x.id === id)!;
          return (
            <>
              <h2 className="h-detail">{t.nombre}</h2>
              <ConDatos consulta={actividades}>
                {(acts) => (
                  <>
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
                  </>
                )}
              </ConDatos>
            </>
          );
        }}
      </ConDatos>
      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/tutor/tutorados")}>Regresar</button>
      </div>
    </Screen>
  );
}
