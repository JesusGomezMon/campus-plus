import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../app/contexto";
import type { Rol } from "../domain/tipos";

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

/**
 * Estructura común de los perfiles: usuario arriba, contenido y barra inferior.
 * También protege las rutas: solo entra quien tiene sesión con el rol correspondiente.
 */
export function Shell({ rol }: { rol: Rol }) {
  const navigate = useNavigate();
  const { usuario, cargandoSesion, salir } = useApp();

  if (cargandoSesion) return <div className="app" aria-busy="true" />;
  if (!usuario) return <Navigate to="/" replace />;
  if (usuario.rol !== rol) return <Navigate to={`/${usuario.rol}`} replace />;

  return (
    <div className="app">
      <div className="userbar">
        <span>{usuario.nombre}</span>
        <button
          type="button"
          className="link-btn"
          onClick={async () => {
            await salir();
            navigate("/", { replace: true });
          }}
        >
          Cerrar sesión
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
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="title-band">
        <h1>{title}</h1>
      </header>
      <main className="screen">{children}</main>
    </>
  );
}
