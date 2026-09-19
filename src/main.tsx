import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Toast } from "./components/ui";
import { StoreProvider } from "./store";
import Home from "./screens/Home";
import { DashEstudiante, DetalleActividad, MisActividades } from "./screens/Estudiante";
import { ActividadesProfesor, DashProfesor, DetalleProfesor, FormActividad } from "./screens/Profesor";
import { DashTutor, DetalleTutorado, Tutorados } from "./screens/Tutor";
import "./styles.css";

/** Vuelve al inicio de la página en cada cambio de pantalla. */
function ScrollArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollArriba />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/estudiante" element={<Shell rol="estudiante" />}>
          <Route index element={<DashEstudiante />} />
          <Route path="actividades" element={<MisActividades />} />
          <Route path="actividades/:id" element={<DetalleActividad />} />
        </Route>

        <Route path="/profesor" element={<Shell rol="profesor" />}>
          <Route index element={<DashProfesor />} />
          <Route path="actividades" element={<ActividadesProfesor />} />
          <Route path="actividades/nueva" element={<FormActividad key="nueva" />} />
          <Route path="actividades/:id" element={<DetalleProfesor />} />
          <Route path="actividades/:id/editar" element={<FormActividad key="editar" />} />
        </Route>

        <Route path="/tutor" element={<Shell rol="tutor" />}>
          <Route index element={<DashTutor />} />
          <Route path="tutorados" element={<Tutorados />} />
          <Route path="tutorados/:id" element={<DetalleTutorado />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
);
