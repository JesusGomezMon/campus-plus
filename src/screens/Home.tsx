import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../app/contexto";
import { ConfirmDialog } from "../components/ui";
import { MemoriaRepo } from "../data/memoriaRepo";
import type { Rol } from "../domain/tipos";
import { ErrorDominio } from "../domain/tipos";
import { usePwaInstall } from "../usePwaInstall";

const PERFILES: { rol: Rol; label: string; desc: string }[] = [
  { rol: "estudiante", label: "Estudiante", desc: "Consulta y actualiza sus actividades" },
  { rol: "profesor", label: "Profesor", desc: "Registra, edita y elimina actividades" },
  { rol: "tutor", label: "Tutor", desc: "Consulta a sus tutorados" }
];

/** Pantalla de entrada: inicio de sesión (Supabase) o selección de perfil (modo demostración). */
export default function Home() {
  const { repo, usuario, cargandoSesion } = useApp();
  const { puedeInstalar, mostrarAyudaIOS, instalar } = usePwaInstall();

  if (!cargandoSesion && usuario) return <Navigate to={`/${usuario.rol}`} replace />;

  return (
    <div className="app app-home">
      <div className="userbar">
        <span>Campus + · UAEQROO</span>
      </div>
      <header className="title-band">
        <h1>Campus +</h1>
      </header>
      <main className="screen">
        {repo.modo === "supabase" ? <Login /> : <SeleccionDemo />}

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
        </div>
      </main>
    </div>
  );
}

function Login() {
  const { entrar } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Escribe tu correo y contraseña.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const u = await entrar({ email, password });
      navigate(`/${u.rol}`, { replace: true });
    } catch (err) {
      setError(err instanceof ErrorDominio ? err.message : "No se pudo iniciar sesión.");
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="center-text">
        <h2 className="h-section">Iniciar sesión</h2>
        <p className="muted">Usa tu cuenta institucional</p>
      </div>
      <form className="form form-narrow" onSubmit={enviar} noValidate>
        <div className="field">
          <label htmlFor="l-email">Correo</label>
          <input id="l-email" type="email" className="input" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="l-pass">Contraseña</label>
          <input id="l-pass" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="stack">
          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </form>
    </>
  );
}

function SeleccionDemo() {
  const { repo, entrar, avisar } = useApp();
  const navigate = useNavigate();
  const [confirmar, setConfirmar] = useState(false);

  return (
    <>
      <div className="center-text">
        <h2 className="h-section">Selecciona tu perfil</h2>
        <p className="muted">Modo demostración · los datos se guardan en este dispositivo</p>
      </div>
      <div className="stack">
        {PERFILES.map((p) => (
          <button
            key={p.rol}
            type="button"
            className="pill pill-lg"
            onClick={async () => {
              await entrar({ rol: p.rol });
              navigate(`/${p.rol}`);
            }}
          >
            <span className="pill-title">{p.label}</span>
            <span className="pill-sub">{p.desc}</span>
          </button>
        ))}
      </div>
      <div className="center-text">
        <button type="button" className="link-btn" onClick={() => setConfirmar(true)}>
          Restablecer datos de demostración
        </button>
      </div>
      {confirmar && (
        <ConfirmDialog
          titulo="Restablecer datos"
          mensaje="Se borrarán los cambios hechos en este dispositivo y se cargarán las actividades de ejemplo."
          confirmar="Restablecer"
          onCancel={() => setConfirmar(false)}
          onConfirm={() => {
            if (repo instanceof MemoriaRepo) repo.restablecer();
            setConfirmar(false);
            avisar("Datos restablecidos");
          }}
        />
      )}
    </>
  );
}
