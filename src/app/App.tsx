import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "../components/Shell";
import { Toast } from "../components/ui";
import Home from "../screens/Home";

/**
 * Las pantallas de cada rol se cargan solo cuando hacen falta (code splitting).
 * Así la primera carga baja únicamente el inicio de sesión, y no las pantallas
 * de los tres roles: un estudiante nunca descarga el formulario del profesor.
 */
const pantalla = <M extends Record<string, React.ComponentType>, K extends keyof M>(carga: () => Promise<M>, nombre: K) =>
  lazy(() => carga().then((m) => ({ default: m[nombre] })));

const cargaEstudiante = () => import("../screens/Estudiante");
const cargaProfesor = () => import("../screens/Profesor");
const cargaTutor = () => import("../screens/Tutor");

const DashEstudiante = pantalla(cargaEstudiante, "DashEstudiante");
const MisActividades = pantalla(cargaEstudiante, "MisActividades");
const DetalleActividad = pantalla(cargaEstudiante, "DetalleActividad");
const DashProfesor = pantalla(cargaProfesor, "DashProfesor");
const ActividadesProfesor = pantalla(cargaProfesor, "ActividadesProfesor");
const DetalleProfesor = pantalla(cargaProfesor, "DetalleProfesor");
const FormActividad = pantalla(cargaProfesor, "FormActividad");
const DashTutor = pantalla(cargaTutor, "DashTutor");
const Tutorados = pantalla(cargaTutor, "Tutorados");
const DetalleTutorado = pantalla(cargaTutor, "DetalleTutorado");

/** Vuelve al inicio de la página en cada cambio de pantalla. */
function ScrollArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Rutas de la aplicación (sin el enrutador, para poder probarlas con MemoryRouter). */
export function App() {
  return (
    <>
      <ScrollArriba />
      <Suspense fallback={<div className="app" aria-busy="true" />}>
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
      </Suspense>
      <Toast />
    </>
  );
}
