/** Genera los diagramas de la documentación (SVG → PNG) en docs/img/diagramas. */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../img/diagramas/", import.meta.url));
const C = { verde: "#1E9E4A", verdeO: "#0B5124", verdeC: "#EAF5EC", oro: "#CAA600", oroC: "#FBF3D4", tinta: "#1C1C1A", gris: "#6B6B68", linea: "#9A9A96", azul: "#2F6FB0", azulC: "#E6EFF8", rojo: "#9D2020", rojoC: "#F8E6E6", blanco: "#FFFFFF" };
const F = "Arial, Helvetica, sans-serif";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function texto(x, y, s, { size = 14, peso = 400, color = C.tinta, anchor = "middle", italic = false } = {}) {
  return `<text x="${x}" y="${y}" font-family="${F}" font-size="${size}" font-weight="${peso}" fill="${color}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ""}>${esc(s)}</text>`;
}

/** Caja con título y líneas opcionales. */
function caja(x, y, w, h, titulo, lineas = [], { fill = C.blanco, stroke = C.verde, tc = C.tinta, r = 10, size = 15, ls = 12.5, align = "middle", dash = false } = {}) {
  const tx = align === "middle" ? x + w / 2 : x + 14;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"${dash ? ' stroke-dasharray="6 4"' : ""}/>`;
  const alto = size + 6 + lineas.length * (ls + 5);
  let cy = y + (h - alto) / 2 + size;
  if (titulo) {
    s += texto(tx, cy, titulo, { size, peso: 700, color: tc, anchor: align === "middle" ? "middle" : "start" });
    cy += 8;
  }
  for (const l of lineas) {
    cy += ls + 5;
    s += texto(tx, cy, l, { size: ls, color: C.gris, anchor: align === "middle" ? "middle" : "start" });
  }
  return s;
}

function flecha(x1, y1, x2, y2, { label = "", color = C.linea, dash = false, doble = false, lx, ly, lsize = 12 } = {}) {
  let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.8" marker-end="url(#fl)"${doble ? ' marker-start="url(#fli)"' : ""}${dash ? ' stroke-dasharray="6 4"' : ""}/>`;
  if (label) {
    const mx = lx ?? (x1 + x2) / 2, my = ly ?? (y1 + y2) / 2 - 6;
    const w = label.length * lsize * 0.56 + 10;
    s += `<rect x="${mx - w / 2}" y="${my - lsize}" width="${w}" height="${lsize + 6}" rx="4" fill="${C.blanco}" opacity="0.92"/>`;
    s += texto(mx, my, label, { size: lsize, color: C.gris });
  }
  return s;
}

function camino(d, { color = C.linea, dash = false } = {}) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" marker-end="url(#fl)"${dash ? ' stroke-dasharray="6 4"' : ""}/>`;
}

function svg(w, h, cuerpo, titulo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.linea}"/></marker>
    <marker id="fli" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.linea}"/></marker>
  </defs>
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  ${titulo ? texto(w / 2, 34, titulo, { size: 20, peso: 700, color: C.verdeO }) : ""}
  ${cuerpo}
</svg>`;
}

function actor(x, y, nombre, color = C.verdeO) {
  return `<g stroke="${color}" stroke-width="2.2" fill="none">
    <circle cx="${x}" cy="${y}" r="13"/><line x1="${x}" y1="${y + 13}" x2="${x}" y2="${y + 48}"/>
    <line x1="${x - 22}" y1="${y + 26}" x2="${x + 22}" y2="${y + 26}"/>
    <line x1="${x}" y1="${y + 48}" x2="${x - 18}" y2="${y + 76}"/><line x1="${x}" y1="${y + 48}" x2="${x + 18}" y2="${y + 76}"/></g>
    ${texto(x, y + 98, nombre, { size: 15, peso: 700, color })}`;
}

function uc(cx, cy, t, w = 230) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="24" fill="${C.verdeC}" stroke="${C.verde}" stroke-width="1.5"/>${texto(cx, cy + 5, t, { size: 13 })}`;
}

const diagramas = {};

