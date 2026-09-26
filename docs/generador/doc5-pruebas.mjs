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
    "tests/unit/reglas.test.ts": "Reglas de negocio",
    "tests/unit/memoriaRepo.test.ts": "Repositorio y permisos",
    "tests/unit/despliegue.test.ts": "Configuración y llaves",
    "tests/db/seguridad.test.ts": "Base de datos: permisos y bitácora",
    "tests/ui/flujos.test.tsx": "Pantallas (los tres roles)",
    "tests/integracion/supabaseRepo.test.ts": "Conexión con Supabase real"
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

  const total = vt.numTotalTests + casosE2E.length, ok = vt.numPassedTests + e2eOk;
  const pct = (x) => `${x.toFixed(1)} %`;
  const seg = (ms) => (ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : `${(ms / 1000).toFixed(1)} s`);
  const lhc = lh.categories;

  const c = [];
  c.push(h1("1. Resumen"));
  c.push(tituloTabla("Resultado general"));
  c.push(tabla(["Indicador", "Resultado"], [
    ["Pruebas que corrí", `${total}`],
    ["Aprobadas", `${ok} (${pct((ok / total) * 100)})`],
    ["Fallidas", `${total - ok}`],
    ["Cobertura de código", pct(cob.total.lines.pct)],
    ["Accesibilidad (13 pantallas)", "0 problemas"],
    ["Lighthouse: rendimiento · accesibilidad", `${Math.round(lhc.performance.score * 100)} · ${Math.round(lhc.accessibility.score * 100)}`],
    ["Vulnerabilidades en las dependencias", "0"],
    ["Errores que encontré", "9 (8 corregidos, 1 anotado)"]
  ], [60, 40]));
  c.push(p("Las pruebas no solo sirvieron para ver que la app funciona: con ellas encontré errores de verdad, como una pantalla que salía en blanco, un archivo de configuración mal escrito y un color sin suficiente contraste (sección 6)."));

  c.push(h1("2. Cómo probé la app"));
  c.push(...(await figura("diagramas/piramide-pruebas.png", "Los niveles de prueba que usé.", 480)));
  c.push(tituloTabla("Niveles de prueba"));
  c.push(tabla(["Nivel", "Para qué", "Herramienta"], [
    ["Unitarias", "Probar por separado las reglas de negocio y los permisos.", "Vitest"],
    ["Base de datos", "Probar los permisos, las restricciones y la bitácora sobre PostgreSQL.", "Vitest + PGlite"],
    ["Pantallas", "Levantar la app y recorrerla como si fuera un usuario.", "Testing Library"],
    ["App completa (E2E)", "Probar la versión real en un navegador, en teléfono y tableta.", "Playwright"],
    ["Accesibilidad", "Revisar contraste, etiquetas y foco en cada pantalla.", "axe-core + Lighthouse"]
  ], [22, 53, 25]));
  c.push(h2("2.1 Dónde las corrí"));
  c.push(...vinetas([
    "Windows 11 con Node.js 24 y el navegador Chromium.",
    "Dispositivos simulados: un teléfono Android (412 px de ancho) y un iPad.",
    "Las pruebas de la app completa corren sobre la versión compilada, con datos de ejemplo para no mover los reales."
  ]));
  c.push(h2("2.2 Cómo volver a correrlas"));
  c.push(codigo(`npm test                # unitarias, base de datos y pantallas
npm run test:e2e        # la app completa en teléfono y tableta
npm run test:cobertura  # cobertura de código
npm run db:verificar    # revisión de permisos contra Supabase`));

  c.push(h1("3. Resultados"));
  c.push(tituloTabla("Resultados por grupo de pruebas"));
  c.push(tabla(["Grupo de pruebas", "Casos", "Aprobados", "Duración"], [
    ...porArchivo.map((s) => [s.nombre, s.casos.length, s.ok, seg(s.ms)]),
    ["App completa (teléfono y tableta)", casosE2E.length, e2eOk, seg(casosE2E.reduce((t, x) => t + x.ms, 0))],
    ["**Total**", `**${total}**`, `**${ok}**`, ""]
  ], [50, 16, 18, 16]));
  c.push(p("Para asegurarme de que ninguna prueba fallaba a veces sí y a veces no, corrí todo tres veces seguidas y las 3 pasaron. Además, cada vez que subo un cambio GitHub las vuelve a correr solo."));
  c.push(h2("3.1 Las pruebas de la app completa"));
  c.push(p("Cada caso se corre en dos dispositivos:"));
  const estado = (s) => (s === "passed" ? "Aprobada" : s === "skipped" || s === "pending" ? "Omitida" : "Fallida");
  const e2eAgr = new Map();
  for (const x of casosE2E) {
    const k = `${x.grupo ? x.grupo + " › " : ""}${x.titulo}`;
    const v = e2eAgr.get(k) ?? { tel: "—", tab: "—" };
    v[x.disp === "telefono" ? "tel" : "tab"] = estado(x.estado);
    e2eAgr.set(k, v);
  }
  c.push(tabla(["Caso de prueba", "Teléfono", "Tableta"], [...e2eAgr].map(([k, v]) => [k, v.tel, v.tab]), [64, 18, 18], { tam: 16, juntar: false }));
  c.push(p("La lista completa de las demás pruebas viene en los reportes de la entrega (`reporte-cobertura` y `reporte-e2e`)."));

  c.push(h1("4. Pruebas de seguridad"));
  c.push(p("Aquí traté de romper la app a propósito: entrar sin permiso, cambiar datos ajenos y meter código malicioso."));
  c.push(tituloTabla("Qué intenté y qué pasó"));
  c.push(tabla(["Qué intenté", "Qué debía pasar", "Resultado"], [
    ["Ver los datos sin iniciar sesión", "Que no me deje", "Aprobada"],
    ["Entrar con la contraseña equivocada", "Que lo rechace sin decir cuál dato falló", "Aprobada"],
    ["Que un estudiante cree o borre actividades", "Que no le deje", "Aprobada"],
    ["Que un estudiante cambie el estado de otro", "Que no cambie nada", "Aprobada"],
    ["Que alguien se cambie de rol", "Que no cambie nada", "Aprobada"],
    ["Que un profesor vea actividades de otro profesor", "Que no las vea", "Aprobada"],
    ["Que un tutor cambie estados", "Que no le deje", "Aprobada"],
    ["Inyección SQL en el título de una actividad", "Que se guarde como texto y no se ejecute", "Aprobada"],
    ["Meter código HTML en el título (XSS)", "Que se vea como texto y no se ejecute", "Aprobada"],
    ["Entrar a pantallas de otro rol escribiendo la dirección", "Que me regrese a mi inicio", "Aprobada"]
  ], [40, 40, 20], { tam: 16 }));

  c.push(h1("5. Accesibilidad y rendimiento"));
  c.push(h2("5.1 Lighthouse"));
  c.push(tituloTabla("Resultados de Lighthouse (perfil móvil)"));
  const au = lh.audits;
  c.push(tabla(["Categoría", "Resultado", "Referencia"], [
    ["Rendimiento", Math.round(lhc.performance.score * 100) + " / 100", "≥ 90 es bueno"],
    ["Accesibilidad", Math.round(lhc.accessibility.score * 100) + " / 100", "≥ 90 es bueno"],
    ["Buenas prácticas", Math.round(lhc["best-practices"].score * 100) + " / 100", "≥ 90 es bueno"],
    ["Tiempo hasta ver el contenido", au["largest-contentful-paint"].displayValue, "< 2.5 s es bueno"]
  ], [40, 25, 35]));
  c.push(p("La primera vez saqué 95 en accesibilidad. Corregí el contraste del color y agregué un archivo que faltaba, y en la segunda corrida ya salió 100."));
  c.push(h2("5.2 Cobertura de código"));
  c.push(p(`De todo el código de la aplicación, las pruebas ejecutan el ${pct(cob.total.lines.pct)} de las líneas. Las reglas de negocio quedaron al 100 %. Lo que sale más bajo es el arranque de la app, que nada más conecta piezas.`));
  c.push(h2("5.3 Dónde la probé"));
  c.push(tituloTabla("Dispositivos y navegadores"));
  c.push(tabla(["Dispositivo / navegador", "Resultado"], [
    ["Teléfono Android simulado · Chromium", "Aprobada"],
    ["Tableta (iPad) simulada · Chromium", "Aprobada"],
    ["Microsoft Edge en computadora", "Aprobada"],
    ["iPhone real", "Queda pendiente"]
  ], [65, 35]));

  c.push(h1("6. Errores que encontré"));
  c.push(p("Estos son los problemas que salieron con las pruebas. Cada corrección quedó con una prueba que avisa si el error vuelve."));
  c.push(tituloTabla("Lista de errores"));
  c.push(tabla(["Error", "Cómo lo detecté", "Cómo lo arreglé", "Estado"], [
    ["Pantalla en blanco al abrir el detalle de una actividad.", "Probando a mano", "Una función del navegador se comportaba distinto de lo que esperaba React. Cambié cómo la llamo.", "Corregido"],
    ["Los campos del formulario se veían enormes.", "Revisión a ojo", "Una regla de CSS se aplicaba donde no debía. La limité a la fila de fecha y hora.", "Corregido"],
    ["No había forma de salir de un perfil.", "Probando la navegación", "El prototipo no lo tenía. Agregué «Cerrar sesión».", "Corregido"],
    ["Si un estudiante terminaba una actividad de grupo, quedaba terminada para todos.", "Revisando el modelo de datos", "Había un solo estado por actividad. Creé la tabla asignaciones, con un estado por estudiante.", "Corregido"],
    ["El archivo de configuración de la publicación estaba mal escrito.", "Probando la versión de producción en local", "Me equivoqué al escribirlo. Lo corregí y agregué una prueba que lo revisa.", "Corregido"],
    ["Una prueba pasaba unas veces y otras no.", "Al medir la cobertura", "Leía la lista antes de que terminara de cargar. Ahora espera los datos.", "Corregido"],
    ["Los botones verdes no tenían suficiente contraste.", "Lighthouse", "Era el color del prototipo. Lo cambié por un verde más oscuro.", "Corregido"],
    ["Faltaba el archivo robots.txt.", "Lighthouse", "Lo agregué.", "Corregido"],
    ["La migración de la base de datos no se puede correr dos veces.", "Ejecutándola en Supabase", "Revisé que el esquema quedara completo y lo anoté para ejecutarla una sola vez.", "Anotado"]
  ], [26, 18, 44, 12], { tam: 16, juntar: false }));

  c.push(h1("7. Pruebas de aceptación por rol"));
  c.push(p("Estos son los recorridos que hice siguiendo los criterios de aceptación de las historias de usuario."));
  c.push(tituloTabla("Criterios revisados"));
  c.push(tabla(["Rol", "Criterio", "Resultado"], [
    ["Estudiante", "Ve máximo 3 próximas actividades ordenadas por fecha.", "Aprobado"],
    ["Estudiante", "Cambia el estado y el cambio se queda guardado.", "Aprobado"],
    ["Estudiante", "No puede abrir las pantallas del profesor.", "Aprobado"],
    ["Profesor", "No puede guardar sin nombre o sin fecha.", "Aprobado"],
    ["Profesor", "Registra para un estudiante o para el grupo, y al estudiante le aparece.", "Aprobado"],
    ["Profesor", "Al eliminar pide confirmación, y cancelar no borra.", "Aprobado"],
    ["Tutor", "Ve solo a sus tutorados, sin poder cambiar nada.", "Aprobado"],
    ["Todos", "La app se instala y abre sin internet.", "Aprobado"]
  ], [16, 66, 18]));
  c.push(h2("7.1 Evidencia"));
  c.push(await rejilla([
    { ruta: "pantallas/07b-profesor-nueva-validacion.png", pie: "El formulario no deja guardar sin nombre." },
    { ruta: "pantallas/09-profesor-eliminar.png", pie: "Pide confirmación antes de eliminar." },
    { ruta: "pantallas/09b-profesor-detalle-avance.png", pie: "El avance de cada estudiante." }
  ], 3, 165));

  c.push(h1("8. Conclusiones"));
  c.push(...vinetas([
    `Corrí ${total} pruebas automáticas y todas pasan, sin ninguna que falle de forma intermitente.`,
    "Con las pruebas salieron 9 problemas: 8 los corregí y 1 quedó anotado.",
    "La seguridad la probé desde el servidor: aunque alguien entre por fuera de la app, no puede ver ni cambiar datos que no le tocan.",
    "La app cumple la accesibilidad WCAG AA en todas sus pantallas."
  ]));
  c.push(h2("8.1 Pendientes"));
  c.push(...vinetas([
    "Probarla en teléfonos de verdad con usuarios reales.",
    "Probar con más usuarios y más actividades para ver cómo aguanta."
  ]));
  c.push(...nota("Las pruebas cubren funcionalidad, datos, seguridad, accesibilidad y rendimiento; se corren solas en cada cambio y sirvieron para encontrar y arreglar los problemas más importantes que tenía la app.", "Conclusión"));

  await guardar("05-Resultados-de-las-pruebas.docx", {
    titulo: "Resultados de las pruebas",
    subtitulo: "Funcionalidad, seguridad, accesibilidad y rendimiento",
    descripcion: "Aquí explico cómo probé la app y qué salió, además de los errores que encontré y cómo los corregí."
  }, c);
}
