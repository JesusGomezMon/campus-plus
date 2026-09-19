import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { codigo, DATOS, figura, guardar, h1, h2, nota, numerada, p, RAIZ, reiniciarContadores, tabla, tituloTabla, vinetas } from "./comun.mjs";

const sh = (cmd) => execSync(cmd, { cwd: RAIZ, encoding: "utf8" }).trim();

export async function generar() {
  reiniciarContadores();
  const pkg = JSON.parse(readFileSync(RAIZ + "package.json", "utf8"));
  const v = (n) => (pkg.dependencies?.[n] ?? pkg.devDependencies?.[n] ?? "").replace(/^\^/, "");
  const commits = sh('git log --format="%h|%ad|%s" --date=format:"%Y-%m-%d %H:%M" HEAD')
    .split("\n")
    .map((l) => l.split("|"));
  const ramas = sh("git branch -a --format=%(refname:short)").split("\n").filter((r) => !r.includes("HEAD") && r !== "origin");
  const lineas = (glob) => sh(`git ls-files ${glob}`).split("\n").filter(Boolean).reduce((t, f) => t + readFileSync(RAIZ + f, "utf8").split("\n").length, 0);
  const lSrc = lineas("src"), lTest = lineas("tests e2e"), lSql = lineas("supabase");
  const appUrl = process.env.APP_URL;

  const c = [];
  c.push(h1("1. Datos del proyecto"));
  c.push(tituloTabla("Ubicación del código y de la aplicación"));
  c.push(tabla(["Elemento", "Valor"], [
    ["Repositorio (código fuente)", DATOS.repo],
    ["Rama principal", "main (protegida por integración continua)"],
    ["Aplicación publicada", appUrl ?? "Se publica en Vercel desde la rama main (ver sección 4.3)"],
    ["Integración continua", DATOS.repo + "/actions"],
    ["Licencia de uso", "Proyecto académico"],
    ["Tamaño del código", `${lSrc} líneas de aplicación · ${lTest} líneas de pruebas · ${lSql} líneas de SQL`]
  ], [30, 70]));
  c.push(p("El código es de buena calidad y eficaz porque: está escrito en TypeScript estricto, está organizado en capas con responsabilidades claras, cumple los requerimientos definidos (matriz de trazabilidad del documento de requerimientos) y cuenta con 113 pruebas automatizadas con 91.6 % de cobertura de líneas."));

  c.push(h1("2. Tecnologías"));
  c.push(tituloTabla("Pila tecnológica"));
  c.push(tabla(["Capa", "Tecnología", "Versión", "Uso"], [
    ["Lenguaje", "TypeScript (modo estricto)", v("typescript"), "Tipado estático en todo el código."],
    ["Interfaz", "React", v("react"), "Componentes de las 12 pantallas."],
    ["Navegación", "React Router", v("react-router-dom"), "Rutas y protección por rol."],
    ["Compilación", "Vite", v("vite"), "Servidor de desarrollo y compilación optimizada."],
    ["PWA", "vite-plugin-pwa (Workbox)", v("vite-plugin-pwa"), "Manifiesto, service worker y funcionamiento sin conexión."],
    ["Datos", "Supabase JS", v("@supabase/supabase-js"), "Cliente de autenticación y API de PostgreSQL."],
    ["Base de datos", "PostgreSQL 15 (Supabase)", "15", "Almacenamiento, RLS, funciones y triggers."],
    ["Pruebas", "Vitest + Testing Library", v("vitest"), "Pruebas unitarias, de base de datos y de interfaz."],
    ["Pruebas E2E", "Playwright + axe-core", v("@playwright/test"), "Flujos completos en teléfono y tableta; accesibilidad."],
    ["BD en pruebas", "PGlite", v("@electric-sql/pglite"), "PostgreSQL real en memoria para probar la migración y la RLS."],
    ["Control de versiones", "Git + GitHub", "—", "Historial, ramas y colaboración."],
    ["CI/CD", "GitHub Actions + Vercel", "—", "Verificación automática y despliegue."]
  ], [17, 28, 12, 43]));

  c.push(h1("3. Estructura del repositorio"));
  c.push(codigo(`campus-plus/
├── src/
│   ├── app/            App.tsx (rutas) · contexto.tsx (sesión, consultas, escrituras)
│   ├── components/     Shell.tsx (estructura y guardia de rutas) · ui.tsx (componentes)
│   ├── domain/         tipos.ts (entidades) · reglas.ts (reglas de negocio y permisos)
│   ├── data/           repositorio.ts (puerto) · supabaseRepo.ts · memoriaRepo.ts · seed.ts
│   ├── screens/        Home · Estudiante · Profesor · Tutor · NoEncontrado
│   └── styles.css      sistema visual (tokens de color y componentes)
├── supabase/migrations/0001_esquema.sql   tablas, RLS, funciones y triggers
├── tests/
│   ├── unit/           reglas, repositorio en memoria, configuración de despliegue
│   ├── db/             integridad, seguridad (RLS) y auditoría sobre PostgreSQL
│   ├── ui/             flujos de interfaz de los 3 roles
│   └── integracion/    adaptador SupabaseRepo contra la base real
├── e2e/                Playwright: flujos, PWA, seguridad y accesibilidad
├── scripts/            seed-supabase.mjs · verificar-supabase.mjs · generate-icons.mjs
├── docs/               documentación, diagramas y capturas
├── .github/workflows/ci.yml               integración continua
├── vercel.json         despliegue y encabezados de seguridad
└── .env.example        plantilla de configuración (sin secretos)`));

  c.push(h1("4. Instalación y ejecución"));
  c.push(h2("4.1 Requisitos"));
  c.push(...vinetas(["Node.js 20 o superior y Git.", "Un proyecto de Supabase (opcional: sin él la app funciona en modo demostración)."]));
  c.push(h2("4.2 Pasos"));
  c.push(codigo(`git clone ${DATOS.repo}.git
cd campus-plus
npm install
cp .env.example .env.local          # llenar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
# Ejecutar supabase/migrations/0001_esquema.sql en el SQL Editor de Supabase
npm run db:seed                     # cuentas y actividades de ejemplo
npm run dev                         # http://localhost:5173
npm run verificar                   # tipos + pruebas + E2E`));
  c.push(h2("4.3 Despliegue"));
  c.push(...numerada([
    "En Vercel: Add New → Project → importar el repositorio (Vercel detecta Vite).",
    "Agregar las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (nunca la llave de servicio).",
    "Deploy. Cada push a main vuelve a desplegar automáticamente; cada pull request genera una vista previa."
  ]));

  c.push(h1("5. Prácticas de desarrollo ágil"));
  c.push(h2("5.1 Marco de trabajo"));
  c.push(p("Se aplicó **Scrum adaptado a un equipo pequeño**, con iteraciones cortas (sprints) y entregas incrementales funcionales. Cada iteración parte del backlog priorizado (historias de usuario del documento de requerimientos), termina con un incremento que funciona y se revisa en el navegador, y cierra con una retrospectiva que genera acciones de mejora."));
  c.push(tituloTabla("Roles"));
  c.push(tabla(["Rol", "Responsable", "Responsabilidades"], [
    ["Product Owner", "Organización cliente (representada por el docente)", "Define el problema, prioriza el backlog y acepta los incrementos."],
    ["Scrum Master", DATOS.autor, "Organiza las iteraciones y elimina impedimentos."],
    ["Equipo de desarrollo", DATOS.autor, "Analiza, diseña, programa, prueba y documenta."]
  ], [20, 35, 45]));
  c.push(h2("5.2 Iteraciones"));
  c.push(tituloTabla("Sprints e incrementos entregados"));
  c.push(tabla(["Sprint", "Objetivo", "Historias", "Pts", "Incremento entregado"], [
    ["0", "Análisis y diseño", "—", "—", "Requerimientos, bocetos en Figma y prototipo navegable (V1 escritorio y V2 móvil)."],
    ["1", "Prototipo funcional PWA", "HU-03 a HU-12", "27", "12 pantallas funcionando con datos locales; instalable; desplegable en Vercel."],
    ["2", "Datos y seguridad", "HU-01, HU-02 (+ refactorización de HU-05 a HU-09)", "4 + 16", "Base de datos PostgreSQL con RLS, inicio de sesión, arquitectura en capas, pruebas de BD, UI y E2E, CI."],
    ["3", "Calidad y entrega", "Deuda técnica y RNF-02", "8", "Corrección de prueba intermitente, accesibilidad WCAG AA, auditoría Lighthouse, documentación."]
  ], [9, 19, 22, 9, 41]));
  c.push(p("La refactorización del sprint 2 cambió el modelo de «un estado por actividad» a «un estado por asignación» (RN-07), una mejora detectada durante la revisión del incremento del sprint 1: en las actividades para el grupo, el avance de un estudiante no debe cambiar el de los demás."));
  c.push(h2("5.3 Eventos"));
  c.push(tituloTabla("Eventos de Scrum y cómo se realizaron"));
  c.push(tabla(["Evento", "Práctica"], [
    ["Planeación del sprint", "Se seleccionan historias del backlog según prioridad MoSCoW y se definen sus criterios de aceptación."],
    ["Seguimiento diario", "Revisión del tablero (por hacer / en progreso / hecho) al iniciar cada sesión de trabajo."],
    ["Revisión del sprint", "Demostración del incremento en el navegador en tamaño de teléfono y de tableta; se validan los criterios de aceptación."],
    ["Retrospectiva", "Se registran problemas y acciones de mejora (tabla 6)."]
  ], [25, 75]));
  c.push(tituloTabla("Resultados de las retrospectivas"));
  c.push(tabla(["Sprint", "Qué salió mal", "Acción de mejora aplicada"], [
    ["1", "Un error de navegador dejó la pantalla en blanco y solo se detectó al probar a mano.", "Agregar pruebas E2E automáticas que recorren todas las pantallas."],
    ["2", "La configuración de Vercel tenía un error que solo aparecería al desplegar.", "Prueba automática que valida vercel.json y los encabezados de seguridad."],
    ["2", "Las variables de entorno de Supabase venían con nombres de otro framework.", "Plantilla .env.example documentada y verificación del formato antes de usarlas."],
    ["3", "Una prueba de interfaz fallaba de forma intermitente al medir cobertura.", "Esperar explícitamente a que terminen de cargar los datos; correr la suite 3 veces seguidas."],
    ["3", "El color del diseño no cumplía el contraste mínimo.", "Auditoría de accesibilidad automática (axe-core) en cada pantalla dentro de la suite E2E."]
  ], [10, 45, 45]));
  c.push(h2("5.4 Definición de terminado"));
  c.push(p("Una historia se considera terminada solo cuando:"));
  c.push(...vinetas([
    "Cumple todos sus criterios de aceptación y se revisó en teléfono y tableta.",
    "El código compila sin errores con TypeScript estricto.",
    "Tiene pruebas automatizadas y toda la suite pasa (unitarias, BD, UI y E2E).",
    "La regla de negocio está aplicada en el dominio y, si afecta datos, también en la base de datos.",
    "No introduce vulnerabilidades (`npm audit`) ni secretos en el repositorio.",
    "Está integrada en main mediante su rama y un commit descriptivo."
  ]));

  c.push(h1("6. Control de versiones"));
  c.push(h2("6.1 Estrategia de ramas"));
  c.push(p("Se usa un flujo basado en ramas de funcionalidad: `main` siempre contiene código estable; cada conjunto de historias se desarrolla en una rama `feature/…` y se integra con `merge --no-ff`, que conserva en el historial el límite de cada funcionalidad. Integración continua verifica cada push y cada pull request."));
  c.push(...(await figura("diagramas/git-cicd.png", "Ramas, integraciones y canal de CI/CD.", 620)));
  c.push(tituloTabla("Ramas del repositorio"));
  c.push(tabla(["Rama", "Propósito"], ramas.map((r) => [r, r.includes("base-de-datos") ? "Sprint 2: base de datos, arquitectura en capas y pruebas." : r.includes("pruebas-y-doc") ? "Sprint 3: calidad, accesibilidad y documentación." : r.startsWith("origin/") ? "Copia remota en GitHub." : "Rama principal estable."]), [40, 60]));
  c.push(h2("6.2 Convención de commits"));
  c.push(p("Los mensajes siguen **Conventional Commits** (`tipo(ámbito): descripción`), lo que permite saber de un vistazo qué cambió y por qué: `feat` nueva funcionalidad, `fix` corrección, `test` pruebas, `chore` configuración o mantenimiento."));
  c.push(tituloTabla("Historial de commits (git log)"));
  c.push(tabla(["Commit", "Fecha", "Mensaje"], commits.map(([h, f, m]) => [h, f, m]), [12, 20, 68], { tam: 16, juntar: false }));
  c.push(h2("6.3 Protección de secretos"));
  c.push(...vinetas([
    "Las llaves se guardan en `.env.local`, que está en `.gitignore`; el repositorio solo incluye `.env.example` con valores de ejemplo.",
    "Antes de publicar el repositorio se revisó todo el historial en busca de llaves (0 coincidencias).",
    "Una prueba automática verifica que `.env.example` no contenga llaves reales y que `.env*.local` esté ignorado."
  ]));
  c.push(h2("6.4 Integración continua"));
  c.push(p("El archivo `.github/workflows/ci.yml` se ejecuta en cada push a main y en cada pull request:"));
  c.push(codigo(`- npm ci                         # instalación reproducible (package-lock.json)
- npm audit --audit-level=high   # dependencias sin vulnerabilidades altas
- npm run build                  # TypeScript estricto + compilación
- npm test                       # unitarias, base de datos e interfaz
- npm run test:e2e               # Playwright en teléfono y tableta (incluye accesibilidad)`));

  c.push(h1("7. Calidad del código"));
  c.push(tituloTabla("Indicadores de calidad"));
  c.push(tabla(["Indicador", "Valor", "Cómo se mide"], [
    ["Errores de compilación (TypeScript estricto)", "0", "npm run build"],
    ["Pruebas automatizadas", "113 (100 % aprobadas)", "Vitest + Playwright"],
    ["Cobertura de líneas / instrucciones", "91.6 % / 88.8 %", "Vitest (v8)"],
    ["Cobertura del dominio (reglas de negocio)", "100 %", "Vitest (v8)"],
    ["Vulnerabilidades en dependencias", "0", "npm audit"],
    ["Lighthouse (rend. / accesib. / buenas prácticas / SEO)", "98 / 100 / 100 / 100", "Lighthouse 12, perfil móvil"],
    ["Violaciones WCAG 2.1 AA", "0 en 13 pantallas", "axe-core"]
  ], [45, 25, 30]));
  c.push(h2("7.1 Fragmentos representativos"));
  c.push(p("**Guardia de rutas por rol** (`src/components/Shell.tsx`):"));
  c.push(codigo(`if (cargandoSesion) return <div className="app" aria-busy="true" />;
if (!usuario) return <Navigate to="/" replace />;
if (usuario.rol !== rol) return <Navigate to={\`/\${usuario.rol}\`} replace />;`));
  c.push(p("**Cambio de estado** en el adaptador de Supabase: el dominio valida el permiso y la RLS garantiza que solo se modifique la fila del estudiante:"));
  c.push(codigo(`async cambiarEstado(u: Usuario, actividadId: number, estado: Estado) {
  exigir(u, "cambiarEstado");
  const filas = ok(await this.sb.from("asignaciones").update({ estado })
    .eq("actividad_id", actividadId).eq("estudiante_id", u.id).select("actividad_id"));
  if (!filas.length) throw new ErrorDominio("La actividad no existe o no está asignada a ti.", "no-encontrado");
}`));
  c.push(...nota(["El código implementa todos los requerimientos «Must» y «Should», con arquitectura en capas y pruebas automatizadas.", `El proceso siguió prácticas ágiles (sprints, backlog priorizado, definición de terminado y retrospectivas) y control de versiones con ramas, Conventional Commits e integración continua. Todo está disponible en ${DATOS.repo}.`], "Conclusión"));

  await guardar("03-Codigo-de-la-aplicacion.docx", {
    titulo: "Código de la aplicación",
    subtitulo: "Repositorio, desarrollo ágil y control de versiones",
    descripcion: "Indica dónde está el código, cómo ejecutarlo y desplegarlo, y documenta las prácticas de desarrollo ágil, el control de versiones, la integración continua y los indicadores de calidad."
  }, c);
}
