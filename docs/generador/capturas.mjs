/**
 * Toma capturas de todas las pantallas (modo demostración) en teléfono y tablet.
 * Requiere: npx vite build --mode e2e && npx vite preview --port 4174
 * Opcional: servidor en modo Supabase en :5173 para la pantalla de inicio de sesión.
 */
import { chromium, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../img/pantallas/", import.meta.url));
const BASE = "http://localhost:4174";
const browser = await chromium.launch();

async function contexto(device) {
  const ctx = await browser.newContext({ ...device, serviceWorkers: "block" });
  const page = await ctx.newPage();
  return { ctx, page };
}
const foto = (page, nombre) => page.screenshot({ path: OUT + nombre + ".png", animations: "disabled" });
const esperar = async (page) => { await page.waitForLoadState("networkidle"); await page.waitForTimeout(500); };
const telefono = { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };

async function entrar(page, perfil) {
  await page.goto(BASE + "/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + "/");
  await page.getByRole("button", { name: new RegExp(perfil) }).click();
  await esperar(page);
}

{
  const { ctx, page } = await contexto(telefono);
  await page.goto(BASE + "/"); await esperar(page);
  await foto(page, "01-inicio-perfil");

  await entrar(page, "Estudiante"); await foto(page, "02-estudiante-inicio");
  await page.getByRole("link", { name: "Actividades" }).click(); await esperar(page); await foto(page, "03-estudiante-actividades");
  await page.getByRole("button", { name: /Ejercicio de Programación/ }).click(); await esperar(page); await foto(page, "04-estudiante-detalle");

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await entrar(page, "Profesor"); await foto(page, "05-profesor-inicio");
  await page.getByRole("link", { name: "Actividades", exact: true }).click(); await esperar(page); await foto(page, "06-profesor-actividades");
  await page.getByRole("link", { name: "Registrar actividad" }).click(); await esperar(page); await foto(page, "07-profesor-nueva");
  await page.getByRole("button", { name: "Guardar" }).click(); await foto(page, "07b-profesor-nueva-validacion");
  await page.goto(BASE + "/profesor/actividades/2/editar"); await esperar(page); await foto(page, "08-profesor-editar");
  await page.goto(BASE + "/profesor/actividades"); await esperar(page);
  await page.locator("article", { hasText: "Ejercicio de Programación" }).getByRole("button", { name: "Eliminar" }).click();
  await foto(page, "09-profesor-eliminar");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.goto(BASE + "/profesor/actividades/4"); await esperar(page);
  await page.setViewportSize({ width: 390, height: 1060 }); await foto(page, "09b-profesor-detalle-avance"); await page.setViewportSize({ width: 390, height: 844 });

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await entrar(page, "Tutor"); await foto(page, "10-tutor-inicio");
  await page.getByRole("link", { name: "Tutorados" }).click(); await esperar(page); await foto(page, "11-tutor-tutorados");
  await page.getByRole("button", { name: /Marisol Cruz Tun/ }).click(); await esperar(page); await foto(page, "12-tutor-detalle");
  await ctx.close();
}

{
  const tablet = { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true };
  const { ctx, page } = await contexto(tablet);
  await entrar(page, "Profesor");
  await page.getByRole("link", { name: "Actividades", exact: true }).click(); await esperar(page);
  await foto(page, "13-tablet-profesor-actividades");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await entrar(page, "Estudiante");
  await page.getByRole("link", { name: "Actividades" }).click(); await esperar(page);
  await foto(page, "14-tablet-estudiante-actividades");
  await ctx.close();
}

try {
  const { ctx, page } = await contexto(telefono);
  await page.goto("http://localhost:5173/"); await page.getByRole("heading", { name: "Iniciar sesión" }).waitFor({ timeout: 8000 });
  await foto(page, "00-login-supabase");
  await ctx.close();
} catch { console.log("(sin servidor Supabase en :5173, se omite la captura de login)"); }

await browser.close();
console.log("Capturas listas en docs/img/pantallas");
