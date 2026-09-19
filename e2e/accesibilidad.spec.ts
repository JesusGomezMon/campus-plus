import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Revisa WCAG 2.1 A/AA con axe-core en cada pantalla de la aplicación. */
async function auditar(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const resumen = r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(resumen).toEqual([]);
}

async function entrar(page: Page, perfil: string) {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(perfil) }).click();
}

test("inicio / selección de perfil", async ({ page }) => {
  await page.goto("/");
  await auditar(page);
});

test("pantallas del estudiante", async ({ page }) => {
  await entrar(page, "Estudiante");
  await auditar(page);
  await page.getByRole("link", { name: "Actividades" }).click();
  await auditar(page);
  await page.getByRole("button", { name: /Ejercicio de Programación/ }).click();
  await auditar(page);
});

test("pantallas del profesor", async ({ page }) => {
  await entrar(page, "Profesor");
  await auditar(page);
  await page.getByRole("link", { name: "Actividades", exact: true }).click();
  await auditar(page);
  await page.goto("/profesor/actividades/4");
  await auditar(page);
  await page.goto("/profesor/actividades/nueva");
  await auditar(page);
  await page.getByRole("button", { name: "Guardar" }).click();
  await auditar(page);
  await page.goto("/profesor/actividades");
  await page.locator("article").first().getByRole("button", { name: "Eliminar" }).click();
  await auditar(page);
});

test("pantallas del tutor", async ({ page }) => {
  await entrar(page, "Tutor");
  await auditar(page);
  await page.getByRole("link", { name: "Tutorados" }).click();
  await auditar(page);
  await page.getByRole("button", { name: /Ana Sofía Canul/ }).click();
  await auditar(page);
});
