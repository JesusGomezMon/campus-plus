import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "../components/Shell";
import { ActividadResumen, Datos, EstadoTag, Filtros, PillButton, Vacio, type Filtro } from "../components/ui";
import { ESTADOS, GRUPO_COMPLETO, USUARIOS } from "../data/seed";
import type { Estado } from "../data/types";
import { useStore } from "../store";
import { fechaHora, fechaLarga, porFecha, primerNombre } from "../utils";
import NoEncontrado from "./NoEncontrado";

const YO = USUARIOS.estudiante;

function useMisActividades() {
  const { actividades } = useStore();
  return useMemo(
    () => actividades.filter((a) => a.estudiante === YO || a.estudiante === GRUPO_COMPLETO).sort(porFecha),
    [actividades]
  );
}

export function DashEstudiante() {
  const navigate = useNavigate();
  const mias = useMisActividades();
  const proximas = mias.filter((a) => a.estado !== "Terminada").slice(0, 3);
  const cuenta = (e: Estado) => mias.filter((a) => a.estado === e).length;

  return (
    <Screen title="Campus +">
      <p className="greeting">Hola, {primerNombre(YO)}!</p>
      <section className="section">
        <h2 className="h-section center-text">Próximas actividades</h2>
        <div className="stack">
          {proximas.map((a) => (
            <PillButton key={a.id} titulo={a.titulo} subtitulo={fechaHora(a)} onClick={() => navigate(`/estudiante/actividades/${a.id}`)} />
          ))}
          {proximas.length === 0 && <Vacio>No tienes actividades pendientes. ¡Bien hecho!</Vacio>}
        </div>
      </section>
      <div className="stats">
        <div className="stat"><span>Pendientes</span><strong className="c-gold">{cuenta("Pendiente")}</strong></div>
        <div className="stat"><span>En proceso</span><strong className="c-green">{cuenta("En proceso")}</strong></div>
        <div className="stat"><span>Terminadas</span><strong>{cuenta("Terminada")}</strong></div>
      </div>
    </Screen>
  );
}

export function MisActividades() {
  const navigate = useNavigate();
  const mias = useMisActividades();
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const lista = mias.filter((a) => filtro === "Todas" || a.estado === filtro);

  return (
    <Screen title="Mis actividades">
      <Filtros value={filtro} onChange={setFiltro} />
      <div className="list">
        {lista.map((a) => (
          <button key={a.id} type="button" className="card card-btn" onClick={() => navigate(`/estudiante/actividades/${a.id}`)}>
            <ActividadResumen a={a} />
          </button>
        ))}
      </div>
      {lista.length === 0 && <Vacio>No hay actividades con este estado.</Vacio>}
    </Screen>
  );
}

export function DetalleActividad() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtener, cambiarEstado, avisar } = useStore();
  const a = obtener(Number(id));
  if (!a) return <NoEncontrado volver="/estudiante/actividades" />;

  return (
    <Screen title="Detalle de actividad">
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
          { label: "Profesor", value: a.profesor }
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
              className={"btn btn-block btn-option" + (a.estado === e ? " is-on" : "")}
              onClick={() => {
                if (a.estado === e) return;
                cambiarEstado(a.id, e);
                avisar(`Estado cambiado a “${e}”`);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </section>
      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate("/estudiante/actividades")}>
          Regresar
        </button>
      </div>
    </Screen>
  );
}
