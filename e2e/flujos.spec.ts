import { expect, test, type Page } from "@playwright/test";

async function entrarComo(page: Page, perfil: "Estudiante" | "Profesor" | "Tutor") {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(perfil) }).click();
}

test.describe("PWA", () => {
  test("publica el manifiesto y registra el service worker", async ({ page }) => {
    await page.goto("/");
    const manifest = await page.request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    const json = await manifest.json();
    expect(json).toMatchObject({ name: "Campus +", display: "standalone", start_url: "/" });
    expect(json.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBeTruthy();
    await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), { timeout: 10_000 }).toBeTruthy();
  });

  test("funciona sin conexión después de la primera visita", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Selecciona tu perfil" })).toBeVisible();
    await context.setOffline(false);
  });

  test("no hay desplazamiento horizontal", async ({ page }) => {
    await entrarComo(page, "Profesor");
    await page.getByRole("link", { name: "Actividades" }).click();
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desborde).toBeLessThanOrEqual(0);
  });
});

test.describe("Estudiante", () => {
  test("cambia el estado de una actividad y el tablero se actualiza", async ({ page }) => {
    await entrarComo(page, "Estudiante");
    await expect(page.getByText("Hola, Ana!")).toBeVisible();
    await page.getByRole("button", { name: /Ejercicio de Matemáticas/ }).click();
    await page.getByRole("button", { name: "Terminada" }).click();
    await expect(page.getByText("Estado cambiado a “Terminada”")).toBeVisible();
    await page.getByRole("link", { name: "Inicio" }).click();
    await expect(page.getByRole("button", { name: /Ejercicio de Matemáticas/ })).toHaveCount(0);
    await expect(page.locator(".stat", { hasText: "Terminadas" })).toContainText("2");
  });

  test("los cambios persisten al recargar", async ({ page }) => {
    await entrarComo(page, "Estudiante");
    await page.getByRole("button", { name: /Ejercicio de Física/ }).click();
    await page.getByRole("button", { name: "En proceso" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "En proceso" })).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("Profesor", () => {
  test("registra una actividad para el grupo y la elimina", async ({ page }) => {
    await entrarComo(page, "Profesor");
    await page.getByRole("link", { name: "Registrar actividad" }).click();
    await page.getByLabel("Nombre de actividad").fill("Proyecto final");
    await page.getByLabel("Fecha").fill("2026-11-30");
    await page.getByLabel("Hora").fill("12:00");
    await page.getByLabel("Descripción").fill("Entrega del proyecto integrador.");
    await page.getByRole("button", { name: "Guardar" }).click();

    const tarjeta = page.locator("article", { hasText: "Proyecto final" });
    await expect(tarjeta).toContainText("Grupo completo · 0/4 terminadas");
    await tarjeta.getByRole("button", { name: "Eliminar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(tarjeta).toHaveCount(0);
  });

  test("la actividad registrada le aparece al estudiante", async ({ page }) => {
    await entrarComo(page, "Profesor");
    await page.getByRole("link", { name: "Registrar actividad" }).click();
    await page.getByLabel("Nombre de actividad").fill("Lectura adicional");
    await page.getByLabel("Fecha").fill("2026-09-20");
    await page.getByLabel("Estudiante").selectOption({ label: "Ana Sofía Canul" });
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Actividad registrada")).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await entrarComo(page, "Estudiante");
    await page.getByRole("link", { name: "Actividades" }).click();
    await expect(page.getByText("Lectura adicional")).toBeVisible();
  });
});

test.describe("Tutor", () => {
  test("consulta el detalle de un tutorado", async ({ page }) => {
    await entrarComo(page, "Tutor");
    await page.getByRole("button", { name: /Diego Balam Kú/ }).click();
    await expect(page.getByRole("heading", { name: "Diego Balam Kú" })).toBeVisible();
    await expect(page.getByText("Reporte de lectura")).toBeVisible();
  });
});

test.describe("Seguridad en el cliente", () => {
  test("no se puede entrar a rutas de otro rol escribiendo la URL", async ({ page }) => {
    await entrarComo(page, "Estudiante");
    await page.goto("/profesor/actividades/nueva");
    await expect(page).toHaveURL(/\/estudiante$/);
  });

  test("el texto con HTML se muestra escapado (sin XSS)", async ({ page }) => {
    await entrarComo(page, "Profesor");
    await page.getByRole("link", { name: "Registrar actividad" }).click();
    const xss = `<img src=x onerror="window.__xss=1">`;
    await page.getByLabel("Nombre de actividad").fill(xss);
    await page.getByLabel("Fecha").fill("2026-10-10");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(xss)).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
