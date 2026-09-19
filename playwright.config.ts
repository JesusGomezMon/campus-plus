import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo sobre la compilación de producción (modo demostración),
 * en un teléfono (Pixel 7) y una tablet (iPad).
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "reportes/e2e" }]],
  use: { baseURL: "http://localhost:4174", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "telefono", use: { ...devices["Pixel 7"] } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"], browserName: "chromium" } }
  ],
  webServer: {
    command: "npx vite build --mode e2e && npx vite preview --port 4174 --strictPort",
    url: "http://localhost:4174",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
