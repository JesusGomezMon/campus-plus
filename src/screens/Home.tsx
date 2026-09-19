import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ui";
import { useStore } from "../store";
import { usePwaInstall } from "../usePwaInstall";

const PERFILES = [
  { label: "Estudiante", desc: "Consulta y actualiza sus actividades", to: "/estudiante" },
  { label: "Profesor", desc: "Registra, edita y elimina actividades", to: "/profesor" },
  { label: "Tutor", desc: "Consulta a sus tutorados", to: "/tutor" }
];

export default function Home() {
  const navigate = useNavigate();
  const { restablecer, avisar } = useStore();
  const { puedeInstalar, mostrarAyudaIOS, instalar } = usePwaInstall();
  const [confirmar, setConfirmar] = useState(false);

  return (
    <div className="app app-home">
      <div className="userbar">
        <span>Campus + · UAEQROO</span>
      </div>
      <header className="title-band">
        <h1>Campus +</h1>
      </header>
      <main className="screen">
        <div className="center-text">
          <h2 className="h-section">Selecciona tu perfil</h2>
          <p className="muted">Prototipo de demostración · Versión 1</p>
        </div>
        <div className="stack">
          {PERFILES.map((p) => (
            <button key={p.to} type="button" className="pill pill-lg" onClick={() => navigate(p.to)}>
              <span className="pill-title">{p.label}</span>
              <span className="pill-sub">{p.desc}</span>
            </button>
          ))}
        </div>

        <div className="home-footer">
          {puedeInstalar && (
            <button type="button" className="btn btn-secondary" onClick={instalar}>
              Instalar aplicación
            </button>
          )}
          {mostrarAyudaIOS && (
            <p className="muted small center-text">
              Para instalar en iPhone o iPad: toca <strong>Compartir</strong> y luego <strong>Agregar a inicio</strong>.
            </p>
          )}
          <button type="button" className="link-btn" onClick={() => setConfirmar(true)}>
            Restablecer datos de demostración
          </button>
        </div>
      </main>

      {confirmar && (
        <ConfirmDialog
          titulo="Restablecer datos"
          mensaje="Se borrarán los cambios hechos en este dispositivo y se cargarán las actividades de ejemplo."
          confirmar="Restablecer"
          onCancel={() => setConfirmar(false)}
          onConfirm={() => {
            restablecer();
            setConfirmar(false);
            avisar("Datos restablecidos");
          }}
        />
      )}
    </div>
  );
}
