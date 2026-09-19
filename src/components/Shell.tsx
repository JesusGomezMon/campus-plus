import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { USUARIOS } from "../data/seed";
import type { Rol } from "../data/types";

const TABS: Record<Rol, { label: string; to: string; end?: boolean; aria?: string }[]> = {
  estudiante: [
    { label: "Inicio", to: "/estudiante", end: true },
    { label: "Actividades", to: "/estudiante/actividades" }
  ],
  profesor: [
    { label: "Inicio", to: "/profesor", end: true },
    { label: "Actividades", to: "/profesor/actividades", end: true },
    { label: "+", to: "/profesor/actividades/nueva", aria: "Registrar actividad" }
  ],
  tutor: [
    { label: "Inicio", to: "/tutor", end: true },
    { label: "Tutorados", to: "/tutor/tutorados" }
  ]
};

/** Estructura común de los perfiles: usuario arriba, contenido y barra inferior. */
export function Shell({ rol }: { rol: Rol }) {
  const navigate = useNavigate();
  return (
    <div className="app">
      <div className="userbar">
        <span>{USUARIOS[rol]}</span>
        <button type="button" className="link-btn" onClick={() => navigate("/")}>
          Cambiar perfil
        </button>
      </div>
      <Outlet />
      <nav className="bottom-nav" aria-label="Navegación principal">
        <div className="bottom-nav-inner">
          {TABS[rol].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              aria-label={t.aria}
              className={({ isActive }) => "tab" + (isActive ? " is-active" : "") + (t.label === "+" ? " tab-plus" : "")}
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Banda de título + contenido de la pantalla. */
export function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <header className="title-band">
        <h1>{title}</h1>
      </header>
      <main className="screen">{children}</main>
    </>
  );
}