// 1. Casos de uso
{
  let b = `<rect x="200" y="60" width="700" height="630" rx="14" fill="none" stroke="${C.verdeO}" stroke-width="1.6"/>`;
  b += texto(550, 88, "Sistema Campus+", { size: 16, peso: 700, color: C.verdeO });
  const est = [["CU-01 Iniciar / cerrar sesión", 130], ["CU-02 Consultar próximas actividades", 190], ["CU-03 Consultar y filtrar mis actividades", 250], ["CU-04 Ver detalle de actividad", 310], ["CU-05 Cambiar estado de actividad", 370]];
  const prof = [["CU-06 Registrar actividad", 450], ["CU-07 Editar actividad", 510], ["CU-08 Eliminar actividad", 570], ["CU-09 Consultar avance por estudiante", 630]];
  const tut = [["CU-10 Consultar tutorados", 470], ["CU-11 Consultar actividades del tutorado", 560]];
  for (const [t, y] of est) b += uc(400, y, t, 290);
  for (const [t, y] of prof) b += uc(400, y, t, 290);
  for (const [t, y] of tut) b += uc(725, y, t, 300);
  b += actor(90, 210, "Estudiante");
  b += actor(90, 520, "Profesor");
  b += actor(1000, 480, "Tutor");
  for (const [, y] of est) b += `<line x1="112" y1="240" x2="255" y2="${y}" stroke="${C.linea}" stroke-width="1.3"/>`;
  for (const [, y] of prof) b += `<line x1="112" y1="550" x2="255" y2="${y}" stroke="${C.linea}" stroke-width="1.3"/>`;
  b += `<path d="M108 530 C 170 420, 200 160, 255 135" fill="none" stroke="${C.linea}" stroke-width="1.3" stroke-dasharray="4 4"/>`;
  for (const [, y] of tut) b += `<line x1="978" y1="510" x2="875" y2="${y}" stroke="${C.linea}" stroke-width="1.3"/>`;
  b += `<path d="M1000 470 C 990 250, 760 140, 545 130" fill="none" stroke="${C.linea}" stroke-width="1.3" stroke-dasharray="4 4"/>`;
  b += texto(550, 720, "Todos los actores usan CU-01 (línea punteada). La autorización de cada caso se valida en el dominio y en la base de datos (RLS).", { size: 12.5, color: C.gris });
  diagramas["casos-de-uso"] = svg(1100, 740, b, "Diagrama de casos de uso");
}

// 2. Arquitectura del sistema (despliegue)
{
  let b = "";
  b += caja(40, 90, 250, 400, "", [], { fill: C.verdeC, stroke: C.verde, r: 16 });
  b += texto(165, 120, "Dispositivo del usuario", { size: 15, peso: 700, color: C.verdeO });
  b += texto(165, 140, "Teléfono / tablet / navegador", { size: 12, color: C.gris });
  b += caja(65, 160, 200, 120, "PWA Campus+", ["React 19 + TypeScript", "Enrutador y pantallas", "Reglas de dominio"]);
  b += caja(65, 340, 200, 120, "Service Worker", ["Workbox: caché de la", "aplicación (sin conexión)", "e instalación"], { stroke: C.oro });

  b += caja(410, 320, 230, 140, "Vercel (CDN)", ["Hospeda los archivos", "estáticos compilados", "HTTPS, CSP, HSTS", "Reescritura de rutas SPA"], { stroke: C.azul, fill: C.azulC });
  b += caja(410, 540, 230, 130, "GitHub", ["Repositorio y ramas", "GitHub Actions (CI):", "auditoría, compilación", "y 108 pruebas"], { stroke: C.gris });

  b += caja(750, 90, 300, 420, "", [], { fill: "#F4F7F4", stroke: C.verdeO, r: 16 });
  b += texto(900, 120, "Supabase (nube)", { size: 15, peso: 700, color: C.verdeO });
  b += caja(775, 140, 250, 80, "Auth (GoTrue)", ["Correo + contraseña, JWT"]);
  b += caja(775, 235, 250, 80, "API REST (PostgREST)", ["Consultas y RPC con el JWT"]);
  b += caja(775, 330, 250, 160, "PostgreSQL 15", ["Tablas: profiles, actividades,", "asignaciones, bitacora", "RLS por rol + privilegios", "Función guardar_actividad", "Triggers de auditoría"], { stroke: C.verdeO });
  b += flecha(900, 220, 900, 235);
  b += flecha(900, 315, 900, 330);

  b += flecha(265, 190, 775, 180, { label: "HTTPS: inicio de sesión (correo + contraseña → JWT)", lx: 520, ly: 175 });
  b += flecha(265, 250, 775, 275, { label: "HTTPS + JWT: consultas y cambios", lx: 520, ly: 255 });
  b += flecha(410, 390, 265, 390, { label: "descarga la app", lx: 338, ly: 378 });
  b += flecha(525, 540, 525, 460, { label: "despliegue automático", lx: 525, ly: 505 });
  b += texto(545, 710, "Cliente ligero (SPA/PWA) + Backend como Servicio (BaaS): la lógica de negocio se valida en el cliente", { size: 12.5, color: C.gris });
  b += texto(545, 730, "y se hace cumplir en el servidor mediante RLS, restricciones y funciones de PostgreSQL.", { size: 12.5, color: C.gris });
  diagramas["arquitectura-sistema"] = svg(1090, 750, b, "Arquitectura del sistema (cliente–servidor en la nube)");
}

