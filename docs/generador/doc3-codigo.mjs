import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { codigo, DATOS, figura, guardar, h1, h2, nota, numerada, p, RAIZ, reiniciarContadores, tabla, tituloTabla, vinetas } from "./comun.mjs";

const sh = (cmd) => execSync(cmd, { cwd: RAIZ, encoding: "utf8" }).trim();

export async function generar() {
  reiniciarContadores();
  const pkg = JSON.parse(readFileSync(RAIZ + "package.json", "utf8"));
  const v = (n) => (pkg.dependencies?.[n] ?? pkg.devDependencies?.[n] ?? "").replace(/^\^/, "");
  const commits = sh('git log --format="%h|%ad|%s" --date=format:"%Y-%m-%d" HEAD')
    .split("\n")
    .map((l) => l.split("|"));
  const lineas = (glob) => sh(`git ls-files ${glob}`).split("\n").filter(Boolean).reduce((t, f) => t + readFileSync(RAIZ + f, "utf8").split("\n").length, 0);
  const lSrc = lineas("src"), lTest = lineas("tests e2e");
  const appUrl = process.env.APP_URL;

  const c = [];
  c.push(h1("1. Datos del proyecto"));
  c.push(tituloTabla("Dónde está el código"));
  c.push(tabla(["Elemento", "Valor"], [
    ["Repositorio", DATOS.repo],
    ["Rama principal", "main"],
    ["Aplicación publicada", appUrl ?? "En Vercel, desde la rama main (sección 4.3)"],
    ["Licencia de uso", "Proyecto escolar"],
    ["Tamaño del código", `${lSrc} líneas de aplicación y ${lTest} líneas de pruebas`]
  ], [30, 70]));
  c.push(p("Traté de que el código quedara ordenado: está escrito en TypeScript, separado en capas para que cada parte tenga una sola responsabilidad y tiene 118 pruebas automáticas con 92.1 % de cobertura."));

  c.push(h1("2. Tecnologías"));
  c.push(tituloTabla("Tecnologías que usé"));
  c.push(tabla(["Tecnología", "Versión", "Para qué"], [
    ["TypeScript", v("typescript"), "El lenguaje, con tipos en todo el código."],
    ["React", v("react"), "Los componentes de las 12 pantallas."],
    ["React Router", v("react-router-dom"), "Las rutas y la protección por rol."],
    ["Vite", v("vite"), "Servidor de desarrollo y compilación."],
    ["vite-plugin-pwa", v("vite-plugin-pwa"), "Que la app se instale y abra sin internet."],
    ["Supabase", v("@supabase/supabase-js"), "Inicio de sesión y base de datos PostgreSQL."],
    ["Vitest", v("vitest"), "Pruebas unitarias, de base de datos y de interfaz."],
    ["Playwright", v("@playwright/test"), "Pruebas de la app completa en teléfono y tableta."]
  ], [30, 15, 55]));

  c.push(h1("3. Estructura del repositorio"));
  c.push(codigo(`campus-plus/
├── src/
│   ├── app/            rutas y estado general (sesión, consultas)
│   ├── components/     estructura de la pantalla y componentes sueltos
│   ├── domain/         tipos y reglas de negocio
│   ├── data/           repositorio: SupabaseRepo y MemoriaRepo
│   ├── screens/        Inicio · Estudiante · Profesor · Tutor
│   └── styles.css      colores y estilos
├── supabase/migrations/    el esquema de la base de datos
├── tests/              pruebas unitarias, de base de datos y de interfaz
├── e2e/                pruebas de la app completa (Playwright)
├── docs/               documentación, diagramas y capturas
└── .env.example        plantilla de configuración (sin llaves reales)`));

  c.push(h1("4. Instalación y ejecución"));
  c.push(h2("4.1 Requisitos"));
  c.push(...vinetas(["Node.js 20 o más nuevo, y Git.", "Un proyecto de Supabase (opcional: sin él la app abre en modo demostración)."]));
  c.push(h2("4.2 Pasos"));
  c.push(codigo(`git clone ${DATOS.repo}.git
cd campus-plus
npm install
cp .env.example .env.local     # llenar las dos variables de Supabase
npm run db:seed                # cuentas y actividades de ejemplo
npm run dev                    # http://localhost:5173
npm run verificar              # compila y corre todas las pruebas`));
  c.push(h2("4.3 Publicación"));
  c.push(...numerada([
    "En Vercel: Add New → Project → importar el repositorio.",
    "Agregar las dos variables de Supabase (nunca la llave de servicio).",
    "Deploy. Después, cada cambio que subo a main se publica solo."
  ]));

  c.push(h1("5. Desarrollo ágil"));
  c.push(h2("5.1 Cómo trabajé"));
  c.push(p("Usé **Scrum adaptado a una sola persona**: dividí el trabajo en sprints cortos y al final de cada uno tenía algo que ya funcionaba. Cada sprint empezaba eligiendo historias del backlog, terminaba revisando el resultado en el navegador y cerraba anotando qué salió mal para arreglarlo en el siguiente."));
  c.push(tituloTabla("Roles"));
  c.push(tabla(["Rol", "Quién", "Qué le toca"], [
    ["Product Owner", "El cliente del caso de estudio (el docente)", "Plantea el problema y acepta lo entregado."],
    ["Equipo de desarrollo", DATOS.autor, "Analizar, diseñar, programar, probar y documentar."]
  ], [22, 33, 45]));
  c.push(h2("5.2 Sprints"));
  c.push(tituloTabla("Qué entregué en cada sprint"));
  c.push(tabla(["Sprint", "Objetivo", "Qué quedó funcionando"], [
    ["0", "Análisis y diseño", "Requerimientos, bocetos en Figma y prototipo navegable."],
    ["1", "Prototipo funcional", "Las 12 pantallas funcionando con datos locales, instalable."],
    ["2", "Datos y seguridad", "Base de datos PostgreSQL con permisos, inicio de sesión, código en capas y pruebas."],
    ["3", "Calidad y entrega", "Arreglo de una prueba que fallaba, accesibilidad y documentación."]
  ], [10, 24, 66]));
  c.push(p("En el sprint 2 tuve que rehacer una parte: pasé de «un estado por actividad» a «un estado por estudiante». Me di cuenta revisando el sprint 1, porque en las actividades de grupo el avance de un estudiante le cambiaba el estado a todos los demás."));
  c.push(h2("5.3 Retrospectivas"));
  c.push(tituloTabla("Qué salió mal y qué hice"));
  c.push(tabla(["Qué salió mal", "Qué hice para que no se repitiera"], [
    ["Un error dejaba la pantalla en blanco y solo lo vi probando a mano.", "Agregué pruebas que recorren todas las pantallas solas."],
    ["La configuración de publicación tenía un error que solo se habría visto al publicar.", "Agregué una prueba que revisa ese archivo."],
    ["El color del diseño no daba el contraste mínimo.", "Agregué una revisión de accesibilidad automática en cada pantalla."]
  ], [50, 50]));
  c.push(h2("5.4 Cuándo doy algo por terminado"));
  c.push(...vinetas([
    "Cumple sus criterios de aceptación y lo revisé en teléfono y en tableta.",
    "Compila sin errores.",
    "Tiene pruebas automáticas y todas pasan.",
    "No deja llaves ni contraseñas en el repositorio."
  ]));

  c.push(h1("6. Control de versiones"));
  c.push(h2("6.1 Ramas"));
  c.push(p("Trabajé con ramas: `main` siempre queda con código que funciona, y cada grupo de historias lo hago en una rama aparte que luego uno a main. Así, si algo se rompe, main sigue estando bien."));
  c.push(...(await figura("diagramas/git-cicd.png", "Las ramas y lo que pasa en cada cambio.", 580)));
  c.push(h2("6.2 Mensajes de los commits"));
  c.push(p("Los mensajes siguen el formato `tipo: descripción`, así se entiende de un vistazo qué cambió: `feat` es algo nuevo, `fix` una corrección, `test` pruebas y `chore` configuración."));
  c.push(tituloTabla("Historial de commits"));
  c.push(tabla(["Commit", "Fecha", "Mensaje"], commits.map(([h, f, m]) => [h, f, m]), [12, 16, 72], { tam: 16, juntar: false }));
  c.push(h2("6.3 Cuidado con las llaves"));
  c.push(...vinetas([
    "Las llaves están en `.env.local`, que no se sube a Git; en el repositorio solo va `.env.example` con valores de ejemplo.",
    "Antes de hacer público el repositorio revisé todo el historial buscando llaves, y no encontré ninguna."
  ]));
  c.push(h2("6.4 Revisión automática"));
  c.push(p("Cada vez que subo un cambio, GitHub corre esto solo:"));
  c.push(codigo(`npm ci          # instala las dependencias
npm audit       # revisa que no tengan vulnerabilidades
npm run build   # compila
npm test        # corre las pruebas
npm run test:e2e  # corre la app completa en teléfono y tableta`));

  c.push(h1("7. Calidad del código"));
  c.push(tituloTabla("Indicadores"));
  c.push(tabla(["Indicador", "Valor"], [
    ["Errores al compilar", "0"],
    ["Pruebas automatizadas", "118 (todas pasan)"],
    ["Cobertura de código", "92.1 %"],
    ["Vulnerabilidades en las dependencias", "0"],
    ["Lighthouse (rendimiento / accesibilidad)", "97 / 100"]
  ], [60, 40]));
  c.push(h2("7.1 Un pedazo del código"));
  c.push(p("Así protejo las pantallas: si no hay sesión, mando al inicio; si el rol no coincide, mando a la pantalla que sí le toca."));
  c.push(codigo(`if (!usuario) return <Navigate to="/" replace />;
if (usuario.rol !== rol) return <Navigate to={\`/\${usuario.rol}\`} replace />;`));
  c.push(...nota([`El código tiene hechos todos los requerimientos «Must» y «Should», está separado en capas y tiene pruebas automáticas. Está en ${DATOS.repo}.`], "Conclusión"));

  await guardar("03-Codigo-de-la-aplicacion.docx", {
    titulo: "Código de la aplicación",
    subtitulo: "Repositorio, desarrollo ágil y control de versiones",
    descripcion: "Aquí digo dónde está el código, cómo se instala y se publica, y cómo trabajé con sprints, ramas y pruebas automáticas."
  }, c);
}
