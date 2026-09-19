import { readFileSync } from "node:fs";
import { codigo, figura, guardar, h1, h2, h3, nota, numerada, p, RAIZ, reiniciarContadores, tabla, tituloTabla, vinetas } from "./comun.mjs";

export async function generar() {
  reiniciarContadores();
  const lat = JSON.parse(readFileSync(RAIZ + "reportes/latencia-supabase.json", "utf8"));
  const verif = readFileSync(RAIZ + "reportes/verificacion-supabase.txt", "utf8").trim();
  const c = [];

  c.push(h1("1. Resumen"));
  c.push(p("Campus+ integra una base de datos **PostgreSQL 15** administrada por **Supabase**. La aplicación accede a ella a través de una capa de repositorio; la seguridad se aplica en el propio servidor con **Row Level Security (RLS)**, privilegios por columna y funciones; la integridad, con restricciones y una función transaccional; y la trazabilidad, con una bitácora de auditoría alimentada por triggers."));
  c.push(tituloTabla("Resumen de la gestión de datos"));
  c.push(tabla(["Aspecto", "Solución", "Evidencia"], [
    ["Almacenamiento", "PostgreSQL 15 en Supabase (nube)", "Migración versionada 0001_esquema.sql"],
    ["Integración", "Patrón repositorio + cliente Supabase (API REST y RPC)", "5 pruebas de integración contra la base real"],
    ["Eficiencia", "Una petición por pantalla, índices y operaciones en una transacción", `Mediana de ${lat.resultados[0].mediana} ms por consulta (${lat.repeticiones} repeticiones)`],
    ["Seguridad", "Autenticación, RLS, privilegios por columna, secretos fuera del código", "19 pruebas de BD + 23 verificaciones en la nube"],
    ["Integridad", "PK, FK, CHECK, ENUM, UNIQUE, NOT NULL y transacciones", "Pruebas de integridad"],
    ["Auditoría", "Bitácora con triggers (quién, qué, cuándo, antes y después)", "Prueba «registra quién crea, modifica y elimina»"]
  ], [18, 44, 38]));

  c.push(h1("2. Selección de la tecnología"));
  c.push(tituloTabla("Comparación de alternativas de base de datos"));
  c.push(tabla(["Criterio", "PostgreSQL (Supabase)", "Firebase Firestore", "MySQL con API propia"], [
    ["Modelo", "Relacional con integridad referencial", "Documentos (NoSQL)", "Relacional"],
    ["Seguridad por fila", "RLS nativa en SQL", "Reglas propias de Firebase", "Hay que programarla en la API"],
    ["Autenticación", "Incluida (Supabase Auth)", "Incluida", "Hay que construirla"],
    ["Transacciones ACID", "Sí", "Limitadas", "Sí"],
    ["Servidor que mantener", "No", "No", "Sí"],
    ["Costo en V1", "Gratuito", "Gratuito", "Hospedaje de servidor"]
  ], [22, 26, 26, 26]));
  c.push(p("Se eligió PostgreSQL en Supabase porque los datos son relacionales (actividades, estudiantes, asignaciones), se requiere integridad referencial y porque la RLS permite aplicar la seguridad directamente en la base de datos, sin depender de que el cliente se comporte correctamente."));

  c.push(h1("3. Modelo de datos"));
  c.push(h2("3.1 Modelo entidad-relación"));
  c.push(...(await figura("diagramas/modelo-er.png", "Modelo entidad-relación de Campus+.", 620)));
  c.push(h2("3.2 Normalización"));
  c.push(p("El esquema está en **tercera forma normal (3FN)**:"));
  c.push(...vinetas([
    "**1FN:** todos los atributos son atómicos; no hay listas dentro de una columna (los destinatarios de una actividad no se guardan como lista, sino como filas en `asignaciones`).",
    "**2FN:** en `asignaciones`, cuya llave es compuesta (actividad_id, estudiante_id), el único atributo no clave (`estado`) depende de la llave completa.",
    "**3FN:** no hay dependencias transitivas: el nombre del profesor no se copia en `actividades`, se obtiene por la llave foránea `profesor_id`."
  ]));
  c.push(p("La decisión de diseño más importante fue mover el `estado` de la actividad a la asignación. En el prototipo había un solo estado por actividad; con él, si un estudiante marcaba como terminada una actividad del grupo, se marcaba para todos. La tabla `asignaciones` resuelve la relación muchos a muchos y guarda el avance de cada estudiante."));
  c.push(h2("3.3 Diccionario de datos"));
  const dic = (t, filas) => [tituloTabla(t), tabla(["Columna", "Tipo", "Restricciones", "Descripción"], filas, [18, 16, 34, 32], { tam: 16 })];
  c.push(...dic("Tabla profiles (perfil de cada usuario)", [
    ["id", "uuid", "PK · FK → auth.users ON DELETE CASCADE", "Identificador del usuario autenticado."],
    ["nombre", "text", "NOT NULL · 2 a 120 caracteres", "Nombre para mostrar."],
    ["rol", "enum rol", "NOT NULL · estudiante | profesor | tutor", "Define los permisos."],
    ["matricula", "text", "UNIQUE · 5 a 10 dígitos", "Solo estudiantes."],
    ["programa", "text", "≤ 120 caracteres", "Programa académico (estudiantes)."],
    ["tutor_id", "uuid", "FK → profiles ON DELETE SET NULL", "Tutor asignado (estudiantes)."],
    ["created_at", "timestamptz", "NOT NULL · default now()", "Fecha de alta."],
    ["(restricción)", "CHECK", "datos_de_estudiante", "Solo un estudiante puede tener matrícula y tutor."]
  ]));
  c.push(...dic("Tabla actividades", [
    ["id", "bigint", "PK · identity", "Identificador."],
    ["titulo", "text", "NOT NULL · 1 a 120 caracteres (sin espacios extremos)", "Nombre de la actividad (RN-01)."],
    ["descripcion", "text", "NOT NULL · default '' · ≤ 2000", "Instrucciones (RN-03)."],
    ["materia", "text", "NOT NULL · default 'General' · 1 a 80", "Materia o categoría."],
    ["fecha", "date", "NOT NULL", "Fecha de entrega (RN-02)."],
    ["hora", "time", "Opcional", "Hora de entrega."],
    ["para_grupo", "boolean", "NOT NULL · default false", "Si se asignó al grupo completo."],
    ["profesor_id", "uuid", "NOT NULL · default auth.uid() · FK → profiles", "Autor de la actividad."],
    ["created_at / updated_at", "timestamptz", "NOT NULL · trigger actualiza updated_at", "Fechas de control."]
  ]));
  c.push(...dic("Tabla asignaciones", [
    ["actividad_id", "bigint", "PK · FK → actividades ON DELETE CASCADE", "Actividad asignada."],
    ["estudiante_id", "uuid", "PK · FK → profiles ON DELETE CASCADE", "Estudiante destinatario."],
    ["estado", "enum estado", "NOT NULL · default 'Pendiente'", "Avance del estudiante (RN-07)."],
    ["actualizado", "timestamptz", "NOT NULL · trigger al modificar", "Último cambio de estado."]
  ]));
  c.push(...dic("Tabla bitacora (auditoría)", [
    ["id", "bigint", "PK · identity", "Identificador del evento."],
    ["tabla / operacion", "text", "NOT NULL", "Tabla afectada e INSERT, UPDATE o DELETE."],
    ["registro", "text", "NOT NULL", "Llave del registro afectado."],
    ["usuario_id", "uuid", "default auth.uid()", "Usuario que hizo el cambio."],
    ["fecha", "timestamptz", "NOT NULL · default now()", "Momento del cambio."],
    ["antes / despues", "jsonb", "—", "Copia del registro antes y después del cambio."]
  ]));
  c.push(h2("3.4 Índices"));
  c.push(tituloTabla("Índices y consultas que optimizan"));
  c.push(tabla(["Índice", "Columnas", "Consulta que acelera"], [
    ["actividades_profesor_fecha_idx", "profesor_id, fecha", "Lista de actividades del profesor ordenada por fecha."],
    ["asignaciones_estudiante_idx", "estudiante_id", "Actividades de un estudiante (estudiante y tutor)."],
    ["profiles_tutor_idx", "tutor_id", "Tutorados de un tutor."],
    ["profiles_rol_idx", "rol", "Lista de estudiantes para asignar actividades."],
    ["Llaves primarias y UNIQUE", "id, (actividad_id, estudiante_id), matricula", "Búsquedas por identificador y verificación de duplicados."]
  ], [34, 30, 36]));

  c.push(h1("4. Integración con la aplicación"));
  c.push(h2("4.1 Arquitectura de acceso a datos"));
  c.push(p("La aplicación nunca llama a la base de datos directamente desde las pantallas. Todas las operaciones pasan por la interfaz `Repositorio`, implementada por `SupabaseRepo` (producción) y `MemoriaRepo` (modo demostración y pruebas). Esto aísla la tecnología de datos y permite probar la interfaz sin red."));
  c.push(...(await figura("diagramas/arquitectura-capas.png", "Capas de la aplicación y adaptadores de datos.", 460)));
  c.push(tituloTabla("Operaciones del repositorio y su implementación en Supabase"));
  c.push(tabla(["Operación", "Rol", "Implementación en Supabase"], [
    ["iniciarSesion / sesionActual / cerrarSesion", "Todos", "Supabase Auth (JWT) + lectura del perfil"],
    ["misActividades", "Estudiante", "SELECT asignaciones con JOIN a actividades y al profesor (1 petición)"],
    ["cambiarEstado", "Estudiante", "UPDATE asignaciones SET estado (RLS: solo su fila; solo columna estado)"],
    ["actividadesProfesor", "Profesor", "SELECT actividades con sus asignaciones y nombres (1 petición)"],
    ["estudiantes", "Profesor", "SELECT profiles WHERE rol = 'estudiante'"],
    ["guardarActividad", "Profesor", "RPC guardar_actividad(): crea o edita la actividad y sus asignaciones en una transacción"],
    ["eliminarActividad", "Profesor", "DELETE actividades (CASCADE a asignaciones)"],
    ["tutorados / actividadesDeTutorado", "Tutor", "SELECT profiles WHERE tutor_id = yo; SELECT asignaciones del tutorado"]
  ], [30, 14, 56]));
  c.push(h2("4.2 Operación transaccional"));
  c.push(p("Registrar o editar una actividad modifica dos tablas. Para que nunca quede una actividad sin destinatarios (o destinatarios de una actividad inexistente), se implementó la función `guardar_actividad()`: se ejecuta en una sola transacción y, si algo falla, se revierte todo. Además conserva el avance de los estudiantes que siguen asignados (RN-08)."));
  c.push(codigo(`create function public.guardar_actividad(p_id bigint, p_titulo text, p_descripcion text,
  p_materia text, p_fecha date, p_hora time, p_estudiante uuid) returns bigint
language plpgsql security invoker set search_path = public as $$
begin
  if public.mi_rol() is distinct from 'profesor' then
    raise exception 'Solo un profesor puede registrar actividades' using errcode = '42501';
  end if;
  -- INSERT o UPDATE de la actividad (la RLS verifica que sea del profesor)
  -- DELETE de los destinatarios retirados · INSERT de los nuevos (on conflict do nothing)
  ...
end $$;`));
  c.push(h2("4.3 Manejo de errores"));
  c.push(p("Los errores de PostgreSQL se traducen a mensajes comprensibles antes de mostrarse, sin exponer detalles internos:"));
  c.push(tituloTabla("Traducción de errores de la base de datos"));
  c.push(tabla(["Código", "Causa", "Mensaje al usuario"], [
    ["42501", "Permiso denegado (RLS o privilegios)", "No tienes permiso para realizar esta acción."],
    ["P0002 / PGRST116", "Registro inexistente", "El registro no existe o fue eliminado."],
    ["23514 / 22023 / 22007", "Violación de CHECK o dato inválido", "Los datos no son válidos."],
    ["Error de red", "Sin conexión", "Sin conexión con el servidor. Revisa tu internet."],
    ["Credenciales", "Correo o contraseña incorrectos", "Correo o contraseña incorrectos (no se indica cuál)."]
  ], [22, 36, 42]));
  c.push(h2("4.4 Eficiencia"));
  c.push(...vinetas([
    "**Una petición por pantalla:** las relaciones se resuelven en el servidor (actividad + profesor + asignaciones + nombres) en lugar de hacer una consulta por registro, lo que evita el problema de «N + 1» consultas.",
    "**Índices** en las columnas por las que se filtra (sección 3.4).",
    "**Transacción en el servidor** para guardar: una sola petición en lugar de varias.",
    "**Solo se vuelve a consultar lo necesario:** después de cada escritura se refrescan las consultas activas de la pantalla.",
    "**Caché de la aplicación:** el service worker guarda los archivos de la app, así que solo viajan datos por la red.",
    "**Conexiones administradas:** Supabase usa un pool de conexiones (Supavisor) para atender muchos clientes."
  ]));
  c.push(tituloTabla(`Latencia medida contra Supabase (${lat.repeticiones} repeticiones por consulta)`));
  c.push(tabla(["Consulta", "Mediana (ms)", "Percentil 95 (ms)", "Mínimo (ms)"], lat.resultados.map((r) => [r.consulta, r.mediana, r.p95, r.min]), [55, 15, 15, 15]));
  c.push(p("Los tiempos incluyen el viaje de red desde el cliente hasta el centro de datos; el procesamiento en la base de datos es una fracción de ellos. Se obtienen con `npm run db:medir`."));

  c.push(h1("5. Seguridad de los datos"));
  c.push(h2("5.1 Autenticación"));
  c.push(...vinetas([
    "Supabase Auth guarda las contraseñas con **bcrypt** (nunca en texto plano) y emite un **JWT** firmado que expira y se renueva automáticamente.",
    "No hay autorregistro: las cuentas y roles los crea el administrador (evita que alguien se asigne el rol de profesor).",
    "Ante un intento fallido el mensaje no revela si el correo existe."
  ]));
  c.push(h2("5.2 Autorización con RLS"));
  c.push(p("Todas las tablas tienen RLS habilitada. Cada consulta se ejecuta con la identidad del usuario (`auth.uid()` del JWT) y PostgreSQL filtra las filas según las políticas, aunque alguien intente usar la API directamente sin la interfaz."));
  c.push(tituloTabla("Políticas de seguridad por fila"));
  c.push(tabla(["Tabla", "Operación", "Quién puede"], [
    ["profiles", "SELECT", "Su propio perfil; nombres de profesores; el profesor ve estudiantes; el tutor ve a sus tutorados"],
    ["profiles", "INSERT/UPDATE/DELETE", "Nadie desde la aplicación (solo el administrador)"],
    ["actividades", "SELECT", "El profesor autor; los estudiantes asignados; los tutores de esos estudiantes"],
    ["actividades", "INSERT", "Solo usuarios con rol profesor y como autores"],
    ["actividades", "UPDATE / DELETE", "Solo el profesor autor"],
    ["asignaciones", "SELECT", "El estudiante asignado, su tutor y el profesor de la actividad"],
    ["asignaciones", "INSERT / DELETE", "Solo el profesor autor de la actividad"],
    ["asignaciones", "UPDATE", "Solo el estudiante asignado y solo la columna estado"],
    ["bitacora", "Todas", "Nadie desde la aplicación (solo administradores)"]
  ], [18, 22, 60]));
  c.push(codigo(`-- Solo el estudiante dueño cambia su estado
create policy asignaciones_estado on public.asignaciones for update to authenticated
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());

-- Privilegios por columna: el estudiante solo puede tocar "estado"
revoke update on public.actividades, public.asignaciones from authenticated;
grant update (estado) on public.asignaciones to authenticated;
grant update (titulo, descripcion, materia, fecha, hora, para_grupo) on public.actividades to authenticated;`));
  c.push(h2("5.3 Otras medidas"));
  c.push(tituloTabla("Controles de seguridad de datos"));
  c.push(tabla(["Amenaza", "Control"], [
    ["Acceso sin sesión", "Se revocan todos los privilegios al rol anónimo (anon)."],
    ["Escalamiento de privilegios", "Los perfiles no se pueden editar; profesor_id no se puede cambiar (privilegio por columna)."],
    ["Recursión o abuso en políticas", "Funciones auxiliares SECURITY DEFINER con search_path fijo (mi_rol, es_mi_tutorado…)."],
    ["Inyección SQL", "Consultas parametrizadas (PostgREST y funciones con parámetros tipados); probado con cadena maliciosa."],
    ["XSS", "React escapa el contenido; CSP sin 'unsafe-inline'; probado con etiqueta <img onerror>."],
    ["Intercepción", "HTTPS/TLS obligatorio (HSTS) hacia Vercel y Supabase."],
    ["Fuga de llaves", "La llave pública (anon) es la única en el cliente; la de servicio solo en .env.local; historial revisado."],
    ["Datos inválidos", "Validación en tres capas: formulario, dominio y restricciones de la base de datos."],
    ["Repudio", "Bitácora con usuario, fecha y valores antes y después de cada cambio."]
  ], [28, 72]));
  c.push(h2("5.4 Privacidad"));
  c.push(p("Se aplica el principio de **minimización**: solo se guardan nombre, matrícula, programa y correo, necesarios para la operación. Por tratarse de una institución pública, el tratamiento de datos personales debe apegarse a la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados; antes de operar con datos reales se requiere publicar el aviso de privacidad de la institución. Las contraseñas no son visibles ni siquiera para el administrador."));

  c.push(h1("6. Integridad y ciclo de vida"));
  c.push(h2("6.1 Restricciones de integridad"));
  c.push(...vinetas([
    "**Entidad:** llaves primarias en todas las tablas; llave compuesta en asignaciones (un estudiante no puede tener la misma actividad dos veces).",
    "**Referencial:** llaves foráneas con ON DELETE CASCADE (borrar una actividad borra sus asignaciones) y SET NULL (borrar un tutor no borra a sus tutorados).",
    "**Dominio:** ENUM para rol y estado; CHECK de longitudes y formato de matrícula; tipos date y time.",
    "**Negocio:** CHECK «datos_de_estudiante»; la función guardar_actividad valida que el destinatario sea estudiante."
  ]));
  c.push(h2("6.2 Migraciones y datos iniciales"));
  c.push(...vinetas([
    "El esquema completo está versionado en Git (`supabase/migrations/0001_esquema.sql`); cualquier cambio futuro se agrega como una nueva migración numerada.",
    "`npm run db:seed` crea las cuentas de prueba y las actividades de ejemplo usando la llave de servicio, que solo existe en la computadora del administrador.",
    "Lección aprendida: la migración no es idempotente (ejecutarla dos veces da el error «type rol already exists»). Se documenta que se ejecuta una sola vez por base de datos; las migraciones siguientes deben escribirse con validaciones de existencia."
  ]));
  c.push(h2("6.3 Respaldo y recuperación"));
  c.push(tituloTabla("Plan de respaldo"));
  c.push(tabla(["Elemento", "Estrategia"], [
    ["Esquema", "Versionado en Git: se puede recrear en cualquier momento a partir de la migración."],
    ["Datos (V1, plan gratuito)", "Exportación semanal con pg_dump usando la cadena de conexión de Supabase; el archivo se guarda cifrado fuera del proyecto."],
    ["Datos (producción)", "Plan Pro de Supabase: respaldos diarios automáticos con 7 días de retención y, opcionalmente, recuperación a un punto en el tiempo (PITR)."],
    ["Prueba de recuperación", "Restaurar el respaldo en un proyecto de prueba y ejecutar `npm run db:verificar` para confirmar datos y permisos."],
    ["Objetivos", "RPO (pérdida máxima aceptable): 24 h en producción · RTO (tiempo de recuperación): menos de 2 h."]
  ], [26, 74]));
  c.push(codigo(`pg_dump "postgresql://postgres:<contraseña>@db.<proyecto>.supabase.co:5432/postgres" \\
  --schema=public --format=custom --file=campus-plus-AAAA-MM-DD.dump`));
  c.push(h2("6.4 Modo demostración"));
  c.push(p("Sin configuración de Supabase, la app usa `MemoriaRepo`, que guarda datos ficticios en el almacenamiento local del navegador y aplica las mismas reglas de permisos. No contiene datos personales reales y sirve para capacitación, demostraciones y pruebas automatizadas."));

  c.push(h1("7. Evidencias"));
  c.push(h2("7.1 Verificación de seguridad contra la base de datos real"));
  c.push(p("Salida de `npm run db:verificar`: inicia sesión con cada rol usando solo la llave pública (igual que la aplicación) e intenta operaciones permitidas y prohibidas:"));
  c.push(codigo(verif));
  c.push(h2("7.2 Pruebas automatizadas de la base de datos"));
  c.push(p("Las 19 pruebas de `tests/db/seguridad.test.ts` ejecutan la misma migración sobre PostgreSQL real (PGlite) y verifican integridad, RLS por rol, privilegios por columna, inyección SQL y auditoría. El detalle está en el documento «Resultados de las pruebas»."));
  c.push(...nota("La base de datos está integrada mediante una capa de repositorio con consultas eficientes (una petición por pantalla, índices y transacciones), y se gestiona de forma segura con autenticación, RLS, privilegios por columna, validación en tres capas, auditoría y un plan de respaldo. Todo está verificado con pruebas automatizadas y contra la base de datos real.", "Conclusión"));

  await guardar("04-Informe-de-gestion-de-datos.docx", {
    titulo: "Informe de la gestión de datos",
    subtitulo: "Base de datos, integración, eficiencia y seguridad",
    descripcion: "Describe la base de datos PostgreSQL de Campus+: modelo y diccionario de datos, integración con la aplicación, eficiencia medida, seguridad (autenticación, RLS, privilegios, auditoría), integridad, respaldo y evidencias de verificación."
  }, c);
}