// 3. Arquitectura por capas
{
  let b = "";
  const X = 170, W = 560;
  const capas = [
    ["Presentación", "src/screens, src/components", "Pantallas por rol, formularios, diálogos, estados de carga/error", C.verdeC, C.verde],
    ["Aplicación", "src/app (contexto, rutas)", "Sesión, rutas protegidas por rol, useConsulta / mutar, avisos", C.verdeC, C.verde],
    ["Dominio", "src/domain (tipos, reglas)", "Entidades, validación RN-01…RN-07, matriz de permisos (sin dependencias)", C.oroC, C.oro],
    ["Puerto de datos", "src/data/repositorio.ts", "Interfaz Repositorio: contrato único para leer y escribir", C.azulC, C.azul]
  ];
  capas.forEach(([t, ruta, desc, fill, stroke], i) => {
    const y = 70 + i * 105;
    b += caja(X, y, W, 80, `${t}  ·  ${ruta}`, [desc], { fill, stroke });
    if (i < capas.length - 1) b += flecha(X + W / 2, y + 80, X + W / 2, y + 105);
  });
  b += caja(X, 510, 270, 90, "SupabaseRepo", ["Producción: PostgreSQL + Auth", "Traduce errores a mensajes"], { stroke: C.verdeO });
  b += caja(X + 290, 510, 270, 90, "MemoriaRepo", ["Modo demostración / pruebas", "Mismas reglas de permisos"], { stroke: C.gris, dash: true });
  b += flecha(X + 200, 465, X + 135, 510);
  b += flecha(X + 360, 465, X + 425, 510);
  b += texto(X + 280, 495, "implementan", { size: 12, color: C.gris });
  b += texto(450, 640, "Patrones: arquitectura en capas, Repositorio (puertos y adaptadores), inyección de dependencias por contexto.", { size: 12.5, color: C.gris });
  diagramas["arquitectura-capas"] = svg(900, 665, b, "Arquitectura lógica por capas");
}

