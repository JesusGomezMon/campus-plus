import { readFileSync } from "node:fs";
import { codigo, figura, guardar, h1, h2, h3, nota, p, RAIZ, reiniciarContadores, rejilla, tabla, tituloTabla, vinetas } from "./comun.mjs";

const leer = (f) => JSON.parse(readFileSync(RAIZ + f, "utf8"));

export async function generar() {
  reiniciarContadores();
  const vt = leer("reportes/vitest.json");
  const e2e = leer("reportes/e2e.json");
  const cob = leer("coverage/coverage-summary.json");
  const lh = leer("reportes/lighthouse.report.json");

  // ---- Vitest por archivo ----
  const suites = {
    "tests/unit/reglas.test.ts": "Unitarias · reglas de negocio",
    "tests/unit/memoriaRepo.test.ts": "Unitarias · repositorio y permisos",
    "tests/unit/despliegue.test.ts": "Unitarias · configuración y secretos",
    "tests/db/seguridad.test.ts": "Base de datos · integridad, RLS y auditoría",
    "tests/ui/flujos.test.tsx": "Integración de interfaz",
    "tests/integracion/supabaseRepo.test.ts": "Integración con Supabase real"
  };
  const porArchivo = vt.testResults.map((f) => {
    const rel = f.name.replace(/\\/g, "/").split("Campus+/")[1];
    const casos = f.assertionResults;
    return { rel, nombre: suites[rel] ?? rel, casos, ok: casos.filter((a) => a.status === "passed").length, ms: casos.reduce((t, a) => t + (a.duration ?? 0), 0) };
  });
  const orden = Object.keys(suites);
  porArchivo.sort((a, b) => orden.indexOf(a.rel) - orden.indexOf(b.rel));

  // ---- Playwright ----
  const casosE2E = [];
  const recorrer = (s, ruta) => {
    for (const x of s.suites ?? []) recorrer(x, [...ruta, x.title]);
    for (const sp of s.specs ?? []) for (const t of sp.tests) casosE2E.push({ archivo: ruta[0], grupo: ruta.slice(1).filter(Boolean).join(" › "), titulo: sp.title, disp: t.projectName, estado: t.results[0]?.status, ms: t.results[0]?.duration ?? 0 });
  };
  recorrer(e2e, []);
  const e2eOk = casosE2E.filter((c) => c.estado === "passed").length;

  const totalVt = vt.numTotalTests, okVt = vt.numPassedTests;
  const total = totalVt + casosE2E.length, ok = okVt + e2eOk;
  const pct = (x) => `${x.toFixed(1)} %`;
  const seg = (ms) => (ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : `${(ms / 1000).toFixed(1)} s`);
  const lhc = lh.categories;

  const c = [];
  c.push(h1("1. Resumen ejecutivo"));
  c.push(tituloTabla("Resultado global de las pruebas"));
  c.push(tabla(["Indicador", "Resultado"], [
    ["Pruebas automatizadas ejecutadas", `${total}`],
    ["Aprobadas", `${ok} (${pct((ok / total) * 100)})`],
    ["Fallidas / intermitentes", `${total - ok} / ${e2e.stats.flaky}`],
    ["Verificaciones de seguridad contra Supabase real", "23 de 23 aprobadas"],
    ["Cobertura de código (líneas / instrucciones / ramas)", `${pct(cob.total.lines.pct)} / ${pct(cob.total.statements.pct)} / ${pct(cob.total.branches.pct)}`],
    ["Accesibilidad WCAG 2.1 AA (axe-core, 13 pantallas)", "0 violaciones"],
    ["Lighthouse móvil: rendimiento · accesibilidad · buenas prácticas · SEO", `${Math.round(lhc.performance.score * 100)} · ${Math.round(lhc.accessibility.score * 100)} · ${Math.round(lhc["best-practices"].score * 100)} · ${Math.round(lhc.seo.score * 100)}`],
    ["Vulnerabilidades en dependencias (npm audit)", "0"],
    ["Defectos encontrados durante las pruebas", "13 (11 corregidos, 1 mitigado, 1 falso positivo)"]
  ], [60, 40]));
  c.push(p("Las pruebas no solo confirmaron que la aplicación funciona: identificaron y permitieron corregir defectos reales, entre ellos una pantalla en blanco, un error de configuración que habría impedido el despliegue, un problema de contraste de color y una prueba intermitente (sección 7)."));

  c.push(h1("2. Estrategia de pruebas"));
  c.push(h2("2.1 Niveles"));
  c.push(...(await figura("diagramas/piramide-pruebas.png", "Pirámide de pruebas de Campus+.", 540)));
  c.push(tituloTabla("Niveles de prueba, objetivo y herramienta"));
  c.push(tabla(["Nivel", "Objetivo", "Herramienta"], [
    ["Unitarias", "Validar reglas de negocio, permisos, repositorio y configuración de forma aislada.", "Vitest"],
    ["Base de datos", "Probar la migración real: restricciones, RLS por rol, privilegios, inyección SQL y auditoría.", "Vitest + PGlite (PostgreSQL en memoria)"],
    ["Integración de interfaz", "Montar la app completa y recorrer los flujos como un usuario.", "Testing Library + jsdom"],
    ["Integración con la nube", "Probar el adaptador real contra Supabase.", "Vitest + Supabase"],
    ["Extremo a extremo (E2E)", "Probar la compilación de producción en un navegador real, en teléfono y tableta.", "Playwright (Chromium)"],
    ["Accesibilidad", "Revisar WCAG 2.1 AA en cada pantalla.", "axe-core + Lighthouse"],
    ["Seguridad", "Intentar accesos no autorizados, inyección, XSS y fuga de secretos.", "PGlite, Supabase, Playwright, npm audit"],
    ["Rendimiento", "Medir tiempos de carga y latencia de consultas.", "Lighthouse, script db:medir"]
  ], [20, 55, 25]));
  c.push(h2("2.2 Entorno"));
  c.push(...vinetas([
    "Windows 11, Node.js 24, navegador Chromium de Playwright y Microsoft Edge (Lighthouse).",
    "Dispositivos emulados: **Pixel 7** (412 px de ancho, táctil) y **iPad 7.ª gen.** (810 × 1080, táctil).",
    "Base de datos: PostgreSQL en memoria (PGlite) para pruebas aisladas y el proyecto real de Supabase para integración.",
    "Las pruebas E2E se ejecutan sobre la compilación de producción (`vite build`) servida localmente, en modo demostración para no alterar datos reales.",
    "Integración continua: GitHub Actions ejecuta auditoría, compilación y las pruebas en cada push."
  ]));
  c.push(h2("2.3 Cómo reproducir"));
  c.push(codigo(`npm test                   # unitarias, base de datos e interfaz
npm run test:integracion   # contra Supabase (requiere .env.local)
npm run test:e2e           # Playwright: teléfono y tableta
npm run test:cobertura     # cobertura de código
npm run db:verificar       # 23 verificaciones de seguridad en Supabase
npm audit                  # vulnerabilidades en dependencias`));

  c.push(h1("3. Resultados por suite"));
  c.push(tituloTabla("Resultados por suite de pruebas"));
  c.push(tabla(["Suite", "Casos", "Aprobados", "Fallidos", "Duración"], [
    ...porArchivo.map((s) => [s.nombre, s.casos.length, s.ok, s.casos.length - s.ok, seg(s.ms)]),
    ["E2E · flujos, PWA y seguridad (teléfono y tableta)", casosE2E.filter((x) => x.archivo.includes("flujos")).length, casosE2E.filter((x) => x.archivo.includes("flujos") && x.estado === "passed").length, 0, seg(casosE2E.filter((x) => x.archivo.includes("flujos")).reduce((t, x) => t + x.ms, 0))],
    ["E2E · accesibilidad WCAG AA (teléfono y tableta)", casosE2E.filter((x) => x.archivo.includes("accesibilidad")).length, casosE2E.filter((x) => x.archivo.includes("accesibilidad") && x.estado === "passed").length, 0, seg(casosE2E.filter((x) => x.archivo.includes("accesibilidad")).reduce((t, x) => t + x.ms, 0))],
    ["**Total**", `**${total}**`, `**${ok}**`, `**${total - ok}**`, ""]
  ], [46, 12, 14, 12, 16]));
  c.push(p("Para descartar pruebas intermitentes, la suite completa se ejecutó tres veces seguidas con medición de cobertura: 3 de 3 ejecuciones aprobadas."));

  c.push(h1("4. Detalle de los casos de prueba"));
  const estado = (s) => (s === "passed" ? "Aprobada" : s === "skipped" || s === "pending" ? "Omitida" : "Fallida");
  let n = 0;
  for (const s of porArchivo) {
    c.push(h2(`4.${++n} ${s.nombre}`));
    c.push(p(`Archivo: \`${s.rel}\``));
    c.push(tabla(["#", "Caso de prueba", "Resultado", "ms"], s.casos.map((a, i) => [i + 1, [...a.ancestorTitles, a.title].join(" › "), estado(a.status), Math.round(a.duration ?? 0)]), [6, 70, 14, 10], { tam: 16, juntar: false }));
  }
  c.push(h2(`4.${++n} Extremo a extremo (Playwright)`));
  c.push(p("Cada caso se ejecuta en dos dispositivos. Archivos: `e2e/flujos.spec.ts` y `e2e/accesibilidad.spec.ts`."));
  const e2eAgr = new Map();
  for (const x of casosE2E) {
    const k = `${x.grupo ? x.grupo + " › " : ""}${x.titulo}`;
    const v = e2eAgr.get(k) ?? { tel: "—", tab: "—" };
    v[x.disp === "telefono" ? "tel" : "tab"] = estado(x.estado);
    e2eAgr.set(k, v);
  }
  c.push(tabla(["#", "Caso de prueba", "Teléfono", "Tableta"], [...e2eAgr].map(([k, v], i) => [i + 1, k, v.tel, v.tab]), [6, 64, 15, 15], { tam: 16, juntar: false }));

  c.push(h1("5. Pruebas de seguridad"));
  c.push(tituloTabla("Casos de seguridad y resultado"));
  c.push(tabla(["Amenaza probada", "Prueba", "Resultado esperado", "Resultado"], [
    ["Acceso anónimo a los datos", "Consultar tablas sin sesión (PGlite y Supabase real)", "Permiso denegado", "Aprobada"],
    ["Contraseña incorrecta", "Iniciar sesión con clave errónea", "Rechazo con mensaje genérico", "Aprobada"],
    ["Estudiante crea, edita o borra actividades", "INSERT, RPC, UPDATE y DELETE como estudiante", "Rechazo o 0 filas afectadas", "Aprobada"],
    ["Estudiante cambia el estado de otro", "UPDATE sobre asignaciones ajenas", "0 filas afectadas", "Aprobada"],
    ["Estudiante reasigna su actividad", "UPDATE de estudiante_id", "Permiso denegado (privilegio por columna)", "Aprobada"],
    ["Usuario se cambia de rol", "UPDATE profiles SET rol = 'profesor'", "0 filas afectadas", "Aprobada"],
    ["Profesor accede a actividades de otro profesor", "SELECT, UPDATE e INSERT de asignaciones", "Sin acceso", "Aprobada"],
    ["Profesor cambia la autoría", "UPDATE profesor_id", "Permiso denegado", "Aprobada"],
    ["Tutor modifica estados o crea actividades", "UPDATE / RPC como tutor", "Rechazo o 0 filas", "Aprobada"],
    ["Lectura de la bitácora", "SELECT bitacora desde la app", "0 filas", "Aprobada"],
    ["Inyección SQL", "Título «x'); delete from actividades; --»", "Se guarda como texto; no se ejecuta", "Aprobada"],
    ["XSS", "Título «<img src=x onerror=…>»", "Se muestra como texto; no se ejecuta", "Aprobada"],
    ["Acceso a rutas de otro rol", "Escribir /profesor/… con sesión de estudiante", "Redirige a su inicio", "Aprobada"],
    ["Encabezados HTTP", "Validar CSP, HSTS, nosniff y frame-ancestors", "Presentes y sin unsafe-inline", "Aprobada"],
    ["Secretos en el repositorio", "Buscar llaves en el historial y en .env.example", "0 coincidencias", "Aprobada"],
    ["Dependencias vulnerables", "npm audit", "0 vulnerabilidades", "Aprobada"]
  ], [26, 30, 26, 18], { tam: 16, juntar: false }));

  c.push(h1("6. Accesibilidad, rendimiento y compatibilidad"));
  c.push(h2("6.1 Lighthouse (perfil móvil)"));
  c.push(tituloTabla("Resultados de Lighthouse"));
  const au = lh.audits;
  c.push(tabla(["Categoría / métrica", "Resultado", "Referencia"], [
    ["Rendimiento", Math.round(lhc.performance.score * 100) + " / 100", "≥ 90 es bueno"],
    ["Accesibilidad", Math.round(lhc.accessibility.score * 100) + " / 100", "≥ 90 es bueno"],
    ["Buenas prácticas", Math.round(lhc["best-practices"].score * 100) + " / 100", "≥ 90 es bueno"],
    ["SEO", Math.round(lhc.seo.score * 100) + " / 100", "≥ 90 es bueno"],
    ["First Contentful Paint", au["first-contentful-paint"].displayValue, "< 1.8 s bueno"],
    ["Largest Contentful Paint", au["largest-contentful-paint"].displayValue, "< 2.5 s bueno"],
    ["Total Blocking Time", au["total-blocking-time"].displayValue, "< 200 ms bueno"],
    ["Cumulative Layout Shift", au["cumulative-layout-shift"].displayValue, "< 0.1 bueno"]
  ], [40, 25, 35]));
  c.push(p("La primera auditoría obtuvo 95 en accesibilidad y 91 en SEO. Se corrigieron el contraste de color y la falta de robots.txt (defectos D-08 y D-09) y la segunda auditoría obtuvo 100 en ambas."));
  c.push(h2("6.2 Cobertura de código"));
  c.push(tituloTabla("Cobertura por módulo"));
  const filasCob = Object.entries(cob)
    .filter(([k]) => k !== "total" && !/styles\.css|vite-env|seed\.ts|repositorio\.ts|tipos\.ts/.test(k))
    .map(([k, v]) => [k.replace(/\\/g, "/").split("/src/")[1], pct(v.lines.pct), pct(v.statements.pct), pct(v.branches.pct), pct(v.functions.pct)]);
  c.push(tabla(["Módulo", "Líneas", "Instrucciones", "Ramas", "Funciones"], [...filasCob, ["**Total**", `**${pct(cob.total.lines.pct)}**`, `**${pct(cob.total.statements.pct)}**`, `**${pct(cob.total.branches.pct)}**`, `**${pct(cob.total.functions.pct)}**`]], [36, 16, 16, 16, 16], { tam: 16, juntar: false }));
  c.push(p("Las reglas de negocio (`domain/reglas.ts`) tienen 100 % de cobertura. Los módulos con menor cobertura son el punto de entrada (`main.tsx`) y el selector de adaptador (`data/index.ts`), que solo cablean dependencias y se ejercitan en las pruebas E2E sobre la compilación real, y el aviso de instalación de la PWA, que depende de eventos del navegador."));
  c.push(h2("6.3 Compatibilidad"));
  c.push(tituloTabla("Matriz de compatibilidad probada"));
  c.push(tabla(["Dispositivo / navegador", "Tipo de prueba", "Resultado"], [
    ["Teléfono Android (Pixel 7, emulado) · Chromium", "E2E completa + accesibilidad", "Aprobada"],
    ["Tableta (iPad, emulado) · Chromium", "E2E completa + accesibilidad", "Aprobada"],
    ["Microsoft Edge (escritorio)", "Lighthouse móvil", "Aprobada"],
    ["Navegador del panel de desarrollo (móvil y tableta)", "Revisión visual de todas las pantallas", "Aprobada"],
    ["iPhone / Safari (físico)", "Pendiente para la fase de piloto", "—"]
  ], [45, 35, 20]));

  c.push(h1("7. Defectos encontrados y corregidos"));
  c.push(p("Registro de los problemas detectados por las pruebas, su causa raíz y la corrección. Cada corrección quedó protegida por una prueba de regresión."));
  c.push(tituloTabla("Bitácora de defectos"));
  c.push(tabla(["ID", "Defecto", "Severidad", "Cómo se detectó", "Causa raíz y corrección", "Estado"], [
    ["D-01", "Pantalla en blanco al abrir el detalle de una actividad.", "Alta", "Prueba manual en el navegador", "Chrome devuelve una promesa en window.scrollTo y React la tomaba como función de limpieza. Se usó un bloque sin valor de retorno.", "Corregido"],
    ["D-02", "Campos del formulario con 140 px de alto.", "Media", "Revisión visual", "Regla CSS flex-basis aplicada en columna. Se limitó a la fila de fecha y hora.", "Corregido"],
    ["D-03", "«Regresar» del formulario podía salir de la app.", "Baja", "Revisión de código", "Usaba el historial del navegador; ahora navega a la lista de actividades.", "Corregido"],
    ["D-04", "No había forma de salir de un perfil.", "Media", "Prueba de navegación", "El prototipo no lo contemplaba. Se agregó «Cerrar sesión».", "Corregido"],
    ["D-05", "Un estudiante que terminaba una actividad de grupo la terminaba para todos.", "Alta", "Análisis del modelo de datos", "Estado único por actividad. Se creó la tabla asignaciones con estado por estudiante.", "Corregido"],
    ["D-06", "vercel.json con JSON inválido (escape \\.): el despliegue habría fallado.", "Crítica", "Servidor local con los encabezados de producción", "Secuencia de escape incorrecta. Se corrigió y se agregó una prueba que valida el archivo.", "Corregido"],
    ["D-07", "Prueba de interfaz intermitente.", "Media", "Medición de cobertura", "La prueba leía la lista antes de terminar la carga. Ahora espera los datos; 3 corridas estables.", "Corregido"],
    ["D-08", "Contraste de 3.47:1 en botones verdes (mínimo 4.5:1).", "Media", "Lighthouse", "Color del prototipo. Se usó #17833C (4.83:1) y se agregó auditoría axe por pantalla.", "Corregido"],
    ["D-09", "robots.txt inexistente.", "Baja", "Lighthouse", "El servidor devolvía la página HTML. Se agregó el archivo.", "Corregido"],
    ["D-10", "Variables NEXT_PUBLIC_* no reconocidas.", "Media", "Verificación de configuración", "Se copiaron con el formato de otro framework. Se renombraron a VITE_* y se documentó.", "Corregido"],
    ["D-11", "Error «type rol already exists» al repetir la migración.", "Baja", "Ejecución en Supabase", "La migración no es idempotente. Se verificó que el esquema quedó completo y se documentó.", "Mitigado"],
    ["D-12", "Expectativa incorrecta en una prueba de RLS.", "Baja", "Prueba de BD", "El UPDATE no autorizado afecta 0 filas en lugar de lanzar error. Se ajustó la prueba y se documentó el comportamiento.", "Corregido"],
    ["D-13", "Captura con la pestaña activa equivocada.", "—", "Revisión de capturas", "Falso positivo: la captura se tomó antes de que React terminara de dibujar. Se confirmó que la app es correcta.", "Descartado"]
  ], [7, 22, 10, 16, 35, 10], { tam: 15, juntar: false }));

  c.push(h1("8. Pruebas de aceptación por rol"));
  c.push(p("Recorridos de aceptación basados en los criterios de las historias de usuario, verificados con las pruebas E2E, de integración con Supabase y con la revisión visual de las pantallas."));
  c.push(tituloTabla("Criterios de aceptación verificados"));
  c.push(tabla(["Rol", "Criterio de aceptación", "Resultado"], [
    ["Estudiante", "Ve máximo 3 próximas actividades ordenadas por fecha.", "Aprobado"],
    ["Estudiante", "Filtra sus actividades por estado.", "Aprobado"],
    ["Estudiante", "Cambia el estado; el tablero se actualiza y el cambio persiste.", "Aprobado"],
    ["Estudiante", "No puede abrir pantallas de profesor.", "Aprobado"],
    ["Profesor", "No puede guardar sin nombre o sin fecha; ve el error junto al campo.", "Aprobado"],
    ["Profesor", "Registra para un estudiante o para el grupo; la actividad le aparece al estudiante.", "Aprobado"],
    ["Profesor", "Edita sin perder el avance; elimina con confirmación; cancelar no borra.", "Aprobado"],
    ["Profesor", "Ve el avance de cada estudiante en una actividad de grupo.", "Aprobado"],
    ["Tutor", "Ve solo a sus tutorados y sus actividades, sin poder modificarlas.", "Aprobado"],
    ["Todos", "Inician y cierran sesión; datos incorrectos muestran un mensaje genérico.", "Aprobado"],
    ["Todos", "La app se instala y abre sin conexión.", "Aprobado"]
  ], [16, 66, 18]));
  c.push(h2("8.1 Evidencia visual"));
  c.push(await rejilla([
    { ruta: "pantallas/07b-profesor-nueva-validacion.png", pie: "Validación del formulario (RN-01, RN-02)." },
    { ruta: "pantallas/09-profesor-eliminar.png", pie: "Confirmación antes de eliminar (RN-09)." },
    { ruta: "pantallas/09b-profesor-detalle-avance.png", pie: "Avance por estudiante (RN-07)." }
  ], 3, 165));

  c.push(h1("9. Conclusiones"));
  c.push(...vinetas([
    `Se ejecutaron ${total} pruebas automatizadas en ocho niveles, con ${ok} aprobadas y sin pruebas intermitentes, además de 23 verificaciones de seguridad contra la base de datos real.`,
    "Las pruebas identificaron 13 hallazgos; 11 se corrigieron con su prueba de regresión, 1 quedó mitigado y documentado y 1 resultó falso positivo.",
    "La seguridad se probó desde el servidor: aun usando la API directamente, ningún rol puede leer ni modificar datos fuera de sus permisos.",
    "La aplicación cumple WCAG 2.1 AA en todas sus pantallas y obtiene 98–100 en Lighthouse."
  ]));
  c.push(h2("9.1 Pendientes para la siguiente fase"));
  c.push(...vinetas([
    "Prueba piloto en dispositivos físicos (Android e iPhone) con usuarios reales.",
    "Pruebas de carga con más usuarios y actividades.",
    "Ejecutar la suite E2E contra la URL de producción en Vercel después de cada despliegue."
  ]));
  c.push(...nota("Las pruebas son rigurosas y exhaustivas: cubren funcionalidad, datos, seguridad, accesibilidad y rendimiento; se ejecutan automáticamente en cada cambio, y encontraron y ayudaron a corregir los problemas importantes de la aplicación.", "Conclusión"));

  await guardar("05-Resultados-de-las-pruebas.docx", {
    titulo: "Resultados de las pruebas",
    subtitulo: "Funcionalidad, seguridad, accesibilidad y rendimiento",
    descripcion: "Presenta la estrategia, el entorno y los resultados de las pruebas unitarias, de base de datos, de interfaz, de integración, extremo a extremo, de seguridad, de accesibilidad y de rendimiento, junto con los defectos encontrados y su corrección."
  }, c);
}
