import { codigo, figura, guardar, h1, h2, h3, nota, p, reiniciarContadores, rejilla, tabla, tituloTabla, vinetas } from "./comun.mjs";

export async function generar() {
  reiniciarContadores();
  const c = [];

  c.push(h1("1. Introducción"));
  c.push(p("Aquí muestro cómo diseñé **Campus+ V1**: los bocetos, las 12 pantallas, los colores, la arquitectura, la lógica de negocio y el modelo de datos. Todas las capturas son de la app ya funcionando."));

  // 2
  c.push(h1("2. Proceso de diseño"));
  c.push(h2("2.1 De los bocetos al prototipo"));
  c.push(p("El diseño lo hice en tres pasos:"));
  c.push(...vinetas([
    "**Bocetos en Figma:** ahí definí cómo se acomoda cada pantalla (figura 1).",
    "**Prototipo navegable (escritorio):** me sirvió para probar los tres flujos con las 12 pantallas.",
    "**Prototipo móvil (390 × 844):** este quedó como diseño final, porque la app se usa casi siempre en el teléfono."
  ]));
  c.push(...(await figura("bocetos/boceto-figma.png", "Bocetos iniciales en Figma.", 420)));
  c.push(h2("2.2 Principios de diseño"));
  c.push(tituloTabla("Principios de diseño que seguí"));
  c.push(tabla(["Principio", "Cómo lo apliqué"], [
    ["Primero el teléfono", "Una sola columna en el celular; en tableta las listas pasan a dos columnas."],
    ["Botones grandes", "Botones de 44 a 64 px de alto y la barra de abajo donde alcanza el pulgar."],
    ["Que todo se vea igual", "Todas las pantallas llevan la misma estructura."],
    ["Evitar errores", "Los mensajes de error salen junto al campo, y antes de borrar pide confirmación."],
    ["Accesibilidad", "Buen contraste, etiqueta en cada campo y foco visible."]
  ], [26, 74]));

  // 3
  c.push(h1("3. Colores y componentes"));
  c.push(p("Los colores vienen del prototipo. Al probar la accesibilidad vi que el verde original (#1E9E4A) con texto blanco no daba el contraste mínimo que pide WCAG AA, así que lo cambié por #17833C."));
  c.push(tituloTabla("Paleta de colores"));
  c.push(tabla(["Color", "Dónde se usa"], [
    ["#17833C (verde)", "Botones, pestaña activa y filtros activos"],
    ["#EAF5EC (verde claro)", "Banda de título, pestañas inactivas y avatar"],
    ["#CAA600 (dorado)", "Estado «Pendiente»"],
    ["#9D2020 (rojo)", "Botón de eliminar"],
    ["#1C1C1A / #6B6B68", "Texto principal y texto secundario"]
  ], [30, 70]));
  c.push(...vinetas([
    "**Tipografía:** Lato. Títulos de 24–30 px y texto de 14–17 px. Los campos van en 16 px porque si son más chicos iOS acerca la pantalla solo.",
    "**Estados:** Pendiente (dorado), En proceso (contorno verde) y Terminada (verde claro). Se distinguen por el texto y no nada más por el color."
  ]));

  // 4
  c.push(h1("4. Las pantallas"));
  c.push(p("Estas capturas son de la app funcionando en un teléfono de 390 × 844 px."));
  c.push(h2("4.1 Entrada"));
  c.push(await rejilla([
    { ruta: "pantallas/00-login-supabase.png", pie: "Inicio de sesión." },
    { ruta: "pantallas/01-inicio-perfil.png", pie: "Selección de perfil (modo demostración)." }
  ], 3, 165));
  c.push(h2("4.2 Estudiante"));
  c.push(await rejilla([
    { ruta: "pantallas/02-estudiante-inicio.png", pie: "Inicio: próximas actividades." },
    { ruta: "pantallas/03-estudiante-actividades.png", pie: "Mis actividades con filtros." },
    { ruta: "pantallas/04-estudiante-detalle.png", pie: "Detalle y cambio de estado." }
  ], 3, 165));
  c.push(h2("4.3 Profesor"));
  c.push(await rejilla([
    { ruta: "pantallas/05-profesor-inicio.png", pie: "Inicio del profesor." },
    { ruta: "pantallas/06-profesor-actividades.png", pie: "Actividades: editar y eliminar." },
    { ruta: "pantallas/07-profesor-nueva.png", pie: "Registro de actividad." },
    { ruta: "pantallas/07b-profesor-nueva-validacion.png", pie: "Los errores salen junto al campo." },
    { ruta: "pantallas/08-profesor-editar.png", pie: "Edición (formulario ya lleno)." },
    { ruta: "pantallas/09-profesor-eliminar.png", pie: "Confirmación para eliminar." }
  ], 3, 165));
  c.push(await rejilla([{ ruta: "pantallas/09b-profesor-detalle-avance.png", pie: "Avance de cada estudiante." }], 3, 165));
  c.push(h2("4.4 Tutor"));
  c.push(await rejilla([
    { ruta: "pantallas/10-tutor-inicio.png", pie: "Inicio del tutor." },
    { ruta: "pantallas/11-tutor-tutorados.png", pie: "Tutorados con matrícula y programa." },
    { ruta: "pantallas/12-tutor-detalle.png", pie: "Información del tutorado." }
  ], 3, 165));
  c.push(h2("4.5 En tableta"));
  c.push(p("De 700 px para arriba las listas se acomodan en dos columnas para aprovechar el espacio."));
  c.push(await rejilla([
    { ruta: "pantallas/13-tablet-profesor-actividades.png", pie: "Actividades del profesor en tableta.", ancho: 290 },
    { ruta: "pantallas/14-tablet-estudiante-actividades.png", pie: "Mis actividades en tableta.", ancho: 290 }
  ], 2));
  c.push(h2("4.6 Mapa de navegación"));
  c.push(...(await figura("diagramas/mapa-navegacion.png", "Cómo se pasa de una pantalla a otra.", 560)));

  // 5
  c.push(h1("5. Arquitectura"));
  c.push(h2("5.1 Tipos de arquitectura que revisé"));
  c.push(p("Antes de decidir revisé los tipos de arquitectura más comunes, para ver cuáles me convenían."));
  c.push(tituloTabla("Tipos de arquitectura y por qué los usé o no"));
  c.push(tabla(["Tipo", "¿Se aplica?", "Por qué"], [
    ["Cliente–servidor", "Sí", "La app en el teléfono se conecta a los servicios en la nube."],
    ["En capas", "Sí", "Pantallas → reglas del negocio → acceso a datos. Cada capa solo usa la de abajo."],
    ["Aplicación de una sola página (SPA) + PWA", "Sí", "La navegación pasa en el navegador y la app se puede instalar."],
    ["Monolítica (servidor que genera HTML)", "No", "Tendría que mantener un servidor y no podría instalar la app."],
    ["Microservicios", "No", "El proyecto es chico; partirlo en servicios solo lo complicaría."]
  ], [30, 13, 57]));
  c.push(h2("5.2 Cómo se conectan las partes"));
  c.push(...(await figura("diagramas/arquitectura-sistema.png", "El teléfono, Vercel y Supabase.", 560)));
  c.push(tituloTabla("Qué hace cada parte"));
  c.push(tabla(["Parte", "Tecnología", "Para qué sirve"], [
    ["La app", "React + TypeScript", "Las pantallas, la navegación y la validación."],
    ["Modo sin internet", "Service worker", "Guardar la app en el dispositivo y poder abrirla sin conexión."],
    ["Publicación", "Vercel", "Entregar la app por internet con HTTPS."],
    ["Usuarios y datos", "Supabase (PostgreSQL)", "Inicio de sesión, guardar la información y revisar los permisos."]
  ], [20, 27, 53]));
  c.push(h2("5.3 La aplicación por capas"));
  c.push(...(await figura("diagramas/arquitectura-capas.png", "Las capas de la aplicación.", 470)));
  c.push(h2("5.4 Patrones de diseño"));
  c.push(tituloTabla("Patrones que usé"));
  c.push(tabla(["Patrón", "Para qué me sirvió"], [
    ["Repositorio", "Las pantallas no saben nada de la base de datos, así que la puedo cambiar sin rehacerlas."],
    ["Adaptador", "Dos versiones del mismo contrato: una real y otra con datos de ejemplo para las pruebas."],
    ["Guardia de rutas", "Solo entra a una pantalla quien tiene sesión con el rol correcto."],
    ["Transacción", "La actividad y sus asignaciones se guardan juntas o no se guarda nada."]
  ], [24, 76]));
  c.push(h2("5.5 Decisiones que tomé"));
  c.push(tituloTabla("Decisiones importantes y por qué"));
  c.push(tabla(["Decisión", "Otra opción", "Por qué la elegí"], [
    ["PWA en vez de app nativa", "App para Android/iOS", "Un solo código para teléfono, tableta y computadora, y se instala sin tiendas."],
    ["Supabase (PostgreSQL)", "Firebase, API propia", "Es relacional, trae el inicio de sesión y me deja poner los permisos en la base de datos."],
    ["Revisar permisos en la base de datos", "Revisarlos solo en la app", "El cliente se puede manipular; así la seguridad se mantiene de todos modos."],
    ["Un estado por estudiante", "Un solo estado por actividad", "Cada quien avanza a su ritmo en las actividades de grupo."]
  ], [28, 24, 48]));

  // 6
  c.push(h1("6. Lógica de negocio"));
  c.push(p("Las reglas están juntas en un solo archivo (`src/domain/reglas.ts`) que no depende ni de React ni de la base de datos, y además se vuelven a revisar en PostgreSQL. Así se revisan dos veces: en la app, para responder rápido, y en el servidor, por seguridad."));
  c.push(tituloTabla("Dónde se aplica cada regla"));
  c.push(tabla(["Regla", "En la app", "En la base de datos"], [
    ["Validar la actividad", "validarActividad()", "Límites de longitud y campos obligatorios"],
    ["Permisos por rol", "puede(), exigir()", "Políticas de RLS"],
    ["Próximas actividades", "proximas()", "—"],
    ["Estado general y avance", "estadoGlobal(), avance()", "Un estado por fila en asignaciones"],
    ["Conservar el avance al editar", "—", "La función guardar_actividad()"]
  ], [30, 33, 37]));
  c.push(h2("6.1 Registrar una actividad, paso a paso"));
  c.push(...(await figura("diagramas/secuencia-registrar.png", "Qué pasa cuando el profesor guarda una actividad.", 560)));
  c.push(h2("6.2 Estados de una actividad asignada"));
  c.push(...(await figura("diagramas/estados-asignacion.png", "Los tres estados y cómo se pasa de uno a otro.", 540)));
  c.push(h2("6.3 Un pedazo del código"));
  c.push(p("Esta función calcula el estado general que ve el profesor cuando la actividad es para todo el grupo (RN-06):"));
  c.push(codigo(`export function estadoGlobal(asignaciones) {
  if (asignaciones.length === 0) return "Pendiente";
  if (asignaciones.every((s) => s.estado === "Terminada")) return "Terminada";
  if (asignaciones.every((s) => s.estado === "Pendiente")) return "Pendiente";
  return "En proceso";
}`));

  // 7
  c.push(h1("7. Modelo de datos"));
  c.push(p("Son cuatro tablas. Como una actividad puede ser de varios estudiantes y un estudiante tiene varias actividades, esa relación la resuelvo con `asignaciones`, que además guarda el avance de cada quien. El detalle está en el «Informe de la gestión de datos»."));
  c.push(...(await figura("diagramas/modelo-er.png", "Modelo entidad-relación.", 580)));

  // 8
  c.push(h1("8. Seguridad"));
  c.push(tituloTabla("Cosas de seguridad que ya van en el diseño"));
  c.push(tabla(["Dónde", "Qué hice"], [
    ["Pantallas", "Cada una es solo para su rol y las opciones aparecen nada más a quien puede usarlas."],
    ["Reglas del negocio", "Se revisa el permiso antes de cada operación y se validan los datos."],
    ["Conexión", "Todo va por HTTPS."],
    ["Base de datos", "Reglas de RLS en todas las tablas, para que cada quien vea solo lo suyo."],
    ["Llaves", "Están en variables de entorno y no se suben al repositorio."]
  ], [24, 76]));
  c.push(...nota("El diseño cubre las tres partes que pedía la fase: la interfaz sigue el prototipo pero con mejor accesibilidad, la lógica de negocio aplica las reglas en dos capas, y la arquitectura está separada por capas sobre una base de datos en la nube.", "Conclusión"));

  await guardar("02-Diseno-de-la-aplicacion.docx", {
    titulo: "Diseño de la aplicación",
    subtitulo: "Bocetos, pantallas, arquitectura y lógica de negocio",
    descripcion: "Aquí muestro los bocetos y las 12 pantallas, los colores, la arquitectura, los patrones de diseño, la lógica de negocio y el modelo de datos."
  }, c);
}