// 4. Modelo entidad-relación
{
  function tabla(x, y, w, nombre, filas, color = C.verde) {
    const h = 34 + filas.length * 24 + 8;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${color}" stroke-width="1.6"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="34" rx="8" fill="${color}"/><rect x="${x}" y="${y + 20}" width="${w}" height="14" fill="${color}"/>`;
    s += texto(x + w / 2, y + 23, nombre, { size: 15, peso: 700, color: "#fff" });
    filas.forEach(([k, n, t], i) => {
      const fy = y + 56 + i * 24;
      s += texto(x + 12, fy, k, { size: 11, peso: 700, color: k === "PK" ? C.oro : C.azul, anchor: "start" });
      s += texto(x + 44, fy, n, { size: 13, color: C.tinta, anchor: "start" });
      s += texto(x + w - 12, fy, t, { size: 11.5, color: C.gris, anchor: "end" });
    });
    return s;
  }
  let b = "";
  b += tabla(40, 80, 250, "auth.users", [["PK", "id", "uuid"], ["", "email", "text"], ["", "encrypted_password", "bcrypt"]], C.gris);
  b += tabla(40, 250, 300, "profiles", [["PK", "id", "uuid → auth.users"], ["", "nombre", "text(2..120)"], ["", "rol", "enum rol"], ["", "matricula", "text único"], ["", "programa", "text"], ["FK", "tutor_id", "uuid → profiles"], ["", "created_at", "timestamptz"]]);
  b += tabla(440, 80, 310, "actividades", [["PK", "id", "bigint identity"], ["", "titulo", "text(1..120)"], ["", "descripcion", "text(≤2000)"], ["", "materia", "text(1..80)"], ["", "fecha", "date"], ["", "hora", "time"], ["", "para_grupo", "boolean"], ["FK", "profesor_id", "uuid → profiles"], ["", "created_at / updated_at", "timestamptz"]]);
  b += tabla(440, 400, 310, "asignaciones", [["PK", "actividad_id", "bigint → actividades"], ["PK", "estudiante_id", "uuid → profiles"], ["", "estado", "enum estado"], ["", "actualizado", "timestamptz"]]);
  b += tabla(820, 80, 250, "bitacora", [["PK", "id", "bigint identity"], ["", "tabla / operacion", "text"], ["", "registro", "text"], ["", "usuario_id", "uuid"], ["", "fecha", "timestamptz"], ["", "antes / despues", "jsonb"]], C.oro);

  const rel = (d, l, lx, ly) => camino(d) + (l ? texto(lx, ly, l, { size: 12, color: C.gris, peso: 700 }) : "");
  b += rel("M165 194 L165 250", "1 : 1", 185, 228);
  b += rel("M340 330 L440 250", "", 0, 0) + texto(322, 236, "1 : N (profesor)", { size: 12, color: C.gris, peso: 700, anchor: "start" });
  b += rel("M340 440 L440 470", "", 0, 0) + texto(250, 492, "1 : N (estudiante)", { size: 12, color: C.gris, peso: 700, anchor: "start" });
  b += rel("M595 336 L595 400", "1 : N", 620, 375);
  b += `<path d="M40 330 C 0 330, 0 420, 40 420" fill="none" stroke="${C.linea}" stroke-width="1.8" marker-end="url(#fl)"/>`;
  b += texto(18, 380, "tutor", { size: 12, color: C.gris, peso: 700 });
  b += rel("M750 180 L820 180", "", 0, 0);
  b += texto(785, 170, "audita", { size: 12, color: C.gris, peso: 700 });

  b += caja(820, 330, 250, 190, "Tipos (ENUM)", ["rol: estudiante | profesor | tutor", "estado: Pendiente |", "En proceso | Terminada", "", "Relación N:M actividades–", "estudiantes resuelta con", "la tabla asignaciones"], { align: "start", stroke: C.oro, fill: C.oroC, size: 14, ls: 12 });
  diagramas["modelo-er"] = svg(1110, 560, b, "Modelo entidad-relación (PostgreSQL)");
}

