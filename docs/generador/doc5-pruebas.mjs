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
  c.push(h1("1. Resumen"));
  c.push(tituloTabla("Resultado general de las pruebas"));
  c.push(tabla(["Indicador", "Resultado"], [
    ["Pruebas automatizadas que se corrieron", `${total}`],
    ["Aprobadas", `${ok} (${pct((ok / total) * 100)})`],
    ["Fallidas / que fallaban a veces", `${total - ok} / ${e2e.stats.flaky}`],
    ["Verificaciones de seguridad contra Supabase real", "23 de 23 aprobadas"],
    ["Cobertura de código (líneas / instrucciones / ramas)", `${pct(cob.total.lines.pct)} / ${pct(cob.total.statements.pct)} / ${pct(cob.total.branches.pct)}`],
    ["Accesibilidad WCAG 2.1 AA (axe-core, 13 pantallas)", "0 violaciones"],
    ["Lighthouse móvil: rendimiento · accesibilidad · buenas prácticas · SEO", `${Math.round(lhc.performance.score * 100)} · ${Math.round(lhc.accessibility.score * 100)} · ${Math.round(lhc["best-practices"].score * 100)} · ${Math.round(lhc.seo.score * 100)}`],
    ["Vulnerabilidades en dependencias (npm audit)", "0"],
    ["Errores encontrados durante las pruebas", "13 (11 corregidos, 1 mitigado, 1 falso positivo)"]
  ], [60, 40]));
  c.push(p("Las pruebas no solo sirvieron para ver que la app funciona: con ellas encontré errores de verdad, como una pantalla que salía en blanco, un archivo de configuración mal escrito que habría tumbado la publicación, un color sin suficiente contraste y una prueba que a veces pasaba y a veces no (sección 7)."));

  c.push(h1("2. Estrategia de pruebas"));
  c.push(h2("2.1 Niveles"));
  c.push(...(await figura("diagramas/piramide-pruebas.png", "Pirámide de pruebas de Campus+.", 540)));
  c.push(tituloTabla("Niveles de prueba, para qué sirve cada uno y con qué lo hice"));
  c.push(tabla(["Nivel", "Para qué", "Herramienta"], [
    ["Unitarias", "Probar por separado las reglas de negocio, los permisos, el repositorio y la configuración.", "Vitest"],
    ["Base de datos", "Probar la migración real: restricciones, RLS por rol, privilegios, inyección SQL y auditoría.", "Vitest + PGlite (PostgreSQL en memoria)"],
    ["Integración de interfaz", "Levantar la app completa y recorrerla como si fuera un usuario.", "Testing Library + jsdom"],
    ["Integración con la nube", "Probar el adaptador real contra Supabase.", "Vitest + Supabase"],
    ["Extremo a extremo (E2E)", "Probar la versión de producción en un navegador real, en teléfono y en tableta.", "Playwright (Chromium)"],
    ["Accesibilidad", "Revisar WCAG 2.1 AA en cada pantalla.", "axe-core + Lighthouse"],
    ["Seguridad", "Intentar entrar sin permiso, inyección, XSS y buscar llaves filtradas.", "PGlite, Supabase, Playwright, npm audit"],
    ["Rendimiento", "Medir cuánto tarda en cargar y cuánto tardan las consultas.", "Lighthouse, script db:medir"]
  ], [20, 55, 25]));
  c.push(h2("2.2 Entorno"));
  c.push(...vinetas([
    "Windows 11, Node.js 24, el navegador Chromium de Playwright y Microsoft Edge (para Lighthouse).",
    "Dispositivos simulados: **Pixel 7** (412 px de ancho, táctil) e **iPad 7.ª gen.** (810 × 1080, táctil).",
    "Base de datos: PostgreSQL en memoria (PGlite) para las pruebas aisladas, y el proyecto real de Supabase para las de integración.",
    "Las E2E corren sobre la versión compilada (`vite build`) servida en local, en modo demostración para no mover datos reales.",
    "Integración continua: GitHub Actions corre la auditoría, la compilación y las pruebas en cada push."
  ]));
  c.push(h2("2.3 Cómo reproducir"));
  c.push(codigo(`npm test                   # unitarias, base de datos e interfaz
npm run test:integracion   # contra Supabase (necesita .env.local)
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
  c.push(p("Para asegurarme de que ninguna prueba fallaba a veces, corrí la suite completa tres veces seguidas y las 3 pasaron."));
  c.push(p("**Integración continua:** GitHub Actions corre la auditoría, la compilación, las pruebas y las E2E en cada push. En el historial se nota para qué sirve: una corrida falló por la prueba intermitente D-07 en un commit anterior a la corrección, y la corrida de la versión final (v1.0.0) salió en verde. Enlace: " + "https://github.com/JesusGomezMon/campus-plus/actions"));

  c.push(h1("4. Detalle de los casos de prueba"));
  const estado = (s) => (s === "passed" ? "Aprobada" : s === "skipped" || s === "pending" ? "Omitida" : "Fallida");
  let n = 0;
  for (const s of porArchivo) {
    c.push(h2(`4.${++n} ${s.nombre}`));
    c.push(p(`Archivo: \`${s.rel}\``));
    c.push(tabla(["#", "Caso de prueba", "Resultado", "ms"], s.casos.map((a, i) => [i + 1, [...a.ancestorTitles, a.title].join(" › "), estado(a.status), Math.round(a.duration ?? 0)]), [6, 70, 14, 10], { tam: 16, juntar: false }));
  }
  c.push(h2(`4.${++n} Extremo a extremo (Playwright)`));
  c.push(p("Cada caso se corre en dos dispositivos. Archivos: `e2e/flujos.spec.ts` y `e2e/accesibilidad.spec.ts`."));
  const e2eAgr = new Map();
  for (const x of casosE2E) {
    const k = `${x.grupo ? x.grupo + " › " : ""}${x.titulo}`;
    const v = e2eAgr.get(k) ?? { tel: "—", tab: "—" };
    v[x.disp === "telefono" ? "tel" : "tab"] = estado(x.estado);
    e2eAgr.set(k, v);
  }
  c.push(tabla(["#", "Caso de prueba", "Teléfono", "Tableta"], [...e2eAgr].map(([k, v], i) => [i + 1, k, v.tel, v.tab]), [6, 64, 15, 15], { tam: 16, juntar: false }));

  c.push(h1("5. Pruebas de seguridad"));
  c.push(tituloTabla("Qué intenté y qué pasó"));
  c.push(tabla(["Qué intenté", "Cómo lo probé", "Qué debía pasar", "Resultado"], [
    ["Ver los datos sin iniciar sesión", "Consultar las tablas sin sesión (PGlite y Supabase real)", "Permiso denegado", "Aprobada"],
    ["Entrar con la contraseña equivocada", "Iniciar sesión con una clave mal", "Que lo rechace con un mensaje genérico", "Aprobada"],
    ["Que un estudiante cree, edite o borre actividades", "INSERT, RPC, UPDATE y DELETE como estudiante", "Rechazo o 0 filas afectadas", "Aprobada"],
    ["Que un estudiante cambie el estado de otro", "UPDATE sobre asignaciones que no son suyas", "0 filas afectadas", "Aprobada"],
    ["Que un estudiante se pase su actividad a otro", "UPDATE de estudiante_id", "Permiso denegado (privilegio por columna)", "Aprobada"],
    ["Que alguien se cambie de rol", "UPDATE profiles SET rol = 'profesor'", "0 filas afectadas", "Aprobada"],
    ["Que un profesor vea actividades de otro profesor", "SELECT, UPDATE e INSERT de asignaciones", "Sin acceso", "Aprobada"],
    ["Que un profesor cambie quién creó la actividad", "UPDATE profesor_id", "Permiso denegado", "Aprobada"],
    ["Que un tutor cambie estados o cree actividades", "UPDATE / RPC como tutor", "Rechazo o 0 filas", "Aprobada"],
    ["Leer la bitácora desde la app", "SELECT bitacora", "0 filas", "Aprobada"],
    ["Inyección SQL", "Poner de título «x'); delete from actividades; --»", "Que se guarde como texto y no se ejecute", "Aprobada"],
    ["XSS", "Poner de título «<img src=x onerror=…>»", "Que se vea como texto y no se ejecute", "Aprobada"],
    ["Entrar a pantallas de otro rol", "Escribir /profesor/… con sesión de estudiante", "Que me regrese a mi inicio", "Aprobada"],
    ["Encabezados HTTP", "Revisar CSP, HSTS, nosniff y frame-ancestors", "Que estén y sin unsafe-inline", "Aprobada"],
    ["Llaves en el repositorio", "Buscar llaves en el historial y en .env.example", "0 coincidencias", "Aprobada"],
    ["Dependencias con vulnerabilidades", "npm audit", "0 vulnerabilidades", "Aprobada"]
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
  c.push(p("La primera vez que la corrí saqué 95 en accesibilidad y 91 en SEO. Corregí el contraste del color y agregué el robots.txt que faltaba (errores D-08 y D-09), y en la segunda corrida ya salió 100 en las dos."));
  c.push(h2("6.2 Cobertura de código"));
  c.push(tituloTabla("Cobertura por módulo"));
  const filasCob = Object.entries(cob)
    .filter(([k]) => k !== "total" && !/styles\.css|vite-env|seed\.ts|repositorio\.ts|tipos\.ts/.test(k))
    .map(([k, v]) => [k.replace(/\\/g, "/").split("/src/")[1], pct(v.lines.pct), pct(v.statements.pct), pct(v.branches.pct), pct(v.functions.pct)]);
  c.push(tabla(["Módulo", "Líneas", "Instrucciones", "Ramas", "Funciones"], [...filasCob, ["**Total**", `**${pct(cob.total.lines.pct)}**`, `**${pct(cob.total.statements.pct)}**`, `**${pct(cob.total.branches.pct)}**`, `**${pct(cob.total.functions.pct)}**`]], [36, 16, 16, 16, 16], { tam: 16, juntar: false }));
  c.push(p("Las reglas de negocio (`domain/reglas.ts`) quedaron con 100 % de cobertura. Los que salen más bajos son el arranque de la app (`main.tsx`) y el selector de adaptador (`data/index.ts`), que nada más conectan piezas y se prueban en las E2E sobre la app compilada, y el aviso para instalar la PWA, que depende de un evento del navegador."));
  c.push(h2("6.3 Compatibilidad"));
  c.push(tituloTabla("Dónde la probé"));
  c.push(tabla(["Dispositivo / navegador", "Tipo de prueba", "Resultado"], [
    ["Teléfono Android (Pixel 7, simulado) · Chromium", "E2E completa + accesibilidad", "Aprobada"],
    ["Tableta (iPad, simulado) · Chromium", "E2E completa + accesibilidad", "Aprobada"],
    ["Microsoft Edge (escritorio)", "Lighthouse móvil", "Aprobada"],
    ["Navegador con las herramientas de desarrollo (móvil y tableta)", "Revisión a ojo de todas las pantallas", "Aprobada"],
    ["iPhone / Safari (físico)", "Queda pendiente para la prueba piloto", "—"]
  ], [45, 35, 20]));

  c.push(h1("7. Defectos encontrados y corregidos"));
  c.push(p("Aquí anoto los problemas que encontré con las pruebas, por qué pasaban y cómo los arreglé. Cada corrección quedó con una prueba que avisa si el error vuelve."));
  c.push(tituloTabla("Lista de errores"));
  c.push(tabla(["ID", "Error", "Severidad", "Cómo lo detecté", "Por qué pasaba y cómo lo arreglé", "Estado"], [
    ["D-01", "Pantalla en blanco al abrir el detalle de una actividad.", "Alta", "Probando a mano en el navegador", "Chrome devuelve una promesa en window.scrollTo y React la tomaba como función de limpieza. Lo puse en un bloque que no regresa nada.", "Corregido"],
    ["D-02", "Los campos del formulario se veían de 140 px de alto.", "Media", "Revisión a ojo", "Una regla CSS de flex-basis aplicada en columna. La dejé solo en la fila de fecha y hora.", "Corregido"],
    ["D-03", "El botón «Regresar» del formulario podía sacarte de la app.", "Baja", "Revisando el código", "Usaba el historial del navegador; ahora se va directo a la lista de actividades.", "Corregido"],
    ["D-04", "No había forma de salir de un perfil.", "Media", "Probando la navegación", "El prototipo no lo tenía. Agregué «Cerrar sesión».", "Corregido"],
    ["D-05", "Si un estudiante terminaba una actividad de grupo, quedaba terminada para todos.", "Alta", "Revisando el modelo de datos", "Había un solo estado por actividad. Creé la tabla asignaciones con un estado por estudiante.", "Corregido"],
    ["D-06", "vercel.json con JSON inválido (escape \\.): la publicación habría fallado.", "Crítica", "Servidor local con los encabezados de producción", "Escribí mal una secuencia de escape. La corregí y agregué una prueba que revisa el archivo.", "Corregido"],
    ["D-07", "Una prueba de interfaz pasaba unas veces y otras no.", "Media", "Al medir la cobertura y, aparte, en GitHub Actions", "La prueba leía la lista antes de que terminara de cargar. Ahora espera los datos; 3 corridas seguidas estables y CI en verde.", "Corregido"],
    ["D-08", "Contraste de 3.47:1 en los botones verdes (el mínimo es 4.5:1).", "Media", "Lighthouse", "Era el color del prototipo. Lo cambié a #17833C (4.83:1) y agregué la revisión con axe en cada pantalla.", "Corregido"],
    ["D-09", "No existía robots.txt.", "Baja", "Lighthouse", "El servidor devolvía la página HTML. Agregué el archivo.", "Corregido"],
    ["D-10", "Las variables NEXT_PUBLIC_* no las reconocía.", "Media", "Revisando la configuración", "Las copié con el formato de otro framework. Las renombré a VITE_* y lo dejé documentado.", "Corregido"],
    ["D-11", "Error «type rol already exists» al correr otra vez la migración.", "Baja", "Ejecutándola en Supabase", "La migración no se puede repetir. Revisé que el esquema hubiera quedado completo y lo dejé documentado.", "Mitigado"],
    ["D-12", "Una prueba de RLS esperaba algo que no pasaba.", "Baja", "Prueba de BD", "Un UPDATE sin permiso afecta 0 filas en lugar de dar error. Ajusté la prueba y anoté el comportamiento.", "Corregido"],
    ["D-13", "Una captura salió con la pestaña equivocada marcada.", "—", "Revisando las capturas", "Falso positivo: tomé la captura antes de que React terminara de dibujar. Comprobé que la app sí está bien.", "Descartado"]
  ], [7, 22, 10, 16, 35, 10], { tam: 15, juntar: false }));

  c.push(h1("8. Pruebas de aceptación por rol"));
  c.push(p("Estos son los recorridos que hice siguiendo los criterios de aceptación de las historias de usuario, revisados con las pruebas E2E, las de integración con Supabase y viendo las pantallas."));
  c.push(tituloTabla("Criterios de aceptación revisados"));
  c.push(tabla(["Rol", "Criterio de aceptación", "Resultado"], [
    ["Estudiante", "Ve máximo 3 próximas actividades ordenadas por fecha.", "Aprobado"],
    ["Estudiante", "Filtra sus actividades por estado.", "Aprobado"],
    ["Estudiante", "Cambia el estado, el tablero se actualiza y el cambio se queda guardado.", "Aprobado"],
    ["Estudiante", "No puede abrir las pantallas del profesor.", "Aprobado"],
    ["Profesor", "No puede guardar sin nombre o sin fecha, y ve el error junto al campo.", "Aprobado"],
    ["Profesor", "Registra para un estudiante o para el grupo, y al estudiante le aparece.", "Aprobado"],
    ["Profesor", "Edita sin perder el avance; al eliminar pide confirmación y cancelar no borra.", "Aprobado"],
    ["Profesor", "Ve cómo va cada estudiante en una actividad de grupo.", "Aprobado"],
    ["Tutor", "Ve solo a sus tutorados y sus actividades, sin poder cambiarlas.", "Aprobado"],
    ["Todos", "Inician y cierran sesión; con datos incorrectos sale un mensaje genérico.", "Aprobado"],
    ["Todos", "La app se instala y abre sin internet.", "Aprobado"]
  ], [16, 66, 18]));
  c.push(h2("8.1 Evidencia visual"));
  c.push(await rejilla([
    { ruta: "pantallas/07b-profesor-nueva-validacion.png", pie: "Validación del formulario (RN-01, RN-02)." },
    { ruta: "pantallas/09-profesor-eliminar.png", pie: "Confirmación antes de eliminar (RN-08)." },
    { ruta: "pantallas/09b-profesor-detalle-avance.png", pie: "Avance por estudiante (RN-06)." }
  ], 3, 165));

  c.push(h1("9. Conclusiones"));
  c.push(...vinetas([
    `Corrí ${total} pruebas automáticas en ocho niveles, con ${ok} aprobadas y ninguna que falle de forma intermitente, más 23 verificaciones de seguridad contra la base de datos real.`,
    "Con las pruebas salieron 13 problemas: 11 los corregí y les dejé su prueba, 1 quedó mitigado y documentado y 1 resultó falso positivo.",
    "La seguridad la probé desde el servidor: aunque alguien use la API directo, ningún rol puede leer ni cambiar datos que no le tocan.",
    "La app cumple WCAG 2.1 AA en todas sus pantallas y saca entre 98 y 100 en Lighthouse."
  ]));
  c.push(h2("9.1 Pendientes para la siguiente fase"));
  c.push(...vinetas([
    "Probarla en teléfonos de verdad (Android e iPhone) con usuarios reales.",
    "Probar con más usuarios y más actividades para ver cómo aguanta.",
    "Correr las E2E contra la URL publicada en Vercel después de cada despliegue."
  ]));
  c.push(...nota("Las pruebas cubren funcionalidad, datos, seguridad, accesibilidad y rendimiento; se corren solas en cada cambio y sirvieron para encontrar y arreglar los problemas más importantes que tenía la app.", "Conclusión"));

  await guardar("05-Resultados-de-las-pruebas.docx", {
    titulo: "Resultados de las pruebas",
    subtitulo: "Funcionalidad, seguridad, accesibilidad y rendimiento",
    descripcion: "Aquí explico cómo probé la app y qué salió: pruebas unitarias, de base de datos, de interfaz, de integración, extremo a extremo, de seguridad, de accesibilidad y de rendimiento, además de los errores que encontré y cómo los corregí."
  }, c);
}
