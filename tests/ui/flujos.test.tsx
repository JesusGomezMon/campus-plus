// @vitest-environment jsdom
/**
 * Pruebas de integración de la interfaz: se monta la app completa (rutas, contexto,
 * pantallas) con el adaptador de demostración y se recorre como lo haría un usuario.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { AppProvider } from "../../src/app/contexto";
import { MemoriaRepo } from "../../src/data/memoriaRepo";
import type { Repositorio } from "../../src/data/repositorio";
import { ErrorDominio } from "../../src/domain/tipos";

beforeAll(() => {
  window.scrollTo = () => {};
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});

function almacen() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

function montar(ruta = "/", repo: Repositorio = new MemoriaRepo(almacen())) {
  const user = userEvent.setup();
  render(
    <AppProvider repo={repo}>
      <MemoryRouter initialEntries={[ruta]}>
        <App />
      </MemoryRouter>
    </AppProvider>
  );
  return { user, repo };
}

describe("Acceso y navegación", () => {
  it("muestra la selección de perfil en modo demostración", async () => {
    montar();
    expect(await screen.findByRole("heading", { name: "Selecciona tu perfil" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Estudiante/ })).toBeInTheDocument();
  });

  it("protege las rutas: sin sesión redirige al inicio", async () => {
    montar("/profesor/actividades");
    expect(await screen.findByRole("heading", { name: "Selecciona tu perfil" })).toBeInTheDocument();
  });

  it("un estudiante no puede abrir pantallas de profesor", async () => {
    const repo = new MemoriaRepo(almacen());
    await repo.iniciarSesion({ rol: "estudiante" });
    montar("/profesor/actividades/nueva", repo);
    expect(await screen.findByText("Hola, Ana!")).toBeInTheDocument();
  });

  it("cerrar sesión regresa al inicio", async () => {
    const { user } = montar();
    await user.click(await screen.findByRole("button", { name: /Tutor/ }));
    await user.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("heading", { name: "Selecciona tu perfil" })).toBeInTheDocument();
  });
});

describe("Flujo del estudiante", () => {
  it("ve próximas actividades, entra al detalle y cambia el estado", async () => {
    const { user } = montar();
    await user.click(await screen.findByRole("button", { name: /Estudiante/ }));
    expect(await screen.findByText("Hola, Ana!")).toBeInTheDocument();

    const proximas = screen.getAllByRole("button").filter((b) => b.classList.contains("pill"));
    expect(proximas.map((b) => within(b).getAllByText(/./)[0].textContent)).toEqual([
      "Ejercicio de Matemáticas",
      "Ejercicio de Programación",
      "Ejercicio de Física"
    ]);

    await user.click(proximas[0]);
    expect(await screen.findByRole("heading", { name: "Ejercicio de Matemáticas" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Terminada" }));
    expect(await screen.findByText("Estado cambiado a “Terminada”")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terminada" })).toHaveAttribute("aria-pressed", "true");
  });

  it("filtra sus actividades por estado", async () => {
    const repo = new MemoriaRepo(almacen());
    await repo.iniciarSesion({ rol: "estudiante" });
    const { user } = montar("/estudiante/actividades", repo);
    await screen.findByText("Cuestionario unidad 1");
    await user.click(screen.getByRole("button", { name: "Terminada" }));
    expect(screen.getByText("Cuestionario unidad 1")).toBeInTheDocument();
    expect(screen.queryByText("Ejercicio de Física")).not.toBeInTheDocument();
  });

  it("muestra 'No encontrado' para una actividad inexistente", async () => {
    const repo = new MemoriaRepo(almacen());
    await repo.iniciarSesion({ rol: "estudiante" });
    montar("/estudiante/actividades/999", repo);
    expect(await screen.findByRole("heading", { name: "No encontrado" })).toBeInTheDocument();
  });
});

describe("Flujo del profesor", () => {
  it("valida el formulario, registra, edita y elimina una actividad", async () => {
    const { user } = montar();
    await user.click(await screen.findByRole("button", { name: /Profesor/ }));
    await user.click(await screen.findByRole("link", { name: "Registrar actividad" }));

    await user.click(await screen.findByRole("button", { name: "Guardar" }));
    expect(screen.getByText("Escribe el nombre de la actividad.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona la fecha de entrega.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre de actividad")).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText("Nombre de actividad"), "Práctica de redes");
    await user.type(screen.getByLabelText("Fecha"), "2026-10-05");
    await user.selectOptions(screen.getByLabelText("Estudiante"), "Luis Pech Uc");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Actividad registrada")).toBeInTheDocument();
    const tarjeta = (await screen.findByText("Práctica de redes")).closest("article")!;
    expect(within(tarjeta).getByText("Luis Pech Uc")).toBeInTheDocument();

    await user.click(within(tarjeta).getByRole("button", { name: "Editar" }));
    const titulo = await screen.findByLabelText("Nombre de actividad");
    expect(titulo).toHaveValue("Práctica de redes");
    await user.clear(titulo);
    await user.type(titulo, "Práctica de redes II");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Cambios guardados")).toBeInTheDocument();

    const editada = (await screen.findByText("Práctica de redes II")).closest("article")!;
    await user.click(within(editada).getByRole("button", { name: "Eliminar" }));
    const dialogo = await screen.findByRole("alertdialog");
    expect(dialogo).toHaveTextContent("Práctica de redes II");
    await user.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("Actividad eliminada")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Práctica de redes II")).not.toBeInTheDocument());
  });

  it("cancelar el diálogo no elimina", async () => {
    const repo = new MemoriaRepo(almacen());
    await repo.iniciarSesion({ rol: "profesor" });
    const { user } = montar("/profesor/actividades", repo);
    const tarjeta = (await screen.findByText("Reporte de lectura")).closest("article")!;
    await user.click(within(tarjeta).getByRole("button", { name: "Eliminar" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Reporte de lectura")).toBeInTheDocument();
  });

  it("el detalle muestra el avance de cada estudiante de una actividad de grupo", async () => {
    const repo = new MemoriaRepo(almacen());
    await repo.iniciarSesion({ rol: "profesor" });
    montar("/profesor/actividades/4", repo);
    expect(await screen.findByText("Avance por estudiante")).toBeInTheDocument();
    expect(screen.getByText("Diego Balam Kú")).toBeInTheDocument();
    expect(screen.getByText("Grupo completo")).toBeInTheDocument();
  });
});

describe("Flujo del tutor", () => {
  it("consulta a un tutorado y sus actividades", async () => {
    const { user } = montar();
    await user.click(await screen.findByRole("button", { name: /Tutor/ }));
    await user.click(await screen.findByRole("link", { name: "Tutorados" }));
    expect(await screen.findByText("4 estudiantes asignados en el periodo actual")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Marisol Cruz Tun/ }));
    expect(await screen.findByRole("heading", { name: "Marisol Cruz Tun" })).toBeInTheDocument();
    expect(await screen.findByText("Diagrama entidad-relación")).toBeInTheDocument();
  });
});

describe("Manejo de errores", () => {
  it("muestra un mensaje y permite reintentar si falla la carga", async () => {
    const repo = new MemoriaRepo(almacen());
    await repo.iniciarSesion({ rol: "estudiante" });
    let fallar = true;
    const original = repo.misActividades.bind(repo);
    repo.misActividades = async (u) => {
      if (fallar) throw new ErrorDominio("Sin conexión con el servidor. Revisa tu internet.", "red");
      return original(u);
    };
    const { user } = montar("/estudiante", repo);
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
    fallar = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Ejercicio de Matemáticas")).toBeInTheDocument();
  });

  it("avisa cuando una escritura es rechazada", async () => {
    const repo = new MemoriaRepo(almacen());
    await repo.iniciarSesion({ rol: "estudiante" });
    repo.cambiarEstado = async () => {
      throw new ErrorDominio("No tienes permiso para realizar esta acción.", "permiso");
    };
    const { user } = montar("/estudiante/actividades/1", repo);
    await user.click(await screen.findByRole("button", { name: "Terminada" }));
    expect(await screen.findByText("No tienes permiso para realizar esta acción.")).toBeInTheDocument();
  });
});