// 5. Mapa de navegación
{
  let b = "";
  const P = (x, y, t, s = [], o = {}) => caja(x, y, 190, 62, t, s, { size: 13.5, ls: 11.5, ...o });
  b += P(405, 60, "01 Inicio / Iniciar sesión", ["Selección de perfil (demo)"], { fill: C.verdeC });
  b += P(40, 185, "02 Inicio estudiante", ["Próximas + conteos"]);
  b += P(40, 290, "03 Mis actividades", ["Filtros por estado"]);
  b += P(40, 395, "04 Detalle de actividad", ["Cambiar estado"]);
  b += P(405, 185, "05 Inicio profesor", ["Próximas + Registrar"]);
  b += P(405, 290, "06 Actividades", ["Filtros, Editar, Eliminar"]);
  b += P(295, 395, "07 Nueva actividad", ["Formulario validado"]);
  b += P(515, 395, "08 Editar actividad", ["Formulario precargado"]);
  b += P(295, 500, "09 Confirmar eliminación", ["Diálogo modal"], { stroke: C.rojo });
  b += P(515, 500, "Detalle + avance", ["Estado por estudiante"]);
  b += P(770, 185, "10 Inicio tutor", ["Lista de tutorados"]);
  b += P(770, 290, "11 Tutorados", ["Matrícula y programa"]);
  b += P(770, 395, "12 Info. del tutorado", ["Actividades y estados"]);
  b += flecha(450, 122, 135, 185, { label: "rol estudiante", lx: 280, ly: 150 });
  b += flecha(500, 122, 500, 185, { label: "rol profesor", lx: 500, ly: 150 });
  b += flecha(550, 122, 865, 185, { label: "rol tutor", lx: 720, ly: 150 });
  b += flecha(135, 247, 135, 290); b += flecha(135, 352, 135, 395);
  b += flecha(500, 247, 500, 290); b += flecha(460, 352, 390, 395); b += flecha(540, 352, 610, 395);
  b += camino("M405 321 L265 321 L265 531 L293 531", { dash: true }); b += camino("M595 321 L740 321 L740 531 L707 531");
  b += flecha(865, 247, 865, 290); b += flecha(865, 352, 865, 395);
  b += `<path d="M40 216 C 10 300, 10 380, 40 426" fill="none" stroke="${C.linea}" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#fl)"/>`;
  b += texto(500, 610, "Barra inferior: Inicio · Actividades/Tutorados · (+) Registrar.  «Cerrar sesión» regresa a 01 desde cualquier pantalla.", { size: 12.5, color: C.gris });
  b += texto(500, 630, "Las rutas están protegidas: un usuario solo accede a las pantallas de su rol.", { size: 12.5, color: C.gris });
  diagramas["mapa-navegacion"] = svg(1000, 650, b, "Mapa de navegación (12 pantallas)");
}

// 6. Secuencia: registrar actividad
{
  const cols = [["Profesor", 80], ["Pantalla (Formulario)", 250], ["Dominio (reglas)", 420], ["SupabaseRepo", 590], ["PostgreSQL (RLS)", 770], ["Bitácora", 930]];
  let b = "";
  for (const [n, x] of cols) {
    b += caja(x - 75, 60, 150, 44, n, [], { size: 13, fill: C.verdeC });
    b += `<line x1="${x}" y1="104" x2="${x}" y2="690" stroke="${C.linea}" stroke-width="1.2" stroke-dasharray="5 5"/>`;
  }
  const m = (y, a, c, t, o = {}) => flecha(cols[a][1], y, cols[c][1] + (c > a ? -2 : 2), y, { label: t, lsize: 11.5, ly: y - 6, ...o });
  b += m(140, 0, 1, "llena nombre, fecha, destinatario");
  b += m(180, 1, 2, "validarActividad(datos)");
  b += m(215, 2, 1, "errores = {} (válido)", { dash: true });
  b += m(255, 1, 3, "guardarActividad(usuario, datos)");
  b += m(295, 3, 2, "exigir(rol = profesor)");
  b += m(330, 2, 3, "permitido", { dash: true });
  b += m(370, 3, 4, "rpc guardar_actividad (JWT)");
  b += `<rect x="700" y="390" width="140" height="150" rx="6" fill="${C.oroC}" stroke="${C.oro}"/>`;
  b += texto(770, 410, "transacción", { size: 11.5, peso: 700, color: C.gris });
  b += texto(770, 432, "mi_rol() = profesor", { size: 11 });
  b += texto(770, 452, "INSERT actividades", { size: 11 });
  b += texto(770, 472, "CHECK / RLS", { size: 11 });
  b += texto(770, 492, "INSERT asignaciones", { size: 11 });
  b += texto(770, 512, "(1 o todo el grupo)", { size: 11 });
  b += m(565, 4, 5, "trigger: INSERT");
  b += m(600, 4, 3, "id de la actividad", { dash: true });
  b += m(635, 3, 1, "ok → mutar() refresca", { dash: true });
  b += m(670, 1, 0, "«Actividad registrada» + lista", { dash: true });
  b += texto(520, 715, "Si cualquier paso falla (permiso, CHECK, red) se revierte la transacción y la UI muestra un mensaje traducido.", { size: 12.5, color: C.gris });
  diagramas["secuencia-registrar"] = svg(1010, 735, b, "Diagrama de secuencia · Registrar actividad (CU-06)");
}

