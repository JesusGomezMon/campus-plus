import { readFileSync } from "node:fs";
import { codigo, figura, guardar, h1, h2, h3, nota, numerada, p, RAIZ, reiniciarContadores, tabla, tituloTabla, vinetas } from "./comun.mjs";

export async function generar() {
  reiniciarContadores();
  const lat = JSON.parse(readFileSync(RAIZ + "reportes/latencia-supabase.json", "utf8"));
  const verif = readFileSync(RAIZ + "reportes/verificacion-supabase.txt", "utf8").trim();
  const c = [];

  c.push(h1("1. Resumen"));
  c.push(p("Campus+ guarda su información en una base de datos **PostgreSQL** que administra **Supabase**. La app no habla directo con la base: pasa por una capa intermedia. Los permisos se revisan en el propio servidor, y cada cambio queda anotado en una tabla de bitácora."));
  c.push(tituloTabla("Resumen de la gestión de datos"));
  c.push(tabla(["Aspecto", "Cómo lo resolví"], [
    ["Dónde se guardan los datos", "PostgreSQL en Supabase (en la nube)"],
    ["Cómo se conecta con la app", "Una capa de repositorio, para que las pantallas no toquen la base"],
    ["Seguridad", "Inicio de sesión y permisos revisados en la base de datos (RLS)"],
    ["Integridad", "Llaves, restricciones y una función que guarda todo de una vez"]
  ], [34, 66]));

  c.push(h1("2. Por qué elegí PostgreSQL"));
  c.push(tituloTabla("Las opciones que comparé"));
  c.push(tabla(["Criterio", "PostgreSQL (Supabase)", "Firebase", "MySQL con API propia"], [
    ["Modelo", "Relacional", "Documentos (NoSQL)", "Relacional"],
    ["Permisos por fila", "Ya vienen (RLS)", "Reglas propias", "Hay que programarlos"],
    ["Inicio de sesión", "Incluido", "Incluido", "Hay que hacerlo"],
    ["Servidor que mantener", "No", "No", "Sí"]
  ], [24, 26, 24, 26]));
  c.push(p("Elegí PostgreSQL en Supabase porque mis datos son relacionales (actividades, estudiantes, asignaciones) y sobre todo porque me deja poner los permisos dentro de la base de datos, sin depender de que la app se porte bien."));

  c.push(h1("3. Modelo de datos"));
  c.push(h2("3.1 Modelo entidad-relación"));
  c.push(...(await figura("diagramas/modelo-er.png", "Las cuatro tablas y cómo se relacionan.", 580)));
  c.push(h2("3.2 Normalización"));
  c.push(p("El esquema quedó en **tercera forma normal**:"));
  c.push(...vinetas([
    "**1FN:** cada columna guarda un solo dato. Los destinatarios de una actividad no van en una lista, sino como filas en `asignaciones`.",
    "**2FN:** en `asignaciones` la llave son dos columnas juntas, y el `estado` depende de las dos.",
    "**3FN:** no repito datos: el nombre del profesor no se copia en `actividades`, se saca con la llave foránea."
  ]));
  c.push(p("La decisión más importante fue mover el estado de la actividad a la asignación. En el prototipo había un solo estado por actividad, así que si un estudiante marcaba como terminada una actividad del grupo, quedaba terminada para todos."));
  c.push(h2("3.3 Diccionario de datos"));
  const dic = (t, filas) => [tituloTabla(t), tabla(["Columna", "Tipo", "Qué guarda"], filas, [26, 20, 54], { tam: 16 })];
  c.push(...dic("Tabla profiles (los usuarios)", [
    ["id", "uuid", "Identificador del usuario (llave primaria)."],
    ["nombre", "text", "Nombre que se muestra."],
    ["rol", "enum", "estudiante, profesor o tutor. Define qué puede hacer."],
    ["matricula", "text", "Solo para estudiantes; no se repite."],
    ["programa", "text", "Carrera del estudiante."],
    ["tutor_id", "uuid", "El tutor que le tocó (llave foránea a profiles)."]
  ]));
  c.push(...dic("Tabla actividades", [
    ["id", "bigint", "Identificador (llave primaria)."],
    ["titulo", "text", "Nombre de la actividad, de 1 a 120 caracteres."],
    ["descripcion", "text", "Indicaciones, hasta 2000 caracteres."],
    ["materia", "text", "Materia o categoría; si no se pone, queda «General»."],
    ["fecha / hora", "date / time", "Cuándo se entrega. La hora es opcional."],
    ["para_grupo", "boolean", "Si se le dejó a todo el grupo."],
    ["profesor_id", "uuid", "Quién la registró (llave foránea a profiles)."]
  ]));
  c.push(...dic("Tabla asignaciones", [
    ["actividad_id", "bigint", "La actividad (parte de la llave primaria)."],
    ["estudiante_id", "uuid", "A quién se le dejó (parte de la llave primaria)."],
    ["estado", "enum", "Pendiente, En proceso o Terminada. Es el avance de ese estudiante."],
    ["actualizado", "timestamptz", "Cuándo cambió por última vez."]
  ]));
  c.push(...dic("Tabla bitacora", [
    ["id", "bigint", "Identificador del movimiento."],
    ["tabla / operacion", "text", "Qué tabla y si fue alta, cambio o baja."],
    ["usuario_id", "uuid", "Quién hizo el cambio."],
    ["fecha", "timestamptz", "Cuándo."],
    ["antes / despues", "jsonb", "Cómo quedó el registro antes y después."]
  ]));
  c.push(h2("3.4 Índices"));
  c.push(p("Agregué índices en las columnas por las que más se busca, para que las consultas no tengan que recorrer toda la tabla:"));
  c.push(tituloTabla("Índices"));
  c.push(tabla(["Columnas", "Consulta que acelera"], [
    ["profesor_id, fecha (actividades)", "La lista de actividades del profesor ordenada por fecha."],
    ["estudiante_id (asignaciones)", "Las actividades de un estudiante."],
    ["tutor_id (profiles)", "Los tutorados de un tutor."],
    ["rol (profiles)", "La lista de estudiantes para asignar actividades."]
  ], [40, 60]));

  c.push(h1("4. Cómo se conecta con la aplicación"));
  c.push(h2("4.1 La capa intermedia"));
  c.push(p("Las pantallas nunca llaman a la base de datos directo. Todo pasa por el `Repositorio`, que tiene dos versiones: `SupabaseRepo` (la real) y `MemoriaRepo` (datos de ejemplo, para las pruebas). Así puedo probar la app sin internet."));
  c.push(...(await figura("diagramas/arquitectura-capas.png", "Las capas y las dos versiones del repositorio.", 420)));
  c.push(tituloTabla("Lo que hace cada operación"));
  c.push(tabla(["Operación", "Rol", "Qué hace en la base de datos"], [
    ["iniciarSesion", "Todos", "Revisa el correo y la contraseña, y lee el perfil"],
    ["misActividades", "Estudiante", "Trae sus actividades en una sola consulta"],
    ["cambiarEstado", "Estudiante", "Cambia el estado, solo en su propia fila"],
    ["guardarActividad", "Profesor", "Crea o edita la actividad y sus asignaciones de una sola vez"],
    ["tutorados", "Tutor", "Trae a los estudiantes que tiene asignados"]
  ], [26, 16, 58]));
  c.push(h2("4.2 Guardar todo de una vez"));
  c.push(p("Registrar una actividad toca dos tablas. Para que nunca quede una actividad sin destinatarios (o al revés), lo hago con una función en la base de datos que guarda las dos cosas juntas: si algo falla, no se guarda nada. Además conserva el avance de los estudiantes que siguen asignados."));
  c.push(h2("4.3 Mensajes de error"));
  c.push(p("Los errores de la base de datos los traduzco a mensajes que se entiendan, sin enseñar detalles técnicos:"));
  c.push(tituloTabla("Errores y qué ve el usuario"));
  c.push(tabla(["Qué pasó", "Mensaje al usuario"], [
    ["No tiene permiso", "No tienes permiso para realizar esta acción."],
    ["El registro ya no existe", "El registro no existe o fue eliminado."],
    ["Los datos no cumplen alguna regla", "Los datos no son válidos."],
    ["No hay internet", "Sin conexión con el servidor. Revisa tu internet."]
  ], [40, 60]));
  c.push(h2("4.4 Que sea rápida"));
  c.push(...vinetas([
    "**Una sola consulta por pantalla:** las relaciones se resuelven en el servidor, en vez de hacer una consulta por cada registro.",
    "**Índices** en las columnas por las que se filtra.",
    "**La app se guarda en el dispositivo**, así que por internet solo viajan los datos."
  ]));
  c.push(tituloTabla(`Tiempos medidos contra Supabase (${lat.repeticiones} repeticiones)`));
  c.push(tabla(["Consulta", "Mediana (ms)", "Máximo típico (ms)"], lat.resultados.map((r) => [r.consulta, r.mediana, r.p95]), [60, 20, 20]));
  c.push(p("Estos tiempos incluyen el viaje por internet; lo que tarda la base de datos en sí es una parte chica."));

  c.push(h1("5. Seguridad de los datos"));
  c.push(h2("5.1 Inicio de sesión"));
  c.push(...vinetas([
    "Las contraseñas se guardan cifradas, nunca en texto plano.",
    "No hay registro abierto: las cuentas y los roles los crea el administrador, para que nadie se ponga el rol de profesor.",
    "Si alguien se equivoca al entrar, el mensaje no dice si el correo existe o no."
  ]));
  c.push(h2("5.2 Permisos dentro de la base de datos"));
  c.push(p("Todas las tablas tienen RLS encendida: cada consulta lleva la identidad de quien la hace y PostgreSQL filtra las filas según las reglas. Esto funciona aunque alguien intente entrar por fuera de la app."));
  c.push(tituloTabla("Quién puede hacer qué"));
  c.push(tabla(["Tabla", "Quién puede"], [
    ["profiles", "Cada quien ve su perfil; el profesor ve a los estudiantes y el tutor a sus tutorados. Nadie los edita desde la app."],
    ["actividades", "Las ve el profesor que las creó, los estudiantes asignados y sus tutores. Solo el profesor autor las cambia o las borra."],
    ["asignaciones", "Solo el estudiante asignado puede cambiar su estado, y nada más esa columna."],
    ["bitacora", "Nadie desde la app."]
  ], [22, 78]));
  c.push(codigo(`-- Solo el estudiante dueño puede cambiar su estado
create policy asignaciones_estado on public.asignaciones for update to authenticated
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());`));
  c.push(h2("5.3 Otras medidas"));
  c.push(tituloTabla("Otros riesgos y qué los evita"));
  c.push(tabla(["Riesgo", "Qué lo evita"], [
    ["Entrar sin sesión", "Sin sesión no se puede leer ninguna tabla."],
    ["Que alguien se dé más permisos", "El rol y el autor de una actividad no se pueden cambiar."],
    ["Inyección SQL", "Las consultas van con parámetros; lo probé con una cadena maliciosa."],
    ["Que se filtre una llave", "En la app solo va la llave pública; la otra nunca sale de mi computadora."],
    ["Datos inválidos", "Se valida en el formulario y otra vez en la base de datos."]
  ], [28, 72]));
  c.push(h2("5.4 Privacidad"));
  c.push(p("Guardo solo lo necesario: nombre, matrícula, programa y correo. Como se trata de una institución pública, antes de usar la app con datos reales haría falta publicar el aviso de privacidad. Las contraseñas no las puede ver nadie, ni el administrador."));

  c.push(h1("6. Integridad y respaldo"));
  c.push(h2("6.1 Reglas de integridad"));
  c.push(...vinetas([
    "Llave primaria en todas las tablas, y en asignaciones son dos columnas juntas, para que un estudiante no tenga la misma actividad dos veces.",
    "Llaves foráneas: si se borra una actividad se borran sus asignaciones, y si se borra un tutor sus estudiantes no se borran.",
    "Listas cerradas (ENUM) para el rol y el estado, y límites de longitud en los textos."
  ]));
  c.push(h2("6.2 Migraciones y datos de ejemplo"));
  c.push(...vinetas([
    "El esquema completo está guardado en Git, así que se puede volver a crear cuando sea.",
    "`npm run db:seed` crea las cuentas de prueba y las actividades de ejemplo.",
    "Algo que aprendí: la migración no se puede correr dos veces, porque la segunda vez da error. Lo dejo anotado para ejecutarla una sola vez."
  ]));
  c.push(h2("6.3 Respaldo"));
  c.push(tituloTabla("Plan de respaldo"));
  c.push(tabla(["Elemento", "Qué se hace"], [
    ["El esquema", "Está en Git, así que se puede volver a crear en cualquier momento."],
    ["Los datos", "Exportarlos una vez por semana y guardar el archivo fuera del proyecto. En un plan de paga, Supabase los respalda solo todos los días."],
    ["Probar que sirve", "Restaurar el respaldo en un proyecto de prueba y revisar que los datos y los permisos quedaron bien."]
  ], [26, 74]));
  c.push(h2("6.4 Modo demostración"));
  c.push(p("Si no se configura Supabase, la app usa datos inventados guardados en el navegador, con las mismas reglas de permisos. No tiene datos personales reales y sirve para enseñar cómo funciona y para las pruebas."));

  c.push(h1("7. Evidencias"));
  c.push(p("Esto es lo que imprime `npm run db:verificar`: entra con cada rol usando la misma llave pública que usa la app, e intenta hacer cosas permitidas y cosas prohibidas."));
  c.push(codigo(verif));
  c.push(...nota("La base de datos está conectada a la app por una capa intermedia, con consultas que no se repiten de más, y con la seguridad puesta en el servidor: inicio de sesión, permisos por rol, validación en dos lugares, bitácora y un plan de respaldo.", "Conclusión"));

  await guardar("04-Informe-de-gestion-de-datos.docx", {
    titulo: "Informe de la gestión de datos",
    subtitulo: "Base de datos, integración, eficiencia y seguridad",
    descripcion: "Aquí explico la base de datos de Campus+: el modelo y el diccionario de datos, cómo se conecta con la app, la seguridad, la integridad y el respaldo."
  }, c);
}
