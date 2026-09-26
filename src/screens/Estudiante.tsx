import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, useConsulta } from "../app/contexto";
import { Screen } from "../components/Shell";
import { ActividadResumen, ConDatos, Datos, EstadoTag, Filtros, Leyenda, PillButton, Vacio, VencidaTag, useFiltro } from "../components/ui";
import { contarPorEstado, proximas } from "../domain/reglas";
import { TAM_PAGINA } from "../data/repositorio";
import { ESTADOS } from "../domain/tipos";
import { fechaHora, fechaLarga, primerNombre } from "../utils";
import NoEncontrado from "./NoEncontrado";

/** El servidor ya devuelve las actividades ordenadas y recortadas al límite pedido. */
function useMisActividades(limite?: number) {
  return useConsulta((repo, u) => repo.misActividades(u, limite), [limite]);
}

export function DashEstudiante() {
  const navigate = useNavigate();
  const { usuario } = useApp();
  const consulta = useMisActividades();

  return (
    <Screen title="Campus +">
      <p className="greeting">Hola, {primerNombre(usuario?.nombre ?? "")}!</p>
      <ConDatos consulta={consulta}>
        {(mias) => {
          const prox = proximas(mias);
          const c = contarPorEstado(mias);
          return (
            <>
              <section className="section">
                <h2 className="h-section center-text">Próximas actividades</h2>
                <div className="stack">
                  {prox.map((a) => (
                    <PillButton key={a.id} titulo={a.titulo} subtitulo={fechaHora(a)} onClick={() => navigate(`/estudiante/actividades/${a.id}`)} />
                  ))}
                  {prox.length === 0 && <Vacio>No tienes actividades pendientes. ¡Bien hecho!</Vacio>}
                </div>
              </section>
              <div className="stats">
                <div className="stat"><span>Pendientes</span><strong className="c-gold">{c.Pendiente}</strong></div>
                <div className="stat"><span>En proceso</span><strong className="c-green">{c["En proceso"]}</strong></div>
                <div className="stat"><span>Terminadas</span><strong>{c.Terminada}</strong></div>
              </div>
            </>
          );
        }}
      </ConDatos>
    </Screen>
  );
}

export function MisActividades() {
  const navigate = useNavigate();
  const [limite, setLimite] = useState(TAM_PAGINA);
  const consulta = useMisActividades(limite);
  const [filtro, setFiltro] = useFiltro();

  return (
    <Screen title="Mis actividades">
      <Filtros value={filtro} onChange={setFiltro} />
      <ConDatos consulta={consulta}>
        {(mias) => {
          const lista = mias.filter((a) => filtro === "Todas" || a.estado === filtro);
          return (
            <>
              <Leyenda visibles={lista.length} filtro={filtro} />
              <div className="list">
                {lista.map((a) => (
                  <button key={a.id} type="button" className="card card-btn" onClick={() => navigate(`/estudiante/actividades/${a.id}`)}>
                    <ActividadResumen a={a} />
                    <VencidaTag a={a} />
                  </button>
                ))}
              </div>
              {lista.length === 0 && <Vacio>No hay actividades con este estado.</Vacio>}
              {mias.hayMas && (
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setLimite((n) => n + TAM_PAGINA)}>
                  Mostrar más actividades
                </button>
              )}
            </>
          );
        }}
      </ConDatos>
    </Screen>
  );
}

export function DetalleActividad() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { repo, mutar } = useApp();
  const consulta = useMisActividades();
  const [guardando, setGuardando] = useState(false);

  if (consulta.datos && !consulta.datos.some((a) => a.id === Number(id))) return <NoEncontrado volver="/estudiante/actividades" />;

  return (
    <Screen title="Detalle de actividad">
      <ConDatos consulta={consulta}>
        {(mias) => {
          const a = mias.find((x) => x.id === Number(id))!;
          return (
            <>
              <div className="section">
                <EstadoTag estado={a.estado} className="self-start" />
                <h2 className="h-detail">{a.titulo}</h2>
                <p className="body-text">{a.descripcion || "Sin descripción."}</p>
              </div>
              <Datos
                items={[
                  { label: "Materia", value: a.materia },
                  { label: "Fecha de entrega", value: fechaLarga(a.fecha) },
                  { label: "Hora", value: a.hora || "—" },
                  { label: "Profesor", value: a.profesorNombre }
                ]}
              />
              <section className="section">
                <h3 className="h-sub">Cambiar estado</h3>
                <div className="stack">
                  {ESTADOS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      aria-pressed={a.estado === e}
                      disabled={guardando}
                      className={"btn btn-block btn-option" + (a.estado === e ? " is-on" : "")}
                      onClick={async () => {
                        if (a.estado === e) return;
                        setGuardando(true);
                        try {
                          await mutar((u) => repo.cambiarEstado(u, a.id, e), `Estado cambiado a “${e}”`);
                        } catch {
                          /* el aviso de error ya se mostró */
                        } finally {
                          setGuardando(false);
                        }
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </section>
            </>
          );
        }}
      </ConDatos>
      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/estudiante/actividades")}>
          Regresar
        </button>
      </div>
    </Screen>
  );
}