// 7. Estados de una asignación
{
  let b = "";
  const E = (x, t, fill, stroke) => `<rect x="${x}" y="140" width="190" height="70" rx="35" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` + texto(x + 95, 181, t, { size: 17, peso: 700 });
  b += `<circle cx="60" cy="175" r="12" fill="${C.tinta}"/>`;
  b += flecha(72, 175, 118, 175, { label: "asignar", ly: 160 });
  b += E(120, "Pendiente", C.oroC, C.oro);
  b += E(420, "En proceso", C.blanco, C.verde);
  b += E(720, "Terminada", C.verdeC, C.verdeO);
  b += camino("M310 160 C 350 130, 380 130, 420 160"); b += texto(365, 122, "estudiante inicia", { size: 12, color: C.gris });
  b += camino("M420 195 C 380 225, 350 225, 310 195"); b += texto(365, 240, "regresa", { size: 12, color: C.gris });
  b += camino("M610 160 C 650 130, 680 130, 720 160"); b += texto(665, 122, "estudiante termina", { size: 12, color: C.gris });
  b += camino("M720 195 C 680 225, 650 225, 610 195"); b += texto(665, 240, "reabre", { size: 12, color: C.gris });
  b += camino("M215 210 C 300 320, 740 320, 815 212"); b += texto(515, 324, "termina directamente", { size: 12, color: C.gris });
  b += camino("M815 140 C 740 40, 300 40, 215 138"); b += texto(515, 52, "reinicia", { size: 12, color: C.gris });
  b += texto(470, 350, "Solo el estudiante asignado cambia su estado (RLS + privilegio de columna «estado»).", { size: 12.5, color: C.gris });
  b += texto(470, 370, "El profesor ve el estado global: todas Terminada → Terminada · todas Pendiente → Pendiente · otro caso → En proceso (RN-07).", { size: 12.5, color: C.gris });
  diagramas["estados-asignacion"] = svg(960, 395, b, "Diagrama de estados · Asignación de actividad");
}

