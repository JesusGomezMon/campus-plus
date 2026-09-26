import { readFileSync } from "node:fs";
import { codigo, DATOS, figura, guardar, h1, h2, nota, numerada, p, RAIZ, reiniciarContadores, tabla, tituloTabla, vinetas } from "./comun.mjs";

const leer = (f) => JSON.parse(readFileSync(RAIZ + f, "utf8"));

export async function generar() {
  reiniciarContadores();
  const carga = leer("reportes/carga-supabase.json");
  const lh = leer("reportes/lighthouse.report.json");
  const lat = leer("reportes/latencia-supabase.json");
  const lhc = lh.categories, au = lh.audits;
  const appUrl = process.env.APP_URL;

  const c = [];

  c.push(h1("1. Resumen"));
  c.push(p("En esta fase me tocó dejar la aplicación funcionando en la nube y luego cuidarla: que aguante más usuarios, que cargue rápido y que esté segura. Aquí anoto qué hice, qué medí y qué salió."));
  c.push(tituloTabla("Lo que se hizo en cada punto"));
  c.push(tabla(["Punto", "Qué hice", "Cómo lo comprobé"], [
    ["Despliegue", "Base de datos y sesiones en Supabase; la app se publica en Vercel desde la rama main.", "23 de 23 revisiones de permisos contra la nube"],
    ["Escalabilidad", "Límite y orden en el servidor, índices y una sola consulta por pantalla.", `Prueba de carga hasta ${carga.resultados.at(-1).usuariosSimultaneos} usuarios a la vez, sin errores`],
    ["Rendimiento", "Dividí el código y traje la tipografía al proyecto.", `Lighthouse pasó de 91 a ${Math.round(lhc.performance.score * 100)}`],
    ["Seguridad", "HTTPS obligatorio, encabezados estrictos, permisos en la base y revisión de dependencias.", "0 vulnerabilidades y 0 violaciones de accesibilidad"]
  ], [16, 46, 38]));

  // ---------------------------------------------------------------- 2
  c.push(h1("2. Despliegue en la nube"));
  c.push(h2("2.1 Dónde vive cada parte"));
  c.push(p("No hay ningún servidor propio que mantener: los dos servicios son administrados, así que las actualizaciones del sistema, los certificados y los respaldos corren por su cuenta."));
  c.push(tituloTabla("Servicios en la nube que usa Campus+"));
  c.push(tabla(["Parte", "Servicio", "Qué hace ahí"], [
    ["La aplicación", "Vercel", "Guarda los archivos ya compilados y los entrega desde el servidor más cercano al usuario, siempre por HTTPS."],
    ["Las sesiones", "Supabase Auth", "Guarda las contraseñas cifradas y entrega el token de cada sesión."],
    ["Los datos", "Supabase (PostgreSQL)", "Guarda la información y decide qué puede ver o cambiar cada usuario."],
    ["El código", "GitHub", "Historial, ramas y la revisión automática antes de publicar."]
  ], [18, 22, 60]));
  c.push(...(await figura("diagramas/arquitectura-sistema.png", "Las partes que están en la nube y cómo se hablan.", 540)));

  c.push(h2("2.2 Cómo se publica"));
  c.push(p("La publicación no es manual: está atada al repositorio, así que lo que está en `main` es lo que está en línea."));
  c.push(...numerada([
    "Subo el cambio a una rama y abro un pull request.",
    "GitHub compila y corre todas las pruebas. Si algo falla, no se puede unir a main.",
    "Al unirlo a main, Vercel compila otra vez y publica la versión nueva.",
    "Cada pull request genera además una dirección de vista previa, para revisarlo antes de que llegue a los usuarios."
  ]));
  c.push(p(appUrl ? `La aplicación está publicada en ${appUrl}.` : "**Pendiente:** la base de datos y las sesiones ya están en la nube y medidas en este documento; falta conectar el repositorio a la cuenta de Vercel para que quede publicada la dirección definitiva. La configuración ya está lista y hay una prueba automática que la revisa."));

  c.push(h2("2.3 Buenas prácticas que seguí"));
  c.push(tituloTabla("Prácticas de despliegue"));
  c.push(tabla(["Práctica", "Cómo se aplica en Campus+"], [
    ["No publicar nada sin revisar", "Las pruebas corren solas en cada cambio; si fallan, no se publica."],
    ["Las llaves fuera del código", "Van en variables de entorno de Vercel. En el repositorio solo está `.env.example`, con valores de mentira."],
    ["Solo la llave pública en el navegador", "La llave de servicio nunca sale de mi computadora; se usa únicamente para cargar los datos de ejemplo."],
    ["Poder regresar a la versión anterior", "Vercel guarda cada despliegue; si algo sale mal, se vuelve a la versión previa con un clic."],
    ["Configuración en el repositorio", "`vercel.json` guarda los encabezados y las reglas de caché, así que el despliegue se puede repetir igual."],
    ["Separar la demostración de lo real", "Sin las variables de Supabase la app abre en modo demostración, con datos inventados."]
  ], [30, 70]));

  // ---------------------------------------------------------------- 3
  c.push(h1("3. Gestión y escalabilidad"));
  c.push(h2("3.1 Qué puede crecer"));
  c.push(p("Dos cosas pueden crecer y hay que tenerlas controladas: cuántas personas usan la app al mismo tiempo y cuántas actividades hay guardadas. Si no se cuidan, la app sigue funcionando con los datos de prueba pero se cae cuando la usa un grupo entero."));

  c.push(h2("3.2 Lo que hice para que aguante"));
  c.push(tituloTabla("Cambios para manejar más datos"));
  c.push(tabla(["Qué hice", "Por qué"], [
    ["El servidor ordena y recorta", "Antes cada pantalla se traía **todas** las actividades del usuario y las ordenaba en el teléfono. Ahora PostgreSQL ordena y manda solo las que se piden, así que la respuesta pesa lo mismo con 50 actividades que con 50 000."],
    ["Botón «Mostrar más»", "La lista abre con 20 y va pidiendo de 20 en 20, en lugar de bajar todo de golpe."],
    ["Índices en la base de datos", "Las columnas por las que se busca y se ordena tienen índice, así que PostgreSQL no recorre la tabla entera."],
    ["Una sola consulta por pantalla", "Las relaciones se resuelven en el servidor; no se hace una consulta por cada renglón."],
    ["La app se guarda en el dispositivo", "Después de la primera visita solo viajan los datos, no los archivos de la aplicación."],
    ["Conexiones compartidas", "Supabase reparte un grupo de conexiones entre todos los usuarios, en lugar de abrir una por persona."]
  ], [26, 74]));

  c.push(h2("3.3 Prueba de carga"));
  c.push(p(`Para no quedarme en la teoría hice una prueba de carga: el script \`npm run db:carga\` repite la consulta más pesada de la app (la pantalla «Mis actividades») con cada vez más usuarios al mismo tiempo, y mide cuánto tarda. Cada usuario hace ${carga.consultasPorUsuario} consultas.`));
  c.push(tituloTabla("Resultados de la prueba de carga contra Supabase"));
  c.push(tabla(["Usuarios a la vez", "Consultas", "Mediana (ms)", "95 % por debajo de", "Consultas por segundo", "Errores"],
    carga.resultados.map((r) => [r.usuariosSimultaneos, r.consultas, r.mediana, `${r.p95} ms`, r.consultasPorSegundo, r.errores]),
    [18, 14, 16, 20, 20, 12]));
  c.push(p(`Lo importante de esta tabla: la mediana casi no se mueve (${carga.resultados[0].mediana} ms con un usuario y ${carga.resultados.at(-1).mediana} ms con ${carga.resultados.at(-1).usuariosSimultaneos}), y las consultas por segundo suben casi en la misma proporción que los usuarios. Es decir, la base no se satura: atiende más trabajo sin tardar más por consulta, y no hubo ni un error.`));
  c.push(...nota("Estos tiempos incluyen el viaje por internet desde mi computadora hasta el centro de datos. Las pruebas salen del plan gratuito de Supabase, así que un plan de paga daría mejores números todavía.", "Nota"));

  c.push(h2("3.4 Qué haría si crece de verdad"));
  c.push(tituloTabla("Plan de crecimiento"));
  c.push(tabla(["Si pasa esto", "Qué se hace"], [
    ["Más usuarios de los que aguanta el plan gratuito", "Cambiar Supabase al plan de paga: más conexiones, más memoria y respaldos diarios. Es un cambio de plan, no de código."],
    ["Muchas más actividades por usuario", "Ya está resuelto con el límite y el «Mostrar más»; si hiciera falta, se agregan más índices."],
    ["Usuarios en otras ciudades", "Vercel ya entrega la app desde el servidor más cercano; no hay que hacer nada."],
    ["Consultas que se repiten mucho", "Guardar en memoria la respuesta unos segundos, para no volver a preguntarle a la base lo mismo."]
  ], [34, 66]));

  c.push(h2("3.5 Qué vigilo"));
  c.push(...vinetas([
    "**Vercel:** cuántas visitas hay, cuánto tarda cada despliegue y si alguno falló.",
    "**Supabase:** cuántas consultas se hacen, cuánto tardan y cuánto espacio se está usando.",
    "**GitHub:** si una corrida de pruebas falla, llega el aviso antes de que el cambio se publique.",
    "**La bitácora de la base de datos:** guarda quién creó, cambió o borró cada cosa, con fecha."
  ]));

  // ---------------------------------------------------------------- 4
  c.push(h1("4. Optimización del rendimiento"));
  c.push(h2("4.1 Cómo medí"));
  c.push(p("Usé Lighthouse con el perfil de teléfono (que simula una conexión y un procesador lentos) sobre la versión compilada, la misma que se publica. Para que los números no fueran casualidad, corrí cada versión **tres veces** y comparé."));

  c.push(h2("4.2 Qué probé y qué pasó"));
  c.push(p("Probé tres versiones. La primera idea que tuve no sirvió, y por eso la deshice:"));
  c.push(tituloTabla("Las tres versiones que medí (tres corridas cada una)"));
  c.push(tabla(["Versión", "Qué cambié", "Puntaje", "Primer dibujado", "Contenido principal"], [
    ["Punto de partida", "Todo en un solo archivo de 147 KB.", "91 · 91 · 91", "2.7 – 2.8 s", "2.8 – 2.9 s"],
    ["Versión 2", "Separé el código por rol y las librerías en archivos aparte.", "93 · 91 · 92", "2.6 – 2.7 s", "2.6 – 2.7 s"],
    ["Versión 3 (la que quedó)", "Lo anterior más traer la tipografía Lato al proyecto.", "**97 · 97 · 97**", "**2.0 s**", "**2.3 s**"]
  ], [20, 40, 16, 12, 12]));
  c.push(p("También probé cargar el cliente de la base de datos aparte, para que no entrara en la primera descarga. Bajaba 53 KB, pero el puntaje **empeoró a 91**: el navegador tenía que hacer un viaje de red más antes de poder dibujar la pantalla. Lo deshice. Me pareció importante anotarlo: sin medir, habría dejado un cambio que se veía bien en el papel y era peor en la práctica."));
  c.push(p("Lo que sí resultó fue la tipografía. Estaba puesta con un enlace a Google Fonts, y el navegador no puede dibujar nada hasta que baja esa hoja de estilos de otro sitio. Al copiar los tres archivos de la fuente al proyecto, esa espera desapareció."));

  c.push(h2("4.3 Resultado final"));
  c.push(tituloTabla("Lighthouse sobre la versión publicada (perfil de teléfono)"));
  c.push(tabla(["Qué mide", "Resultado", "Referencia"], [
    ["Rendimiento", `${Math.round(lhc.performance.score * 100)} / 100`, "90 o más es bueno"],
    ["Accesibilidad", `${Math.round(lhc.accessibility.score * 100)} / 100`, "90 o más es bueno"],
    ["Buenas prácticas", `${Math.round(lhc["best-practices"].score * 100)} / 100`, "90 o más es bueno"],
    ["SEO", `${Math.round(lhc.seo.score * 100)} / 100`, "90 o más es bueno"],
    ["Primer dibujado", au["first-contentful-paint"].displayValue, "menos de 1.8 s es bueno"],
    ["Contenido principal", au["largest-contentful-paint"].displayValue, "menos de 2.5 s es bueno"],
    ["Saltos de la página al cargar", au["cumulative-layout-shift"].displayValue, "menos de 0.1 es bueno"]
  ], [40, 25, 35]));
  c.push(p(`Del lado de la base de datos, las consultas principales tardan alrededor de ${lat.resultados[0].mediana} ms, y la mayor parte de ese tiempo es el viaje por internet, no el trabajo de PostgreSQL.`));

  // ---------------------------------------------------------------- 5
  c.push(h1("5. Seguridad"));
  c.push(h2("5.1 En el despliegue"));
  c.push(p("El servidor manda unas instrucciones al navegador junto con cada página. Sirven para que, aunque alguien lograra meter código, el navegador se niegue a ejecutarlo."));
  c.push(tituloTabla("Encabezados de seguridad que manda el servidor"));
  c.push(tabla(["Encabezado", "Para qué sirve"], [
    ["Content-Security-Policy", "Dice de dónde puede cargar cosas la página. Solo se permite el propio sitio y Supabase; no se permite código escrito dentro del HTML."],
    ["Strict-Transport-Security", "Obliga a usar HTTPS siempre, aunque alguien escriba la dirección sin la «s»."],
    ["X-Content-Type-Options", "Impide que el navegador adivine el tipo de un archivo y lo ejecute por error."],
    ["frame-ancestors / X-Frame-Options", "Impide que otro sitio meta Campus+ dentro de una ventana para engañar al usuario."],
    ["Referrer-Policy", "Evita mandar la dirección completa de la página cuando se sale a otro sitio."],
    ["Permissions-Policy", "Apaga cámara, micrófono y ubicación, que la app no necesita."]
  ], [32, 68]));
  c.push(p("Una prueba automática revisa este archivo en cada cambio, porque un error de una coma aquí no se nota hasta que ya está publicado; de hecho eso mismo me pasó antes y por eso agregué la prueba."));

  c.push(h2("5.2 En la aplicación y los datos"));
  c.push(tituloTabla("Controles sobre los datos"));
  c.push(tabla(["Control", "Cómo funciona"], [
    ["Permisos dentro de la base de datos", "Cada consulta lleva la identidad de quien la hace y PostgreSQL filtra las filas. Funciona aunque alguien intente entrar por fuera de la aplicación."],
    ["Permisos por columna", "Un estudiante solo puede tocar la columna del estado; ni el rol ni el autor de una actividad se pueden cambiar."],
    ["Contraseñas cifradas", "No se guardan en texto plano y nadie, ni el administrador, las puede ver."],
    ["Bitácora", "Cada alta, cambio y baja queda registrada con el usuario, la fecha y cómo estaba el dato antes y después."],
    ["Validación en dos lugares", "Los datos se revisan en el formulario y otra vez en la base, por si alguien salta la pantalla."]
  ], [30, 70]));

  c.push(h2("5.3 Vulnerabilidades"));
  c.push(...vinetas([
    "`npm audit` corre en cada cambio y hoy reporta **0 vulnerabilidades**. Si alguna librería saca un aviso, la revisión falla y me entero antes de publicar.",
    "Probé a propósito meter instrucciones de SQL y etiquetas HTML en el título de una actividad: se guardan como texto y no se ejecutan.",
    "Revisé todo el historial del repositorio buscando llaves filtradas y no encontré ninguna; además hay una prueba que lo vuelve a revisar."
  ]));

  c.push(h2("5.4 Protección de datos personales"));
  c.push(...vinetas([
    "Se guarda lo mínimo: nombre, matrícula, programa y correo.",
    "Todo viaja cifrado por HTTPS, entre el teléfono y los dos servicios.",
    "La tipografía ahora es local, así que al abrir la app el navegador ya no le pide nada a Google.",
    "Como es una institución pública, antes de usarla con datos reales hay que publicar el aviso de privacidad que pide la ley."
  ]));

  // ---------------------------------------------------------------- 6
  c.push(h1("6. Pendientes"));
  c.push(...vinetas([
    "Conectar el repositorio a la cuenta de Vercel para dejar publicada la dirección definitiva y repetir las pruebas contra ella.",
    "Probar con más usuarios de los que permite el plan gratuito, ya con un plan de paga.",
    "Configurar un aviso automático por correo cuando falle un despliegue o suba el tiempo de respuesta."
  ]));
  c.push(...nota(`La aplicación está lista para operar en la nube: los datos y las sesiones ya están en Supabase y medidos, la configuración de publicación está revisada por pruebas automáticas, aguanta ${carga.resultados.at(-1).usuariosSimultaneos} usuarios a la vez sin errores y saca ${Math.round(lhc.performance.score * 100)} de 100 en rendimiento después de optimizarla.`, "Conclusión"));

  await guardar("06-Despliegue-y-operacion.docx", {
    titulo: "Despliegue y operación en la nube",
    subtitulo: "Publicación, escalabilidad, rendimiento y seguridad",
    descripcion: "Aquí explico dónde está publicada la aplicación, qué hice para que aguante más usuarios y más datos, cómo la optimicé midiendo antes y después, y cómo la protegí."
  }, c);
}
