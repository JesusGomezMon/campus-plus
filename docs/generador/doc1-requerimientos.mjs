import { figura, guardar, h1, h2, h3, nota, numerada, p, reiniciarContadores, tabla, tituloTabla, vinetas } from "./comun.mjs";

export async function generar() {
  reiniciarContadores();
  const c = [];

  // 1
  c.push(h1("1. Introducción"));
  c.push(h2("1.1 Propósito del documento"));
  c.push(p("Aquí escribo qué debe hacer **Campus+**, una aplicación para organizar actividades escolares. La usan tres tipos de usuario: el profesor, que deja las actividades; el estudiante, que las hace; y el tutor, que da seguimiento. Lo hice antes de programar, para tener claro el alcance."));
  c.push(h2("1.2 Alcance"));
  c.push(p("La versión 1 (V1) es una aplicación web que se puede instalar en el teléfono (PWA), con base de datos en la nube e inicio de sesión. Incluye registrar, editar y eliminar actividades, asignarlas a un estudiante o a todo el grupo, que el estudiante marque su avance y que el tutor consulte a sus tutorados."));
  c.push(p("No entran en esta versión: notificaciones, subir archivos de entrega, calificaciones y administrar usuarios desde la app (sección 11)."));
  c.push(h2("1.3 Definiciones"));
  c.push(tituloTabla("Glosario"));
  c.push(tabla(["Término", "Definición"], [
    ["Actividad", "Tarea con nombre, materia y fecha de entrega, que registra un profesor."],
    ["Asignación", "La relación entre una actividad y un estudiante. Ahí se guarda el avance de ese estudiante."],
    ["Estado", "Cómo va una asignación: Pendiente, En proceso o Terminada."],
    ["PWA", "Aplicación web que se instala desde el navegador y abre aunque no haya internet."],
    ["RLS", "Reglas de PostgreSQL que deciden qué filas puede ver o cambiar cada usuario."],
    ["MoSCoW", "Forma de priorizar: Must (debe), Should (debería), Could (podría), Won't (no en esta versión)."]
  ], [22, 78]));

  // 2
  c.push(h1("2. Contexto del negocio"));
  c.push(h2("2.1 Problema"));
  c.push(p("Hoy las tareas se avisan por muchos lados distintos: mensajes, correo, libretas. Eso hace que:"));
  c.push(...vinetas([
    "El estudiante no tenga un solo lugar donde ver todo lo que debe entregar y para cuándo.",
    "El profesor no sepa cómo va cada quien si no le pregunta uno por uno.",
    "El tutor se entere tarde de los atrasos de sus tutorados.",
    "Todo quede en el teléfono de cada persona, sin respaldo."
  ]));
  c.push(h2("2.2 Objetivos"));
  c.push(tituloTabla("Objetivos y cómo sé si se cumplieron"));
  c.push(tabla(["ID", "Objetivo", "Indicador de éxito"], [
    ["OBJ-1", "Tener las actividades en un solo lugar.", "Que todas las actividades del grupo se registren en Campus+."],
    ["OBJ-2", "Que el profesor y el tutor puedan ver el avance.", "El profesor revisa cómo va cada estudiante sin preguntarle."],
    ["OBJ-3", "Que se pueda usar desde el teléfono.", "La app se instala y se ve bien en pantallas chicas."],
    ["OBJ-4", "Cuidar la información y separar lo que ve cada rol.", "Que nadie pueda ver ni cambiar datos que no le tocan."]
  ], [10, 45, 45]));
  c.push(h2("2.3 Aplicabilidad empresarial"));
  c.push(p("Aunque mi caso de estudio es una escuela, la app sirve igual para una empresa que reparte tareas: casi solo cambian los nombres."));
  c.push(tituloTabla("Equivalencia entre el caso escolar y uno de empresa"));
  c.push(tabla(["Campus+ (escuela)", "En una empresa", "Qué hace"], [
    ["Profesor", "Jefe de área", "Registra y asigna tareas, y revisa el avance."],
    ["Estudiante", "Colaborador", "Consulta sus tareas y actualiza cómo va."],
    ["Tutor", "Supervisor", "Da seguimiento a un grupo de personas (solo consulta)."],
    ["Actividad", "Tarea", "Un trabajo con fecha de entrega."]
  ], [25, 27, 48]));

  // 3
  c.push(h1("3. Usuarios"));
  c.push(tituloTabla("Perfiles de usuario"));
  c.push(tabla(["Actor", "Qué necesita", "Cuándo y dónde la usa"], [
    ["Estudiante", "Ver qué debe entregar y cuándo, y marcar su avance.", "Varias veces al día · teléfono"],
    ["Profesor", "Registrar rápido, asignar a una persona o al grupo, corregir y ver cómo va cada quien.", "Diario · teléfono y tableta"],
    ["Tutor", "Ver a sus tutorados y el estado de sus actividades, sin poder cambiarlas.", "Semanal · tableta o teléfono"]
  ], [16, 58, 26]));
  c.push(h2("3.1 De dónde salieron los requerimientos"));
  c.push(...vinetas([
    "**Bocetos y prototipo:** revisé los bocetos en Figma y el prototipo navegable con 12 pantallas.",
    "**Recorrido por rol:** seguí paso a paso lo que haría cada usuario para ver qué datos y reglas hacían falta.",
    "**Comparación con el prototipo:** encontré cosas que le faltaban y las convertí en requerimientos (tabla 5)."
  ]));
  c.push(tituloTabla("Lo que le faltaba al prototipo"));
  c.push(tabla(["Qué le faltaba", "Qué problema causaba", "Requerimiento"], [
    ["Un solo estado por actividad, aunque fuera para todo el grupo.", "Si un estudiante ponía «Terminada», cambiaba para todos.", "RF-08, RN-06"],
    ["No había inicio de sesión.", "No había seguridad ni forma de saber quién era quién.", "RF-01, RNF-04"],
    ["Los datos solo vivían en el navegador.", "Se perdía la información entre dispositivos.", "RNF-05"],
    ["El formulario no validaba nada.", "Se podían guardar actividades sin nombre o sin fecha.", "RN-01, RN-02"]
  ], [36, 36, 28]));

  // 4
  c.push(h1("4. Requerimientos funcionales"));
  c.push(p("Los prioricé con MoSCoW. Los «Must» y los «Should» ya están hechos en la V1."));
  c.push(tituloTabla("Requerimientos funcionales"));
  c.push(tabla(["ID", "Requerimiento", "Rol", "Prioridad"], [
    ["RF-01", "Iniciar y cerrar sesión; la app reconoce el rol y lleva al usuario a su pantalla.", "Todos", "Must"],
    ["RF-02", "Que cada pantalla sea solo para su rol.", "Todos", "Must"],
    ["RF-03", "Mostrarle al estudiante sus 3 próximas actividades sin terminar, ordenadas por fecha.", "Estudiante", "Must"],
    ["RF-04", "Mostrarle cuántas actividades tiene en cada estado.", "Estudiante", "Should"],
    ["RF-05", "Listar sus actividades y poder filtrarlas por estado.", "Estudiante", "Must"],
    ["RF-06", "Ver el detalle de una actividad: descripción, materia, fecha y profesor.", "Estudiante", "Must"],
    ["RF-07", "Cambiar el estado de una actividad propia.", "Estudiante", "Must"],
    ["RF-08", "Registrar una actividad y asignarla a un estudiante o al grupo completo.", "Profesor", "Must"],
    ["RF-09", "Editar una actividad propia sin borrar el avance de los estudiantes.", "Profesor", "Must"],
    ["RF-10", "Eliminar una actividad propia, pidiendo confirmación antes.", "Profesor", "Must"],
    ["RF-11", "Ver cómo va cada estudiante en una actividad.", "Profesor", "Should"],
    ["RF-12", "Listar y filtrar las actividades que registró.", "Profesor", "Must"],
    ["RF-13", "Listar a sus tutorados y ver sus actividades.", "Tutor", "Must"],
    ["RF-14", "Instalar la app en el dispositivo y abrirla sin internet.", "Todos", "Should"],
    ["RF-15", "Avisar cuando una actividad esté por vencer.", "Estudiante", "Won't (V2)"]
  ], [9, 57, 17, 17], { tam: 17 }));

  // 5
  c.push(h1("5. Requerimientos no funcionales"));
  c.push(tituloTabla("Requerimientos no funcionales"));
  c.push(tabla(["ID", "Atributo", "Requerimiento", "Resultado V1"], [
    ["RNF-01", "Uso en el teléfono", "Diseñar primero para el celular, con botones grandes y sin scroll horizontal.", "Cumple"],
    ["RNF-02", "Accesibilidad", "Cumplir WCAG 2.1 nivel AA: contraste, etiquetas y foco visible.", "0 violaciones"],
    ["RNF-03", "Rendimiento", "Que la primera pantalla se vea en menos de 2.5 s en móvil.", "1.8 s"],
    ["RNF-04", "Autenticación", "Contraseñas cifradas y sesión con un token que expira.", "Cumple"],
    ["RNF-05", "Permisos", "Que cada rol vea y cambie solo lo suyo, revisado en el servidor.", "Cumple"],
    ["RNF-06", "Integridad", "Validar en la pantalla y en la base de datos; guardar todo junto o nada.", "Cumple"],
    ["RNF-07", "Auditoría", "Guardar quién crea, cambia o borra información.", "Cumple"],
    ["RNF-08", "Mantenibilidad", "Código tipado, separado en capas y con pruebas; cobertura ≥ 80 %.", "91.6 %"]
  ], [10, 18, 54, 18], { tam: 17 }));

  // 6
  c.push(h1("6. Reglas de negocio"));
  c.push(tituloTabla("Reglas de negocio y dónde se aplican"));
  c.push(tabla(["ID", "Regla", "Se aplica en"], [
    ["RN-01", "Toda actividad necesita un nombre de 1 a 120 caracteres.", "Formulario y base de datos"],
    ["RN-02", "Toda actividad necesita una fecha de entrega; la hora es opcional.", "Formulario y base de datos"],
    ["RN-03", "El destinatario tiene que ser un estudiante que exista o el grupo completo.", "Reglas del negocio"],
    ["RN-04", "Solo el profesor maneja actividades, y solo las suyas; solo el estudiante cambia el estado de las suyas; el tutor solo consulta.", "Rutas, reglas y base de datos"],
    ["RN-05", "Las próximas actividades son las que no están terminadas, ordenadas por fecha; se muestran máximo 3.", "Reglas del negocio"],
    ["RN-06", "Cada estudiante tiene su propio estado. El profesor ve el general: todas Terminada → Terminada; todas Pendiente → Pendiente; si no, En proceso.", "Modelo de datos"],
    ["RN-07", "Al editar una actividad se conserva el avance de los estudiantes que siguen asignados.", "Base de datos"],
    ["RN-08", "Para eliminar una actividad hay que confirmar, y se borran también sus asignaciones.", "Pantalla y base de datos"]
  ], [9, 63, 28]));

  // 7
  c.push(h1("7. Historias de usuario"));
  c.push(p("Las escribí con el formato «Como <rol> quiero <acción> para <beneficio>» y estimé el esfuerzo con puntos (1, 2, 3, 5)."));
  c.push(tituloTabla("Backlog de la V1"));
  c.push(tabla(["ID", "Historia", "Criterio de aceptación", "Pts"], [
    ["HU-01", "Como usuario quiero iniciar sesión para entrar a mis datos.", "Con el correo y la contraseña correctos entro a mi pantalla; si están mal, veo un mensaje.", "3"],
    ["HU-02", "Como usuario quiero cerrar sesión para que nadie más entre.", "Al cerrar sesión regreso al inicio y ya no puedo entrar a las pantallas protegidas.", "1"],
    ["HU-03", "Como estudiante quiero ver mis próximas actividades.", "Veo máximo 3 sin terminar, ordenadas por fecha.", "2"],
    ["HU-04", "Como estudiante quiero filtrar mis actividades por estado.", "Al elegir un filtro solo veo las de ese estado.", "2"],
    ["HU-05", "Como estudiante quiero cambiar el estado de una actividad.", "Se guarda, veo un aviso y sigue igual si recargo la página.", "3"],
    ["HU-06", "Como profesor quiero registrar una actividad para uno o para el grupo.", "Si falta el nombre o la fecha veo los errores; al guardar le aparece al estudiante como Pendiente.", "5"],
    ["HU-07", "Como profesor quiero editar una actividad.", "El formulario aparece lleno y al guardar no se pierde el avance.", "3"],
    ["HU-08", "Como profesor quiero que me pida confirmación al eliminar.", "Sale un cuadro; «Cancelar» no borra.", "2"],
    ["HU-09", "Como profesor quiero ver cómo va cada estudiante.", "En el detalle veo el estado de cada uno y el avance «x/y terminadas».", "3"],
    ["HU-10", "Como tutor quiero ver a mis tutorados y sus actividades.", "Veo solo a los míos y no puedo cambiar sus estados.", "3"]
  ], [8, 34, 50, 8], { tam: 17 }));

  // 8
  c.push(h1("8. Casos de uso"));
  c.push(...(await figura("diagramas/casos-de-uso.png", "Diagrama de casos de uso.", 560)));
  c.push(h2("8.1 Registrar actividad (profesor)"));
  c.push(tabla(["Elemento", "Descripción"], [
    ["Precondición", "Tiene sesión como profesor."],
    ["Flujo principal", "1. Toca «Registra actividad». 2. Escribe nombre, fecha, materia y a quién se la deja. 3. Toca «Guardar». 4. La app valida. 5. Guarda la actividad y sus asignaciones. 6. Muestra «Actividad registrada»."],
    ["Flujos alternos", "4a. Si hay datos mal, se marcan los campos y no se guarda. 5a. Si el servidor la rechaza, no se guarda nada y sale el motivo."],
    ["Poscondición", "La actividad le aparece a cada destinatario como Pendiente."]
  ], [22, 78]));
  c.push(h2("8.2 Cambiar estado (estudiante)"));
  c.push(tabla(["Elemento", "Descripción"], [
    ["Precondición", "Tiene sesión como estudiante y la actividad está asignada a él."],
    ["Flujo principal", "1. Abre el detalle de la actividad. 2. Elige un estado. 3. La app guarda el cambio solo en su asignación. 4. Muestra el aviso y actualiza el tablero."],
    ["Flujos alternos", "2a. Elige el estado que ya tenía: no se hace nada. 3a. Sin internet: sale un aviso y el estado no cambia."],
    ["Poscondición", "La asignación queda con el nuevo estado."]
  ], [22, 78]));

  // 9
  c.push(h1("9. Restricciones y supuestos"));
  c.push(h2("9.1 Restricciones"));
  c.push(...vinetas([
    "No hay presupuesto: uso los planes gratuitos de Vercel y Supabase.",
    "Se usa sobre todo en teléfono y tableta, sin instalar nada extra.",
    "Las cuentas y los roles los da de alta el administrador; la app no deja registrarse solo."
  ]));
  c.push(h2("9.2 Supuestos"));
  c.push(...vinetas([
    "Cada estudiante tiene como máximo un tutor.",
    "Una actividad para el grupo se les deja a los estudiantes registrados en ese momento.",
    "Los usuarios tienen internet para consultar y cambiar datos."
  ]));

  // 10
  c.push(h1("10. Matriz de trazabilidad"));
  c.push(p("Esta tabla conecta cada requerimiento con su historia, su pantalla y su prueba. Me sirvió para revisar que no se me quedara nada sin hacer ni sin probar."));
  c.push(tituloTabla("Trazabilidad requerimiento → pantalla → prueba"));
  c.push(tabla(["RF", "HU", "Pantalla", "Prueba"], [
    ["RF-01, RF-02", "HU-01, HU-02", "Inicio de sesión · todas", "Pruebas de interfaz y E2E de rutas"],
    ["RF-03, RF-04", "HU-03", "Inicio del estudiante", "Prueba unitaria de «próximas»"],
    ["RF-05", "HU-04", "Mis actividades", "Prueba de interfaz del filtro"],
    ["RF-06, RF-07", "HU-05", "Detalle de actividad", "E2E y pruebas de base de datos"],
    ["RF-08", "HU-06", "Registrar actividad", "E2E, base de datos e integración"],
    ["RF-09", "HU-07", "Editar actividad", "Prueba del repositorio"],
    ["RF-10", "HU-08", "Confirmar eliminación", "Prueba de interfaz y E2E"],
    ["RF-11, RF-12", "HU-09", "Actividades del profesor", "Prueba de interfaz del avance"],
    ["RF-13", "HU-10", "Tutorados", "E2E y pruebas de permisos"]
  ], [17, 17, 28, 38], { tam: 17 }));

  // 11
  c.push(h1("11. Trabajo futuro"));
  c.push(tituloTabla("Mejoras que dejo anotadas para más adelante"));
  c.push(tabla(["Prioridad", "Mejora", "Por qué serviría"], [
    ["Alta", "Avisos en el teléfono cuando una actividad esté por vencer.", "Habría menos entregas tarde."],
    ["Alta", "Una pantalla para dar de alta usuarios y roles.", "Ya no habría que entrar a la consola técnica."],
    ["Media", "Subir archivos de entrega en cada actividad.", "Se tendría también el resultado del trabajo."],
    ["Media", "Reportes de avance que se puedan exportar.", "Ayudaría a revisar cómo va el grupo."]
  ], [14, 52, 34]));
  c.push(...nota("Los requerimientos Must y Should de la V1 están hechos y probados. La tabla de la sección 10 enlaza cada uno con su pantalla y su prueba.", "Conclusión"));

  await guardar("01-Analisis-de-requerimientos.docx", {
    titulo: "Análisis de requerimientos",
    subtitulo: "Qué necesitan los usuarios y qué debe hacer la V1",
    descripcion: "Aquí explico el problema, los objetivos, quiénes usan la app, los requerimientos, las reglas de negocio, las historias de usuario y los casos de uso."
  }, c);
}
