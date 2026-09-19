import { codigo, figura, guardar, h1, h2, h3, nota, p, reiniciarContadores, rejilla, tabla, tituloTabla, vinetas } from "./comun.mjs";

export async function generar() {
  reiniciarContadores();
  const c = [];

  c.push(h1("1. Introducción"));
  c.push(p("Este documento describe el diseño de **Campus+ V1**: los bocetos iniciales, los planos de las 12 pantallas, el sistema visual, la arquitectura (y los tipos de arquitectura evaluados), la lógica de negocio y el modelo de datos. Todo lo que se muestra corresponde a la aplicación construida; las capturas se tomaron de la aplicación real."));
  c.push(p("El diseño parte de los requerimientos del documento «Análisis de requerimientos» (RF, RNF y RN) y cada decisión se relaciona con ellos."));

  // 2
  c.push(h1("2. Proceso de diseño"));
  c.push(h2("2.1 De los bocetos al prototipo"));
  c.push(p("El diseño se realizó en tres etapas iterativas:"));
  c.push(...vinetas([
    "**Bocetos de baja fidelidad (Figma):** definieron la estructura de cada pantalla: banda de título, saludo, botones verdes de acción, formulario y barra de navegación inferior (figura 1).",
    "**Prototipo navegable V1 (escritorio):** validó los tres flujos (estudiante, profesor y tutor) con 12 pantallas.",
    "**Prototipo V2 móvil (390 × 844):** se adoptó como diseño final porque el uso principal es en teléfonos y tabletas (enfoque mobile-first)."
  ]));
  c.push(...(await figura("bocetos/boceto-figma.png", "Bocetos iniciales en Figma: inicio del estudiante y registro de actividades.", 420)));
  c.push(h2("2.2 Principios de diseño"));
  c.push(tituloTabla("Principios de diseño aplicados"));
  c.push(tabla(["Principio", "Aplicación en Campus+", "Requerimiento"], [
    ["Mobile-first", "Una columna en teléfono; en tableta (≥ 700 px) las listas pasan a dos columnas.", "RNF-01"],
    ["Objetivos táctiles amplios", "Botones de 44 a 64 px de alto; barra inferior al alcance del pulgar.", "RNF-01"],
    ["Consistencia", "Misma estructura en todas las pantallas: usuario, banda de título, contenido y barra inferior.", "RNF-01"],
    ["Prevención de errores", "Validación en línea con mensajes junto al campo; confirmación antes de eliminar.", "RN-01 a RN-04, RN-09"],
    ["Retroalimentación", "Avisos («Actividad registrada», «Estado cambiado…»), indicadores de carga y mensajes de error con «Reintentar».", "RNF-01"],
    ["Accesibilidad", "Contraste AA, etiquetas en cada campo, roles ARIA, foco visible y soporte de lector de pantalla.", "RNF-02"],
    ["Mínimo privilegio en la interfaz", "Cada rol solo ve las opciones que puede usar.", "RN-05"]
  ], [22, 60, 18]));

  // 3
  c.push(h1("3. Sistema visual"));
  c.push(h2("3.1 Paleta de color"));
  c.push(p("La paleta proviene del prototipo. Durante las pruebas de accesibilidad se detectó que el verde original (#1E9E4A) con texto blanco tenía un contraste de 3.47:1, menor al 4.5:1 que exige WCAG AA; se sustituyó por el tono #17833C del mismo sistema de diseño (4.83:1)."));
  c.push(tituloTabla("Paleta de colores y contraste"));
  c.push(tabla(["Token", "Color", "Uso", "Contraste"], [
    ["--green", "#17833C", "Botones, pestaña activa, filtros activos", "4.83:1 con blanco (AA)"],
    ["--green-100", "#EAF5EC", "Banda de título, pestañas inactivas, avatar", "Fondo"],
    ["--green-800", "#0B5124", "Texto sobre verde claro, etiqueta «Terminada»", "8.47:1 (AAA)"],
    ["--gold / --gold-100", "#CAA600 / #FBF3D4", "Estado «Pendiente» y conteo de pendientes", "7.55:1 texto #5D4C00"],
    ["--danger", "#9D2020", "Eliminar", "7.89:1 con blanco (AAA)"],
    ["--ink / --muted", "#1C1C1A / #6B6B68", "Texto principal y secundario", "17:1 / 5.35:1"]
  ], [20, 22, 38, 20]));
  c.push(h2("3.2 Tipografía y componentes"));
  c.push(...vinetas([
    "**Tipografía:** Lato (400, 700, 900); títulos de 24–30 px, texto de 14–17 px; campos de 16 px para evitar el acercamiento automático en iOS.",
    "**Componentes:** botón primario, botón de opción (estado), botón «píldora» (próximas actividades), tarjeta, filtro tipo chip, etiqueta de estado, lista de datos (etiqueta/valor), diálogo modal, aviso emergente, indicador de carga y barra de navegación inferior.",
    "**Etiquetas de estado:** Pendiente (dorado), En proceso (contorno verde) y Terminada (verde claro): el estado se distingue por texto y color, no solo por color."
  ]));

  // 4
  c.push(h1("4. Planos de las pantallas"));
  c.push(p("Las siguientes capturas son de la aplicación funcionando en un teléfono de 390 × 844 px. La numeración coincide con el prototipo del cliente."));
  c.push(h2("4.1 Entrada"));
  c.push(await rejilla([
    { ruta: "pantallas/00-login-supabase.png", pie: "01 Inicio de sesión (modo producción)." },
    { ruta: "pantallas/01-inicio-perfil.png", pie: "01 Selección de perfil (modo demostración)." }
  ], 3, 165));
  c.push(h2("4.2 Flujo del estudiante"));
  c.push(await rejilla([
    { ruta: "pantallas/02-estudiante-inicio.png", pie: "02 Inicio: próximas actividades y conteos." },
    { ruta: "pantallas/03-estudiante-actividades.png", pie: "03 Mis actividades con filtros." },
    { ruta: "pantallas/04-estudiante-detalle.png", pie: "04 Detalle y cambio de estado." }
  ], 3, 165));
  c.push(h2("4.3 Flujo del profesor"));
  c.push(await rejilla([
    { ruta: "pantallas/05-profesor-inicio.png", pie: "05 Inicio: próximas y «Registra actividad»." },
    { ruta: "pantallas/06-profesor-actividades.png", pie: "06 Actividades con editar y eliminar." },
    { ruta: "pantallas/07-profesor-nueva.png", pie: "07 Registro de actividad." },
    { ruta: "pantallas/07b-profesor-nueva-validacion.png", pie: "07 Validación en línea." },
    { ruta: "pantallas/08-profesor-editar.png", pie: "08 Edición (formulario precargado)." },
    { ruta: "pantallas/09-profesor-eliminar.png", pie: "09 Confirmación para eliminar." }
  ], 3, 165));
  c.push(await rejilla([{ ruta: "pantallas/09b-profesor-detalle-avance.png", pie: "Detalle con avance por estudiante (RF-12)." }], 3, 165));
  c.push(h2("4.4 Flujo del tutor"));
  c.push(await rejilla([
    { ruta: "pantallas/10-tutor-inicio.png", pie: "10 Inicio: tutorados." },
    { ruta: "pantallas/11-tutor-tutorados.png", pie: "11 Tutorados con matrícula y programa." },
    { ruta: "pantallas/12-tutor-detalle.png", pie: "12 Información del tutorado." }
  ], 3, 165));
  c.push(h2("4.5 Adaptación a tableta"));
  c.push(p("En pantallas de 700 px o más aumentan los márgenes, los botones se amplían y las listas se muestran en dos columnas para aprovechar el espacio."));
  c.push(await rejilla([
    { ruta: "pantallas/13-tablet-profesor-actividades.png", pie: "Actividades del profesor en tableta.", ancho: 290 },
    { ruta: "pantallas/14-tablet-estudiante-actividades.png", pie: "Mis actividades en tableta.", ancho: 290 }
  ], 2));
  c.push(h2("4.6 Mapa de navegación"));
  c.push(...(await figura("diagramas/mapa-navegacion.png", "Mapa de navegación entre las 12 pantallas.", 610)));

  // 5
  c.push(h1("5. Arquitectura"));
  c.push(h2("5.1 Tipos de arquitectura evaluados"));
  c.push(p("Se evaluaron los estilos de arquitectura más comunes para decidir cuáles aplicar. La tabla 3 resume la decisión y su justificación."));
  c.push(tituloTabla("Tipos de arquitectura y cómo se emplean en Campus+"));
  c.push(tabla(["Tipo de arquitectura", "¿Se aplica?", "Cómo / por qué"], [
    ["Cliente–servidor", "Sí", "El cliente (PWA en el dispositivo) consume servicios en la nube por HTTPS: autenticación, API REST y base de datos."],
    ["En capas (n-capas)", "Sí", "Presentación → aplicación → dominio → acceso a datos. Cada capa solo depende de la inferior (sección 5.3)."],
    ["Hexagonal / puertos y adaptadores", "Sí", "La interfaz `Repositorio` es el puerto; `SupabaseRepo` y `MemoriaRepo` son adaptadores intercambiables sin tocar la UI."],
    ["Backend como Servicio (BaaS) / serverless", "Sí", "Supabase provee PostgreSQL, autenticación y API sin administrar servidores; Vercel sirve la app desde un CDN."],
    ["Aplicación de una sola página (SPA) + PWA", "Sí", "La navegación ocurre en el cliente (React Router); el service worker permite instalar y abrir la app sin conexión."],
    ["MVC / MVVM", "Parcial", "La vista (componentes React) está separada del estado (contexto y hooks) y del modelo (dominio), en la línea de MVVM."],
    ["Monolítica tradicional (servidor que genera HTML)", "No", "Requiere mantener un servidor propio y no aprovecha la instalación como PWA ni el funcionamiento sin conexión."],
    ["Microservicios", "No", "El dominio es pequeño; dividirlo en servicios añadiría complejidad operativa sin beneficio en V1. La arquitectura en capas permite separarlo después si crece."],
    ["Orientada a eventos", "Parcial", "La base de datos reacciona a eventos con triggers (auditoría y fechas de actualización)."]
  ], [27, 11, 62]));
  c.push(h2("5.2 Arquitectura física (despliegue)"));
  c.push(...(await figura("diagramas/arquitectura-sistema.png", "Arquitectura del sistema: dispositivo, Vercel, GitHub y Supabase.", 620)));
  c.push(tituloTabla("Componentes de la arquitectura física"));
  c.push(tabla(["Componente", "Tecnología", "Responsabilidad"], [
    ["Cliente", "React 19, TypeScript, React Router, Vite", "Interfaz, navegación, validación y reglas de presentación."],
    ["Service worker", "Workbox (vite-plugin-pwa)", "Guardar la aplicación en caché, instalarla y abrirla sin conexión."],
    ["Hospedaje", "Vercel (CDN global)", "Servir los archivos estáticos con HTTPS y encabezados de seguridad (CSP, HSTS)."],
    ["Autenticación", "Supabase Auth", "Validar correo y contraseña (bcrypt) y emitir un token JWT de sesión."],
    ["API", "PostgREST (Supabase)", "Exponer tablas y funciones como API REST, aplicando el JWT de cada solicitud."],
    ["Base de datos", "PostgreSQL 15 (Supabase)", "Guardar la información y hacer cumplir las reglas con RLS, restricciones y funciones."],
    ["Integración continua", "GitHub + GitHub Actions", "Auditar dependencias, compilar y ejecutar las pruebas en cada cambio."]
  ], [18, 32, 50]));
  c.push(h2("5.3 Arquitectura lógica (capas)"));
  c.push(...(await figura("diagramas/arquitectura-capas.png", "Capas de la aplicación y adaptadores de datos.", 520)));
  c.push(h2("5.4 Patrones de diseño"));
  c.push(tituloTabla("Patrones de diseño"));
  c.push(tabla(["Patrón", "Dónde", "Beneficio"], [
    ["Repositorio", "src/data/repositorio.ts", "La UI no conoce la base de datos; se puede cambiar el proveedor sin reescribir pantallas."],
    ["Adaptador", "SupabaseRepo, MemoriaRepo", "Dos implementaciones del mismo contrato: producción y demostración o pruebas."],
    ["Inyección de dependencias", "AppProvider recibe el repositorio", "Las pruebas inyectan un repositorio en memoria; la app inyecta Supabase."],
    ["Guardia de rutas", "components/Shell.tsx", "Solo entra a una ruta quien tiene sesión con el rol correcto."],
    ["Observador", "useConsulta + versión de datos", "Tras cada escritura, las pantallas vuelven a consultar automáticamente."],
    ["Fábrica", "data/index.ts · crearRepositorio()", "Selecciona el adaptador según la configuración del entorno."],
    ["Transacción (Unit of Work)", "Función guardar_actividad()", "La actividad y sus asignaciones se guardan juntas o no se guarda nada."]
  ], [22, 33, 45]));
  c.push(h2("5.5 Decisiones de arquitectura"));
  c.push(tituloTabla("Registro de decisiones de arquitectura (ADR)"));
  c.push(tabla(["Decisión", "Alternativas", "Motivo"], [
    ["PWA en lugar de app nativa", "Android/iOS nativo, React Native", "Un solo código para teléfono, tableta y escritorio; instalación sin tiendas; despliegue inmediato."],
    ["Supabase (PostgreSQL) como backend", "Firebase, API propia en Node", "Base relacional con integridad referencial, RLS para seguridad por fila y autenticación incluida; plan gratuito."],
    ["Autorización en la base de datos (RLS)", "Solo validar en el cliente", "El cliente puede ser manipulado; RLS garantiza la seguridad aunque alguien use la API directamente."],
    ["Estado por asignación", "Estado único por actividad (prototipo)", "Cada estudiante avanza a su ritmo en actividades de grupo (RN-07)."],
    ["Vercel para hospedaje", "Netlify, GitHub Pages", "Integración con GitHub, CDN, HTTPS y encabezados configurables sin costo."],
    ["TypeScript estricto", "JavaScript", "Detecta errores al compilar y documenta los contratos entre capas."]
  ], [26, 26, 48]));

  // 6
  c.push(h1("6. Lógica de negocio"));
  c.push(p("La lógica de negocio se concentra en la capa de dominio (`src/domain/reglas.ts`), que no depende de React ni de la base de datos, y se refuerza en PostgreSQL. Así cada regla se aplica en el cliente (respuesta inmediata) y en el servidor (seguridad)."));
  c.push(tituloTabla("Alineación de la lógica de negocio con los requerimientos"));
  c.push(tabla(["Regla", "Función de dominio", "Refuerzo en servidor", "Requerimiento"], [
    ["Validar actividad", "validarActividad(), normalizarActividad()", "CHECK de longitud, tipos date/time, NOT NULL", "RN-01 a RN-03"],
    ["Destinatario válido", "MemoriaRepo / SupabaseRepo", "guardar_actividad() verifica rol = estudiante", "RN-04"],
    ["Matriz de permisos", "puede(), exigir()", "Políticas RLS + privilegios por columna", "RN-05, RN-10"],
    ["Próximas actividades", "proximas(), porFecha()", "—", "RN-06, RF-04"],
    ["Conteo por estado", "contarPorEstado()", "—", "RF-05"],
    ["Estado global y avance", "estadoGlobal(), avance()", "Estado por fila en asignaciones", "RN-07, RF-12"],
    ["Conservar avance al editar", "—", "guardar_actividad() borra solo destinatarios retirados", "RN-08"],
    ["Eliminar con confirmación", "Diálogo en la interfaz", "ON DELETE CASCADE", "RN-09"]
  ], [20, 28, 32, 20]));
  c.push(h2("6.1 Secuencia: registrar actividad"));
  c.push(...(await figura("diagramas/secuencia-registrar.png", "Diagrama de secuencia del caso de uso Registrar actividad.", 610)));
  c.push(h2("6.2 Estados de una asignación"));
  c.push(...(await figura("diagramas/estados-asignacion.png", "Diagrama de estados de una asignación.", 600)));
  c.push(h2("6.3 Fragmento de la lógica de dominio"));
  c.push(codigo(`/** RN-07: estado global de una actividad para el profesor. */
export function estadoGlobal(asignaciones: Pick<Asignacion, "estado">[]): Estado {
  if (asignaciones.length === 0) return "Pendiente";
  if (asignaciones.every((s) => s.estado === "Terminada")) return "Terminada";
  if (asignaciones.every((s) => s.estado === "Pendiente")) return "Pendiente";
  return "En proceso";
}

/** Matriz de permisos (RN-05). */
const PERMISOS = {
  verMisActividades: ["estudiante"],
  cambiarEstado: ["estudiante"],
  gestionarActividades: ["profesor"],
  verTutorados: ["tutor"]
};`));

  // 7
  c.push(h1("7. Modelo de datos"));
  c.push(p("El modelo relacional tiene cuatro tablas propias más la tabla de usuarios del servicio de autenticación. La relación muchos a muchos entre actividades y estudiantes se resuelve con `asignaciones`, que además guarda el avance de cada estudiante. El detalle (diccionario de datos, seguridad, respaldo) está en el «Informe de la gestión de datos»."));
  c.push(...(await figura("diagramas/modelo-er.png", "Modelo entidad-relación.", 620)));

  // 8
  c.push(h1("8. Seguridad por diseño"));
  c.push(tituloTabla("Controles de seguridad incorporados en el diseño"));
  c.push(tabla(["Capa", "Control"], [
    ["Interfaz", "Rutas protegidas por rol; opciones visibles solo para quien puede usarlas; React escapa el texto (evita XSS)."],
    ["Dominio", "exigir(rol, permiso) antes de cada operación; validación de datos."],
    ["Transporte", "HTTPS obligatorio (HSTS); Content-Security-Policy que solo permite conectarse al propio sitio y a Supabase."],
    ["Autenticación", "Contraseñas con bcrypt en Supabase Auth; sesión con JWT que expira y se renueva."],
    ["Base de datos", "RLS en todas las tablas; privilegios por columna; funciones SECURITY DEFINER con search_path fijo; acceso anónimo revocado."],
    ["Auditoría", "Triggers que registran cada alta, cambio y baja en la bitácora con el usuario responsable."],
    ["Secretos", "Llaves en variables de entorno; `.env.local` ignorado por Git; la llave de servicio nunca llega al cliente."]
  ], [18, 82]));
  c.push(...nota("El diseño cubre la interfaz, la lógica de negocio y la arquitectura: la interfaz sigue el prototipo del cliente con mejoras de accesibilidad, la lógica de negocio implementa las reglas RN-01 a RN-10 en dos capas, y la arquitectura combina cliente–servidor, capas, puertos y adaptadores, BaaS y PWA.", "Conclusión"));

  await guardar("02-Diseno-de-la-aplicacion.docx", {
    titulo: "Diseño de la aplicación",
    subtitulo: "Bocetos, planos, arquitectura y lógica de negocio",
    descripcion: "Presenta los bocetos y los planos de las 12 pantallas, el sistema visual, los tipos de arquitectura evaluados y aplicados, los patrones de diseño, la lógica de negocio con sus diagramas y el modelo de datos."
  }, c);
}