// 8. Flujo Git y CI/CD
{
  let b = "";
  b += texto(40, 110, "main", { size: 14, peso: 700, color: C.verdeO, anchor: "start" });
  b += texto(40, 205, "feature/", { size: 13, peso: 700, color: C.azul, anchor: "start" });
  b += texto(40, 222, "base-de-datos", { size: 13, peso: 700, color: C.azul, anchor: "start" });
  b += texto(40, 285, "feature/pruebas-", { size: 13, peso: 700, color: C.oro, anchor: "start" });
  b += texto(40, 302, "y-documentacion", { size: 13, peso: 700, color: C.oro, anchor: "start" });
  b += `<line x1="160" y1="105" x2="1230" y2="105" stroke="${C.verde}" stroke-width="4"/>`;
  b += `<path d="M300 105 C 330 105, 330 205, 360 205 L 800 205 C 830 205, 830 105, 860 105" fill="none" stroke="${C.azul}" stroke-width="4"/>`;
  b += `<path d="M880 105 C 910 105, 910 290, 940 290 L 1120 290 C 1150 290, 1150 105, 1180 105" fill="none" stroke="${C.oro}" stroke-width="4"/>`;
  const n = (x, y, c) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${c}" stroke-width="3"/>`;
  b += n(190, 105, C.verde) + texto(190, 85, "ea662cd", { size: 11, color: C.gris }) + texto(190, 135, "prototipo PWA v1", { size: 11, color: C.verdeO });
  b += n(270, 105, C.verde) + texto(270, 85, "b64ba2e", { size: 11, color: C.gris }) + texto(270, 150, "normalizar EOL", { size: 11, color: C.verdeO });
  const feats = [["4ad00c7", "esquema BD + RLS"], ["e4aa616", "dominio"], ["c8a8960", "repositorio"], ["7ae1dd0", "UI + sesión"], ["7829568", "seed / verificación"], ["af18634", "pruebas E2E"], ["2a4d088", "seguridad + CI"]];
  feats.forEach(([h, l], i) => {
    const x = 385 + i * 65, abajo = i % 2 === 0;
    b += n(x, 205, C.azul) + texto(x, abajo ? 235 : 185, h, { size: 10.5, color: C.gris }) + texto(x, abajo ? 250 : 170, l, { size: 10.5, color: C.azul });
  });
  b += n(860, 105, C.verde) + texto(860, 85, "40a496c merge", { size: 11, color: C.gris });
  const docs = [["1271325", "prueba intermitente"], ["cb62a61", "accesibilidad AA"], ["docs", "documentación"]];
  docs.forEach(([h, l], i) => {
    const x = 965 + i * 70;
    b += n(x, 290, C.oro) + texto(x, 320, h, { size: 10.5, color: C.gris }) + texto(x, i % 2 ? 350 : 335, l, { size: 10.5, color: C.oro });
  });
  b += n(1180, 105, C.verde) + texto(1180, 85, "merge v1.0", { size: 11, color: C.gris });

  const etapas = [["Commit / push", "Conventional Commits"], ["GitHub Actions", "npm ci + npm audit"], ["Compilación", "tsc + vite build"], ["Pruebas", "unitarias, BD, UI, E2E"], ["Vercel", "despliegue automático"]];
  etapas.forEach(([t, s], i) => {
    const x = 90 + i * 225;
    b += caja(x, 420, 190, 70, t, [s], { size: 14, fill: i === 4 ? C.azulC : C.verdeC, stroke: i === 4 ? C.azul : C.verde });
    if (i < etapas.length - 1) b += flecha(x + 190, 455, x + 225, 455);
  });
  b += texto(635, 400, "Integración y entrega continua (CI/CD)", { size: 15, peso: 700, color: C.verdeO });
  b += texto(635, 525, "Cada cambio se integra por rama con merge --no-ff; main solo recibe código que compila y pasa las pruebas.", { size: 12.5, color: C.gris });
  diagramas["git-cicd"] = svg(1270, 550, b, "Control de versiones (Git) y canal de CI/CD");
}

// 9. Pirámide de pruebas
{
  let b = "";
  const niveles = [
    ["E2E (Playwright + axe-core)", "28 casos · teléfono y tablet · WCAG AA", 470, C.azulC, C.azul],
    ["Integración UI (Testing Library)", "17 flujos: login y los 3 roles", 400, C.verdeC, C.verde],
    ["Integración con Supabase real", "5 pruebas + 23 verificaciones RLS", 330, C.verdeC, C.verde],
    ["Base de datos (PostgreSQL/PGlite)", "19 pruebas: integridad, RLS, auditoría", 260, C.oroC, C.oro],
    ["Unitarias (Vitest)", "44 pruebas: reglas, repositorio, despliegue", 190, C.oroC, C.oro]
  ];
  niveles.forEach(([t, s, , fill, stroke], i) => {
    const y = 70 + i * 78, mitad = 90 + i * 70;
    b += `<polygon points="${500 - mitad},${y + 72} ${500 + mitad},${y + 72} ${500 + mitad - 35},${y} ${500 - mitad + 35},${y}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`;
    b += texto(500, y + 32, t, { size: 14, peso: 700 });
    b += texto(500, y + 52, s, { size: 12, color: C.gris });
  });
  b += texto(500, 490, "Más rápidas y numerosas en la base; más realistas (y lentas) en la cima.", { size: 12.5, color: C.gris });
  diagramas["piramide-pruebas"] = svg(1000, 510, b, "Estrategia de pruebas");
}

for (const [nombre, contenido] of Object.entries(diagramas)) {
  writeFileSync(OUT + nombre + ".svg", contenido);
  await sharp(Buffer.from(contenido), { density: 192 }).png().toFile(OUT + nombre + ".png");
}
console.log("Diagramas:", Object.keys(diagramas).join(", "));
