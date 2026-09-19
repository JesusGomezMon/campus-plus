import { figura, guardar, h1, h2, h3, nota, numerada, p, reiniciarContadores, tabla, tituloTabla, vinetas } from "./comun.mjs";

export async function generar() {
  reiniciarContadores();
  const c = [];

  // 1
  c.push(h1("1. Introducción"));
  c.push(h2("1.1 Propósito del documento"));
  c.push(p("Este documento define los requerimientos de **Campus+**, una aplicación de gestión de tareas (actividades académicas) para una organización con tres tipos de usuario: quien asigna el trabajo (profesor), quien lo ejecuta (estudiante) y quien supervisa el desempeño (tutor). Sirve como base para el diseño, el desarrollo, la gestión de datos y las pruebas, y permite rastrear cada requerimiento hasta su implementación y su evidencia de prueba."));
  c.push(h2("1.2 Alcance"));
  c.push(p("La versión 1 (V1) es una aplicación web progresiva (PWA) instalable, pensada principalmente para teléfonos y tabletas, con base de datos en la nube y autenticación. Incluye el registro, edición y eliminación de actividades; la asignación a un estudiante o a todo el grupo; el seguimiento del avance por parte del estudiante y la consulta de tutorados por parte del tutor."));
  c.push(p("Quedan fuera de V1 (se documentan como trabajo futuro en la sección 11): notificaciones, carga de archivos de entrega, calificaciones, administración de usuarios desde la aplicación y reportes exportables."));
  c.push(h2("1.3 Definiciones"));
  c.push(tituloTabla("Glosario"));
  c.push(tabla(["Término", "Definición"], [
    ["Actividad", "Tarea con nombre, descripción, materia, fecha y hora de entrega, registrada por un profesor. Equivale a una «tarea» en una empresa."],
    ["Asignación", "Relación entre una actividad y un estudiante; guarda el estado de avance propio de ese estudiante."],
    ["Estado", "Avance de una asignación: Pendiente, En proceso o Terminada."],
    ["Grupo completo", "Destinatario que asigna la actividad a todos los estudiantes."],
    ["Tutorado", "Estudiante asignado a un tutor para su seguimiento."],
    ["PWA", "Aplicación web progresiva: se instala desde el navegador y funciona sin conexión para la interfaz."],
    ["RLS", "Row Level Security: políticas de PostgreSQL que limitan qué filas puede ver o modificar cada usuario."],
    ["MoSCoW", "Técnica de priorización: Must (debe), Should (debería), Could (podría), Won't (no en esta versión)."]
  ], [22, 78]));

  // 2
  c.push(h1("2. Contexto del negocio"));
  c.push(h2("2.1 Problema"));
  c.push(p("En la organización cliente el seguimiento de tareas se hace por canales dispersos (mensajería, correo, listas personales). Esto provoca que:"));
  c.push(...vinetas([
    "Las personas que ejecutan el trabajo no tienen una vista única de lo que deben entregar ni de las fechas límite.",
    "Quien asigna las tareas no sabe, sin preguntar uno por uno, cuánto avance lleva cada persona.",
    "Los supervisores (tutores) no tienen visibilidad del trabajo de sus supervisados y detectan tarde los retrasos.",
    "La información vive en dispositivos personales, sin control de acceso ni respaldo."
  ]));
  c.push(h2("2.2 Objetivos de negocio"));
  c.push(tituloTabla("Objetivos de negocio e indicadores"));
  c.push(tabla(["ID", "Objetivo", "Indicador de éxito"], [
    ["OBJ-1", "Centralizar el registro y seguimiento de actividades en una sola herramienta.", "100 % de las actividades del grupo registradas en Campus+."],
    ["OBJ-2", "Dar visibilidad del avance a quien asigna y a quien supervisa.", "El profesor consulta el avance por estudiante sin contactarlo; el tutor ve el estado de cada tutorado."],
    ["OBJ-3", "Permitir el uso desde el teléfono, en cualquier lugar.", "Aplicación instalable y usable en pantallas de 360 px o más; puntuación Lighthouse ≥ 90."],
    ["OBJ-4", "Proteger la información y separar lo que puede ver cada rol.", "Ningún usuario puede leer o modificar datos fuera de su rol (verificado con pruebas de seguridad)."],
    ["OBJ-5", "Entregar una V1 funcional que pueda crecer.", "Arquitectura en capas y pruebas automatizadas que permitan agregar funciones sin regresiones."]
  ], [10, 50, 40]));
  c.push(h2("2.3 Aplicabilidad empresarial"));
  c.push(p("Aunque el caso de estudio es una institución educativa, el modelo corresponde al de una aplicación de gestión de tareas empresarial. La tabla 3 muestra la equivalencia de conceptos, lo que permite reutilizar la solución en un área de trabajo de cualquier empresa."));
  c.push(tituloTabla("Equivalencia entre el dominio académico y el empresarial"));
  c.push(tabla(["Campus+ (académico)", "Equivalente en una empresa", "Responsabilidad"], [
    ["Profesor", "Jefe de área / líder de proyecto", "Crea, asigna, edita y elimina tareas; revisa el avance."],
    ["Estudiante", "Colaborador / empleado", "Consulta sus tareas y actualiza su estado."],
    ["Tutor", "Supervisor / recursos humanos", "Da seguimiento al desempeño de un grupo de personas (solo lectura)."],
    ["Actividad", "Tarea / orden de trabajo", "Unidad de trabajo con fecha de entrega."],
    ["Grupo completo", "Todo el equipo", "Tarea que cada integrante debe cumplir."],
    ["Materia", "Proyecto / categoría", "Agrupa tareas relacionadas."]
  ], [25, 32, 43]));

  // 3
  c.push(h1("3. Partes interesadas y usuarios"));
  c.push(tituloTabla("Perfiles de usuario"));
  c.push(tabla(["Actor", "Descripción", "Necesidades principales", "Uso y dispositivo"], [
    ["Estudiante", "Persona que ejecuta las actividades asignadas.", "Ver qué debe entregar y cuándo; marcar su avance; no ver datos de otros.", "Varias veces al día · teléfono"],
    ["Profesor", "Persona que diseña y asigna actividades.", "Registrar rápido; asignar a una persona o al grupo; corregir y eliminar; ver el avance de cada estudiante.", "Diario · teléfono y tableta"],
    ["Tutor", "Persona que supervisa a un grupo de estudiantes.", "Consultar a sus tutorados y el estado de sus actividades sin poder modificarlas.", "Semanal · tableta o teléfono"],
    ["Administrador de TI", "Responsable técnico de la plataforma.", "Alta de usuarios y roles, respaldos, seguridad y despliegue.", "Ocasional · consola de Supabase y Vercel"],
    ["Dirección / coordinación", "Patrocinador del proyecto.", "Adopción, confiabilidad y protección de datos personales.", "—"]
  ], [15, 25, 38, 22]));
  c.push(h2("3.1 Fuentes y técnicas de obtención"));
  c.push(...vinetas([
    "**Análisis de bocetos y prototipo del cliente:** bocetos en Figma y el prototipo navegable «Campus+ V1» (escritorio) y «V2 Móvil» con 12 pantallas.",
    "**Escenarios de uso por rol:** recorridos paso a paso de cada actor para descubrir datos, reglas y casos alternos.",
    "**Análisis del dominio de datos:** revisión de qué información maneja cada pantalla y qué reglas de acceso aplican.",
    "**Análisis de brechas del prototipo:** se identificaron carencias del diseño original que se convirtieron en requerimientos (tabla 5)."
  ]));
  c.push(tituloTabla("Brechas detectadas en el prototipo y requerimiento que las resuelve"));
  c.push(tabla(["Brecha del prototipo", "Consecuencia", "Requerimiento"], [
    ["Un único estado por actividad, aun cuando es para todo el grupo.", "Si un estudiante marcaba «Terminada», cambiaba para todos.", "RF-09 y RN-07 (estado por asignación)."],
    ["Sin inicio de sesión; cualquier persona elegía un perfil.", "Nula seguridad y sin identidad de usuario.", "RF-01, RNF-04."],
    ["No existía forma de salir de un perfil.", "Usuario atrapado en el rol elegido.", "RF-02."],
    ["Datos solo en memoria del navegador.", "Información perdida y no compartida entre dispositivos.", "RNF-05, RNF-06."],
    ["Formulario sin validación.", "Actividades sin nombre o fecha.", "RN-01 a RN-04."],
    ["El profesor no veía el avance individual.", "Sin visibilidad (OBJ-2).", "RF-12."]
  ], [38, 34, 28]));

  // 4
  c.push(h1("4. Requerimientos funcionales"));
  c.push(p("Prioridad según MoSCoW. Todos los requerimientos «Must» y «Should» están implementados en V1; la columna «Evidencia» indica la prueba automatizada que los verifica (detalle en el documento «Resultados de las pruebas»)."));
  c.push(tituloTabla("Requerimientos funcionales"));
  c.push(tabla(["ID", "Requerimiento", "Rol", "Prioridad", "Evidencia"], [
    ["RF-01", "Iniciar sesión con correo y contraseña; el sistema reconoce el rol del usuario y lo lleva a su pantalla de inicio.", "Todos", "Must", "UI «Inicio de sesión», db:verificar"],
    ["RF-02", "Cerrar sesión desde cualquier pantalla.", "Todos", "Must", "UI «cerrar sesión regresa al inicio»"],
    ["RF-03", "Restringir cada pantalla al rol correspondiente (rutas protegidas).", "Todos", "Must", "UI y E2E «rutas de otro rol»"],
    ["RF-04", "Mostrar al estudiante sus 3 próximas actividades no terminadas, ordenadas por fecha y hora.", "Estudiante", "Must", "Unitaria «proximas», UI flujo estudiante"],
    ["RF-05", "Mostrar al estudiante el conteo de actividades por estado.", "Estudiante", "Should", "E2E «el tablero se actualiza»"],
    ["RF-06", "Listar las actividades del estudiante y filtrarlas por estado.", "Estudiante", "Must", "UI «filtra sus actividades»"],
    ["RF-07", "Ver el detalle de una actividad: descripción, materia, fecha, hora y profesor.", "Estudiante", "Must", "UI flujo estudiante"],
    ["RF-08", "Cambiar el estado de una actividad propia (Pendiente, En proceso, Terminada).", "Estudiante", "Must", "UI, E2E, integración Supabase"],
    ["RF-09", "Registrar una actividad y asignarla a un estudiante o al grupo completo.", "Profesor", "Must", "UI, E2E, BD «guardar_actividad»"],
    ["RF-10", "Editar una actividad propia conservando el avance de los estudiantes que siguen asignados.", "Profesor", "Must", "Repositorio «al editar conserva el avance»"],
    ["RF-11", "Eliminar una actividad propia con confirmación previa.", "Profesor", "Must", "UI «cancelar el diálogo no elimina», E2E"],
    ["RF-12", "Consultar el avance de cada estudiante en una actividad y el estado global.", "Profesor", "Should", "UI «avance de cada estudiante»"],
    ["RF-13", "Listar y filtrar las actividades registradas por el profesor.", "Profesor", "Must", "UI flujo profesor"],
    ["RF-14", "Listar los tutorados con matrícula y programa.", "Tutor", "Must", "UI flujo tutor, integración Supabase"],
    ["RF-15", "Consultar las actividades y estados de un tutorado.", "Tutor", "Must", "E2E «detalle de un tutorado»"],
    ["RF-16", "Instalar la aplicación en el dispositivo y abrir la interfaz sin conexión.", "Todos", "Should", "E2E «PWA», «sin conexión»"],
    ["RF-17", "Modo demostración con datos de ejemplo, sin servidor, para capacitación.", "Todos", "Could", "UI «restablece los datos»"],
    ["RF-18", "Notificar actividades próximas a vencer.", "Estudiante", "Won't (V2)", "—"]
  ], [8, 46, 12, 11, 23], { tam: 17 }));

  // 5
  c.push(h1("5. Requerimientos no funcionales"));
  c.push(tituloTabla("Requerimientos no funcionales y criterio de verificación"));
  c.push(tabla(["ID", "Atributo", "Requerimiento", "Métrica / verificación", "Resultado V1"], [
    ["RNF-01", "Usabilidad móvil", "Diseño mobile-first; objetivos táctiles ≥ 44 px; sin desplazamiento horizontal.", "E2E en teléfono (Pixel 7) y tableta (iPad).", "Cumple"],
    ["RNF-02", "Accesibilidad", "Cumplir WCAG 2.1 nivel AA (contraste, etiquetas, foco, roles ARIA).", "axe-core en 13 pantallas; Lighthouse.", "0 violaciones · 100/100"],
    ["RNF-03", "Rendimiento", "Primera carga visible < 2.5 s en móvil; interacción fluida.", "Lighthouse móvil (LCP, TBT).", "LCP 1.8 s · 98/100"],
    ["RNF-04", "Seguridad: autenticación", "Contraseñas cifradas (bcrypt) y sesión con JWT con expiración.", "Supabase Auth; pruebas de login.", "Cumple"],
    ["RNF-05", "Seguridad: autorización", "Cada rol solo ve y modifica lo que le corresponde, aplicado en el servidor.", "RLS; 19 pruebas de BD + 23 verificaciones en la nube.", "Cumple"],
    ["RNF-06", "Integridad de datos", "Validaciones en interfaz, dominio y base de datos; operaciones atómicas.", "CHECK, FK, ENUM, función transaccional.", "Cumple"],
    ["RNF-07", "Auditoría", "Registrar quién crea, modifica o elimina información.", "Tabla bitácora con triggers.", "Cumple"],
    ["RNF-08", "Disponibilidad", "Servicio en la nube con HTTPS; interfaz disponible sin conexión.", "Vercel + Supabase; service worker.", "Cumple"],
    ["RNF-09", "Portabilidad", "Funcionar en Android, iOS, Windows y macOS desde el navegador.", "PWA estándar; manifiesto e íconos.", "Cumple"],
    ["RNF-10", "Mantenibilidad", "Código tipado, en capas y con pruebas automatizadas; cobertura ≥ 80 %.", "TypeScript estricto; Vitest con cobertura.", "91.6 % de líneas"],
    ["RNF-11", "Privacidad", "Datos mínimos necesarios; secretos fuera del repositorio.", "Revisión del esquema; prueba de secretos.", "Cumple"],
    ["RNF-12", "Escalabilidad", "Soportar el crecimiento de usuarios sin rediseño.", "Índices en BD; servicios administrados.", "Cumple (diseño)"]
  ], [9, 15, 32, 26, 18], { tam: 17 }));

  // 6
  c.push(h1("6. Reglas de negocio"));
  c.push(tituloTabla("Reglas de negocio y dónde se aplican"));
  c.push(tabla(["ID", "Regla", "Se aplica en"], [
    ["RN-01", "Toda actividad requiere un nombre de 1 a 120 caracteres (sin contar espacios al inicio o al final).", "Formulario · dominio · CHECK en BD"],
    ["RN-02", "Toda actividad requiere una fecha de entrega válida; la hora es opcional (HH:MM).", "Formulario · dominio · tipo date/time"],
    ["RN-03", "La descripción admite hasta 2000 caracteres y la materia hasta 80; si no se indica materia se usa «General».", "Dominio · CHECK en BD · función"],
    ["RN-04", "El destinatario debe ser un estudiante existente o el grupo completo.", "Dominio · función guardar_actividad"],
    ["RN-05", "Matriz de permisos: solo el profesor gestiona actividades (y solo las suyas); solo el estudiante cambia el estado de SUS asignaciones; el tutor solo consulta a SUS tutorados.", "Rutas · dominio · RLS y privilegios por columna"],
    ["RN-06", "Las próximas actividades son las no terminadas, ordenadas por fecha y hora (sin hora al final del día); se muestran máximo 3.", "Dominio"],
    ["RN-07", "Cada estudiante tiene su propio estado por actividad. El estado global para el profesor es: todas Terminada → Terminada; todas Pendiente → Pendiente; cualquier otro caso → En proceso.", "Modelo de datos · dominio"],
    ["RN-08", "Al editar una actividad se conserva el avance de los estudiantes que siguen siendo destinatarios; los que dejan de serlo se eliminan.", "Función guardar_actividad · repositorio"],
    ["RN-09", "Eliminar una actividad requiere confirmación explícita y elimina en cascada sus asignaciones.", "Interfaz · FK ON DELETE CASCADE"],
    ["RN-10", "Ningún usuario puede cambiar su propio rol ni la autoría de una actividad.", "Sin políticas de edición de perfiles · privilegios por columna"]
  ], [9, 63, 28]));

  // 7
  c.push(h1("7. Historias de usuario"));
  c.push(p("Formato: «Como <rol> quiero <acción> para <beneficio>». La estimación usa puntos de historia (serie de Fibonacci) y los criterios de aceptación siguen el formato Dado / Cuando / Entonces."));
  c.push(tituloTabla("Backlog de producto (V1)"));
  c.push(tabla(["ID", "Historia", "Criterios de aceptación", "Pts", "RF"], [
    ["HU-01", "Como usuario quiero iniciar sesión con mi correo para acceder a mis datos de forma segura.", "Dado un correo y contraseña válidos, cuando entro, entonces veo el inicio de mi rol. Con datos incorrectos veo «Correo o contraseña incorrectos» sin revelar cuál falló.", "3", "RF-01"],
    ["HU-02", "Como usuario quiero cerrar sesión para proteger mi cuenta en dispositivos compartidos.", "Cuando toco «Cerrar sesión», entonces regreso al inicio y las rutas protegidas me redirigen.", "1", "RF-02, 03"],
    ["HU-03", "Como estudiante quiero ver mis próximas actividades para saber qué entregar primero.", "Veo máximo 3 no terminadas, ordenadas por fecha; si no hay, veo un mensaje.", "2", "RF-04, 05"],
    ["HU-04", "Como estudiante quiero filtrar mis actividades por estado para enfocarme.", "Al elegir un filtro solo veo actividades con ese estado.", "2", "RF-06"],
    ["HU-05", "Como estudiante quiero cambiar el estado de una actividad para reportar mi avance.", "Al elegir un estado se guarda, veo un aviso y el tablero se actualiza; persiste al recargar.", "3", "RF-07, 08"],
    ["HU-06", "Como profesor quiero registrar una actividad para un estudiante o para el grupo.", "Sin nombre o fecha veo errores; al guardar aparece en la lista y a cada destinatario como Pendiente.", "5", "RF-09"],
    ["HU-07", "Como profesor quiero editar una actividad para corregir datos.", "El formulario se precarga; al guardar se actualiza sin perder el avance de los estudiantes.", "3", "RF-10"],
    ["HU-08", "Como profesor quiero eliminar una actividad con confirmación para evitar errores.", "Aparece un diálogo; «Cancelar» no borra; «Eliminar» la quita de todos.", "2", "RF-11"],
    ["HU-09", "Como profesor quiero ver el avance de cada estudiante para detectar rezagos.", "En el detalle veo el estado de cada destinatario y el avance «x/y terminadas».", "3", "RF-12, 13"],
    ["HU-10", "Como tutor quiero ver a mis tutorados para darles seguimiento.", "Veo nombre, matrícula y programa solo de mis tutorados.", "2", "RF-14"],
    ["HU-11", "Como tutor quiero ver las actividades de un tutorado para identificar atrasos.", "Veo sus actividades y estados, sin poder modificarlos.", "2", "RF-15"],
    ["HU-12", "Como usuario quiero instalar la app en mi teléfono para abrirla como una aplicación nativa.", "El navegador ofrece instalar; la interfaz abre sin conexión.", "3", "RF-16"]
  ], [8, 30, 46, 6, 10], { tam: 17 }));

  // 8
  c.push(h1("8. Casos de uso"));
  c.push(...(await figura("diagramas/casos-de-uso.png", "Diagrama de casos de uso de Campus+.", 600)));
  c.push(h2("8.1 CU-05 Cambiar estado de actividad"));
  c.push(tabla(["Elemento", "Descripción"], [
    ["Actor", "Estudiante"],
    ["Precondición", "Sesión iniciada como estudiante; la actividad está asignada a él."],
    ["Flujo principal", "1. Abre «Mis actividades» o una próxima actividad. 2. Ve el detalle. 3. Elige un estado. 4. El sistema guarda el cambio solo en su asignación. 5. Muestra «Estado cambiado a …» y actualiza el tablero."],
    ["Flujos alternos", "3a. Elige el estado actual: no se realiza ninguna operación. 4a. Sin conexión o error: se muestra un aviso y el estado no cambia."],
    ["Poscondición", "La asignación queda con el nuevo estado y se registra en la bitácora."],
    ["Reglas", "RN-05, RN-07"]
  ], [22, 78]));
  c.push(h2("8.2 CU-06 Registrar actividad"));
  c.push(tabla(["Elemento", "Descripción"], [
    ["Actor", "Profesor"],
    ["Precondición", "Sesión iniciada como profesor."],
    ["Flujo principal", "1. Toca «+» o «Registra actividad». 2. Captura nombre, fecha, hora, materia, descripción y destinatario. 3. Toca «Guardar». 4. El sistema valida (RN-01 a RN-04). 5. Crea la actividad y sus asignaciones en una sola transacción. 6. Muestra «Actividad registrada» y la lista actualizada."],
    ["Flujos alternos", "4a. Datos inválidos: se marcan los campos con mensajes y no se guarda. 5a. Rechazo del servidor (permiso o restricción): se revierte la transacción y se muestra el motivo."],
    ["Poscondición", "La actividad aparece a cada destinatario como Pendiente; queda registrada en la bitácora."],
    ["Reglas", "RN-01 a RN-05"]
  ], [22, 78]));
  c.push(h2("8.3 CU-08 Eliminar actividad"));
  c.push(tabla(["Elemento", "Descripción"], [
    ["Actor", "Profesor"],
    ["Precondición", "La actividad fue registrada por el mismo profesor."],
    ["Flujo principal", "1. Toca «Eliminar» en la tarjeta o en el detalle. 2. El sistema muestra un diálogo con el nombre de la actividad. 3. Confirma. 4. Se eliminan la actividad y sus asignaciones. 5. Se muestra «Actividad eliminada»."],
    ["Flujos alternos", "3a. Cancela o presiona Esc: el diálogo se cierra sin cambios."],
    ["Poscondición", "La actividad deja de aparecer para todos los roles; la bitácora conserva el registro de la eliminación."],
    ["Reglas", "RN-05, RN-09"]
  ], [22, 78]));

  // 9
  c.push(h1("9. Restricciones y supuestos"));
  c.push(h2("9.1 Restricciones"));
  c.push(...vinetas([
    "Presupuesto cero para infraestructura en V1: se usan los planes gratuitos de Vercel (hospedaje) y Supabase (base de datos y autenticación).",
    "Uso principal en teléfonos y tabletas; debe funcionar en los navegadores actuales sin instalar software adicional.",
    "Las cuentas y los roles los da de alta el administrador; la aplicación no permite autorregistro (evita que alguien se asigne un rol).",
    "La V1 se entrega como base para mejoras posteriores: el diseño debe facilitar el crecimiento."
  ]));
  c.push(h2("9.2 Supuestos"));
  c.push(...vinetas([
    "Cada estudiante tiene como máximo un tutor asignado.",
    "Una actividad para el grupo se asigna a los estudiantes registrados al momento de crearla o editarla.",
    "Los usuarios cuentan con conexión a Internet para consultar y modificar datos; sin conexión solo se abre la interfaz.",
    "La zona horaria de las fechas de entrega es la de la organización (se guardan como fecha y hora locales)."
  ]));

  // 10
  c.push(h1("10. Matriz de trazabilidad"));
  c.push(p("Relaciona cada requerimiento con su historia, caso de uso, pantalla y evidencia de prueba. Permite comprobar que nada quedó sin implementar ni sin probar."));
  c.push(tituloTabla("Trazabilidad requerimiento → implementación → prueba"));
  c.push(tabla(["RF", "HU", "CU", "Pantalla(s)", "Código principal", "Prueba"], [
    ["RF-01", "HU-01", "CU-01", "01 Inicio", "screens/Home.tsx · SupabaseRepo.iniciarSesion", "tests/ui «Inicio de sesión»"],
    ["RF-02/03", "HU-02", "CU-01", "Todas", "components/Shell.tsx", "tests/ui y e2e «rutas»"],
    ["RF-04/05", "HU-03", "CU-02", "02", "domain/reglas.proximas", "tests/unit/reglas"],
    ["RF-06", "HU-04", "CU-03", "03", "screens/Estudiante.MisActividades", "tests/ui «filtra»"],
    ["RF-07/08", "HU-05", "CU-04/05", "04", "repo.cambiarEstado · RLS asignaciones_estado", "e2e · db/seguridad"],
    ["RF-09", "HU-06", "CU-06", "07", "FormActividad · guardar_actividad()", "e2e · db · integración"],
    ["RF-10", "HU-07", "CU-07", "08", "guardar_actividad() (edición)", "unit/memoriaRepo · integración"],
    ["RF-11", "HU-08", "CU-08", "09", "useEliminar · actividades_baja", "tests/ui · e2e"],
    ["RF-12/13", "HU-09", "CU-09", "06 · Detalle", "reglas.estadoGlobal/avance", "tests/ui «avance»"],
    ["RF-14/15", "HU-10/11", "CU-10/11", "10 · 11 · 12", "screens/Tutor · es_mi_tutorado()", "e2e · db/seguridad"],
    ["RF-16", "HU-12", "—", "Todas", "vite-plugin-pwa · usePwaInstall", "e2e «PWA»"]
  ], [11, 10, 10, 14, 33, 22], { tam: 16 }));

  // 11
  c.push(h1("11. Trabajo futuro (backlog V2)"));
  c.push(tituloTabla("Mejoras priorizadas para versiones posteriores"));
  c.push(tabla(["Prioridad", "Mejora", "Valor para el negocio"], [
    ["Alta", "Notificaciones push de actividades próximas a vencer.", "Reduce entregas tardías."],
    ["Alta", "Panel de administración para dar de alta usuarios, roles y tutores.", "Elimina la dependencia de la consola técnica."],
    ["Media", "Entrega de evidencias (archivos) por actividad.", "Centraliza también el resultado del trabajo."],
    ["Media", "Grupos o materias como entidad, para asignar por grupo y no a todos los estudiantes.", "Escala a varias áreas o equipos."],
    ["Media", "Reportes exportables (PDF/Excel) de avance por grupo.", "Apoya la toma de decisiones de la coordinación."],
    ["Baja", "Comentarios entre profesor y estudiante por actividad.", "Mejora la comunicación."]
  ], [14, 52, 34]));
  c.push(...nota("Los requerimientos Must y Should de V1 están implementados y verificados con pruebas automatizadas. La matriz de trazabilidad de la sección 10 enlaza cada uno con su código y su evidencia.", "Conclusión"));

  await guardar("01-Analisis-de-requerimientos.docx", {
    titulo: "Análisis de requerimientos",
    subtitulo: "Necesidades de los usuarios, requisitos del negocio y especificación de V1",
    descripcion: "Define el problema, los objetivos del negocio, los usuarios, los requerimientos funcionales y no funcionales, las reglas de negocio, las historias de usuario, los casos de uso y la trazabilidad hasta las pruebas."
  }, c);
}
