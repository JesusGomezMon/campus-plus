/** Verifica la configuración de despliegue (Vercel) y de seguridad HTTP. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const leer = (f: string) => readFileSync(fileURLToPath(new URL(`../../${f}`, import.meta.url)), "utf8");

describe("vercel.json", () => {
  const config = JSON.parse(leer("vercel.json")) as {
    rewrites: { source: string; destination: string }[];
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const globales = Object.fromEntries(config.headers.find((h) => h.source === "/(.*)")!.headers.map((h) => [h.key, h.value]));

  it("es JSON válido y redirige las rutas de la SPA a index.html", () => {
    const regla = new RegExp("^" + config.rewrites[0].source + "$");
    expect(regla.test("/profesor/actividades/3/editar")).toBe(true);
    expect(regla.test("/assets/index-abc.js")).toBe(false);
    expect(regla.test("/manifest.webmanifest")).toBe(false);
  });

  it("define encabezados de seguridad", () => {
    expect(globales["Content-Security-Policy"]).toMatch(/default-src 'self'/);
    expect(globales["Content-Security-Policy"]).toMatch(/frame-ancestors 'none'/);
    expect(globales["Content-Security-Policy"]).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(globales["Strict-Transport-Security"]).toBeDefined();
    expect(globales["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("bloquea contenido embebido y fuerza HTTPS", () => {
    expect(globales["Content-Security-Policy"]).toMatch(/object-src 'none'/);
    expect(globales["Content-Security-Policy"]).toMatch(/upgrade-insecure-requests/);
    expect(globales["X-Frame-Options"]).toBe("DENY");
    expect(globales["Cross-Origin-Opener-Policy"]).toBe("same-origin");
  });

  it("guarda la aplicación en caché pero nunca el service worker", () => {
    const sw = config.headers.find((h) => h.source === "/sw.js")!.headers.find((h) => h.key === "Cache-Control")!.value;
    const assets = config.headers.find((h) => h.source === "/assets/(.*)")!.headers.find((h) => h.key === "Cache-Control")!.value;
    expect(sw).toMatch(/max-age=0/);
    expect(assets).toMatch(/immutable/);
  });

  it("permite conectarse a Supabase", () => {
    expect(globales["Content-Security-Policy"]).toMatch(/connect-src[^;]*https:\/\/\*\.supabase\.co/);
  });
});

describe("secretos", () => {
  it("el archivo de ejemplo no contiene llaves reales", () => {
    const ejemplo = leer(".env.example");
    expect(ejemplo).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
  });

  it("los archivos .env.local están ignorados por git", () => {
    expect(leer(".gitignore")).toMatch(/\.env\*\.local/);
  });
});
