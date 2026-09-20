/** Genera los diagramas de la documentación (SVG → PNG) en docs/img/diagramas. */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../img/diagramas/", import.meta.url));
const C = { verde: "#1E9E4A", verdeO: "#0B5124", verdeC: "#EAF5EC", oro: "#CAA600", oroC: "#FBF3D4", tinta: "#1C1C1A", gris: "#6B6B68", linea: "#9A9A96", azul: "#2F6FB0", azulC: "#E6EFF8", rojo: "#9D2020", rojoC: "#F8E6E6", blanco: "#FFFFFF" };
const F = "Arial, Helvetica, sans-serif";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function texto(x, y, s, { size = 15, peso = 400, color = C.tinta, anchor = "middle", italic = false } = {}) {
  return `<text x="${x}" y="${y}" font-family="${F}" font-size="${size}" font-weight="${peso}" fill="${color}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ""}>${esc(s)}</text>`;
}

/** Caja con título y líneas opcionales. */
function caja(x, y, w, h, titulo, lineas = [], { fill = C.blanco, stroke = C.verde, tc = C.tinta, r = 10, size = 16, ls = 13.5, align = "middle", dash = false } = {}) {
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

function flecha(x1, y1, x2, y2, { label = "", color = C.linea, dash = false, lx, ly, lsize = 13 } = {}) {
  let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.8" marker-end="url(#fl)"${dash ? ' stroke-dasharray="6 4"' : ""}/>`;
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
  </defs>
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  ${titulo ? texto(w / 2, 34, titulo, { size: 21, peso: 700, color: C.verdeO }) : ""}
  ${cuerpo}
</svg>`;
}

function actor(x, y, nombre, color = C.verdeO) {
  return `<g stroke="${color}" stroke-width="2.2" fill="none">
    <circle cx="${x}" cy="${y}" r="13"/><line x1="${x}" y1="${y + 13}" x2="${x}" y2="${y + 48}"/>
    <line x1="${x - 22}" y1="${y + 26}" x2="${x + 22}" y2="${y + 26}"/>
    <line x1="${x}" y1="${y + 48}" x2="${x - 18}" y2="${y + 76}"/><line x1="${x}" y1="${y + 48}" x2="${x + 18}" y2="${y + 76}"/></g>
    ${texto(x, y + 98, nombre, { size: 16, peso: 700, color })}`;
}

function uc(cx, cy, t, w = 300) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="25" fill="${C.verdeC}" stroke="${C.verde}" stroke-width="1.5"/>${texto(cx, cy + 5, t, { size: 15 })}`;
}

const diagramas = {};

// 1. Casos de uso
{
  let b = `<rect x="250" y="70" width="400" height="480" rx="14" fill="none" stroke="${C.verdeO}" stroke-width="1.6"/>`;
  b += texto(450, 98, "Campus+", { size: 17, peso: 700, color: C.verdeO });
  const usos = [
    [130, "Iniciar y cerrar sesión"],
    [195, "Ver mis actividades"],
    [260, "Cambiar el estado"],
    [325, "Registrar actividad"],
    [390, "Editar o eliminar"],
    [455, "Ver el avance del grupo"],
    [520, "Ver a mis tutorados"]
  ];
  for (const [y, t] of usos) b += uc(450, y, t, 340);

  b += actor(110, 165, "Estudiante");
  b += actor(110, 370, "Profesor");
  b += actor(790, 390, "Tutor");

  const linea = (x1, y1, x2, y2, dash = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.linea}" stroke-width="1.3"${dash ? ' stroke-dasharray="4 4"' : ""}/>`;
  b += linea(132, 191, 280, 195);
  b += linea(132, 191, 280, 260);
  b += linea(132, 191, 280, 140, true);
  b += linea(132, 396, 280, 325);
  b += linea(132, 396, 280, 390);
  b += linea(132, 396, 280, 455);
  b += linea(132, 396, 285, 152, true);
  b += linea(768, 416, 620, 520);
  b += linea(768, 416, 618, 145, true);
  b += texto(450, 585, "La línea punteada es «iniciar sesión»: la usan los tres.", { size: 14, color: C.gris });
  diagramas["casos-de-uso"] = svg(900, 610, b, "Casos de uso");
}

// 2. Arquitectura del sistema
{
  let b = "";
  b += caja(320, 70, 260, 80, "Vercel", ["Aquí se publica la app"], { stroke: C.azul, fill: C.azulC });
  b += caja(60, 240, 260, 120, "Teléfono o tableta", ["La app Campus+", "(React, se puede instalar)"]);
  b += caja(580, 230, 280, 140, "Supabase (nube)", ["Inicio de sesión", "Base de datos PostgreSQL", "con las reglas de permisos"], { stroke: C.verdeO, fill: C.verdeC });
  b += flecha(400, 150, 210, 240, { label: "descarga la app", lx: 250, ly: 190 });
  b += flecha(320, 300, 580, 300, { label: "pide y guarda datos (HTTPS)", lx: 450, ly: 288 });
  b += texto(450, 420, "La app revisa los datos antes de mandarlos y la base de datos vuelve a revisar", { size: 14, color: C.gris });
  b += texto(450, 442, "que la persona tenga permiso, por si alguien intenta entrar por otro lado.", { size: 14, color: C.gris });
  diagramas["arquitectura-sistema"] = svg(900, 470, b, "Cómo se conectan las partes");
}

// 3. Arquitectura por capas
{
  let b = "";
  const X = 210, W = 380;
  const capas = [
    ["Pantallas", "Lo que ve y toca el usuario", C.verdeC, C.verde],
    ["Reglas del negocio", "Validaciones y permisos por rol", C.oroC, C.oro],
    ["Repositorio", "Contrato para leer y guardar datos", C.azulC, C.azul]
  ];
  capas.forEach(([t, desc, fill, stroke], i) => {
    const y = 75 + i * 110;
    b += caja(X, y, W, 80, t, [desc], { fill, stroke });
    if (i < capas.length - 1) b += flecha(X + W / 2, y + 80, X + W / 2, y + 110);
  });
  b += caja(120, 410, 250, 80, "SupabaseRepo", ["La base de datos real"], { stroke: C.verdeO });
  b += caja(430, 410, 250, 80, "MemoriaRepo", ["Datos de ejemplo"], { stroke: C.gris, dash: true });
  b += camino("M400 375 C 400 395, 320 392, 245 406");
  b += camino("M400 375 C 400 395, 480 392, 555 406");
  b += texto(400, 535, "Cada capa solo usa la de abajo. Los dos de hasta abajo son intercambiables:", { size: 14, color: C.gris });
  b += texto(400, 557, "uno guarda en la nube y el otro en el navegador, pero se usan igual.", { size: 14, color: C.gris });
  diagramas["arquitectura-capas"] = svg(800, 585, b, "La aplicación por capas");
}

// 4. Modelo entidad-relación
{
  function tablaEr(x, y, w, nombre, filas, color = C.verde) {
    const h = 36 + filas.length * 26 + 8;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${color}" stroke-width="1.6"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="36" rx="8" fill="${color}"/><rect x="${x}" y="${y + 22}" width="${w}" height="14" fill="${color}"/>`;
    s += texto(x + w / 2, y + 25, nombre, { size: 16, peso: 700, color: "#fff" });
    filas.forEach(([k, n], i) => {
      const fy = y + 60 + i * 26;
      s += texto(x + 12, fy, k, { size: 12, peso: 700, color: k === "PK" ? C.oro : C.azul, anchor: "start" });
      s += texto(x + 48, fy, n, { size: 14.5, color: C.tinta, anchor: "start" });
    });
    return s;
  }
  let b = "";
  b += tablaEr(50, 90, 250, "profiles (usuarios)", [["PK", "id"], ["", "nombre"], ["", "rol"], ["", "matricula"], ["FK", "tutor_id"]]);
  b += tablaEr(420, 90, 250, "actividades", [["PK", "id"], ["", "titulo"], ["", "fecha / hora"], ["", "materia"], ["FK", "profesor_id"]]);
  b += tablaEr(420, 340, 250, "asignaciones", [["PK", "actividad_id"], ["PK", "estudiante_id"], ["", "estado"]]);
  b += tablaEr(760, 90, 210, "bitacora", [["PK", "id"], ["", "tabla"], ["", "usuario_id"], ["", "fecha"]], C.oro);

  b += camino("M300 165 L420 165") + texto(360, 155, "1 : N", { size: 13, color: C.gris, peso: 700 });
  b += camino("M175 274 C 175 380, 300 400, 420 400") + texto(250, 395, "1 : N", { size: 13, color: C.gris, peso: 700 });
  b += camino("M545 274 L545 340") + texto(575, 312, "1 : N", { size: 13, color: C.gris, peso: 700 });
  b += camino("M670 150 L760 150") + texto(715, 138, "audita", { size: 13, color: C.gris, peso: 700 });

  b += texto(500, 500, "Una actividad puede ser para varios estudiantes y un estudiante tiene varias actividades.", { size: 14, color: C.gris });
  b += texto(500, 522, "Esa relación y el avance de cada quien se guardan en «asignaciones».", { size: 14, color: C.gris });
  diagramas["modelo-er"] = svg(1010, 550, b, "Modelo entidad-relación");
}

// 5. Mapa de navegación
{
  let b = "";
  const P = (x, y, t, s = []) => caja(x, y, 230, 62, t, s, { size: 15, ls: 12.5 });
  b += caja(335, 65, 230, 62, "Iniciar sesión", [], { size: 16, fill: C.verdeC });
  const cols = [
    [50, "Estudiante", ["Inicio", "Mis actividades", "Detalle y cambiar estado"]],
    [335, "Profesor", ["Inicio", "Actividades", "Registrar / editar / borrar"]],
    [620, "Tutor", ["Inicio", "Tutorados", "Detalle del tutorado"]]
  ];
  cols.forEach(([x, rol, pantallas]) => {
    b += texto(x + 115, 168, rol, { size: 16, peso: 700, color: C.verdeO });
    pantallas.forEach((t, i) => {
      const y = 185 + i * 100;
      b += P(x, y, t);
      if (i < pantallas.length - 1) b += flecha(x + 115, y + 62, x + 115, y + 100);
    });
  });
  b += flecha(400, 127, 175, 182);
  b += flecha(450, 127, 450, 182);
  b += flecha(500, 127, 725, 182);
  b += texto(450, 520, "Cada quien entra solo a las pantallas de su rol. «Cerrar sesión» regresa al inicio.", { size: 14, color: C.gris });
  diagramas["mapa-navegacion"] = svg(900, 550, b, "Mapa de navegación");
}

// 6. Secuencia: registrar actividad
{
  const cols = [["Profesor", 110], ["Pantalla", 320], ["Repositorio", 530], ["Base de datos", 740]];
  let b = "";
  for (const [n, x] of cols) {
    b += caja(x - 85, 65, 170, 46, n, [], { size: 15, fill: C.verdeC });
    b += `<line x1="${x}" y1="111" x2="${x}" y2="415" stroke="${C.linea}" stroke-width="1.2" stroke-dasharray="5 5"/>`;
  }
  const m = (y, a, c, t, o = {}) => flecha(cols[a][1], y, cols[c][1] + (c > a ? -2 : 2), y, { label: t, lsize: 13, ly: y - 7, ...o });
  b += m(150, 0, 1, "llena el formulario");
  b += texto(320, 185, "(revisa nombre y fecha)", { size: 13, color: C.gris, italic: true });
  b += m(220, 1, 2, "guardar actividad");
  b += m(270, 2, 3, "la guarda de una sola vez");
  b += m(320, 3, 2, "listo", { dash: true });
  b += m(365, 2, 1, "actualiza la lista", { dash: true });
  b += m(405, 1, 0, "«Actividad registrada»", { dash: true });
  b += texto(430, 450, "Si algo falla no se guarda nada y la pantalla avisa cuál fue el problema.", { size: 14, color: C.gris });
  diagramas["secuencia-registrar"] = svg(860, 475, b, "Registrar una actividad, paso a paso");
}

// 7. Estados de una asignación
{
  let b = "";
  const E = (x, t, fill, stroke) => `<rect x="${x}" y="115" width="190" height="70" rx="35" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` + texto(x + 95, 157, t, { size: 18, peso: 700 });
  b += `<circle cx="55" cy="150" r="12" fill="${C.tinta}"/>`;
  b += flecha(67, 150, 108, 150);
  b += E(110, "Pendiente", C.oroC, C.oro);
  b += E(400, "En proceso", C.blanco, C.verde);
  b += E(690, "Terminada", C.verdeC, C.verdeO);
  b += camino("M300 135 C 340 105, 360 105, 400 135") + texto(350, 97, "empieza", { size: 14, color: C.gris });
  b += camino("M400 170 C 360 200, 340 200, 300 170") + texto(350, 220, "regresa", { size: 14, color: C.gris });
  b += camino("M590 135 C 630 105, 650 105, 690 135") + texto(640, 97, "termina", { size: 14, color: C.gris });
  b += camino("M690 170 C 650 200, 630 200, 590 170") + texto(640, 220, "la reabre", { size: 14, color: C.gris });
  b += texto(450, 280, "Solo el estudiante al que se le asignó puede cambiar su propio estado.", { size: 14, color: C.gris });
  diagramas["estados-asignacion"] = svg(900, 305, b, "Estados de una actividad asignada");
}

// 8. Flujo Git y CI/CD
{
  let b = "";
  b += texto(60, 115, "main", { size: 15, peso: 700, color: C.verdeO, anchor: "start" });
  b += texto(60, 205, "rama nueva", { size: 15, peso: 700, color: C.azul, anchor: "start" });
  b += `<line x1="170" y1="110" x2="840" y2="110" stroke="${C.verde}" stroke-width="4"/>`;
  b += `<path d="M300 110 C 330 110, 330 200, 360 200 L 580 200 C 610 200, 610 110, 640 110" fill="none" stroke="${C.azul}" stroke-width="4"/>`;
  const n = (x, y, c) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${c}" stroke-width="3"/>`;
  b += n(230, 110, C.verde) + texto(230, 88, "primera versión", { size: 13, color: C.gris });
  b += n(420, 200, C.azul) + texto(420, 232, "voy programando", { size: 13, color: C.azul });
  b += n(520, 200, C.azul) + texto(520, 252, "y probando", { size: 13, color: C.azul });
  b += n(640, 110, C.verde) + texto(650, 88, "se une a main (merge)", { size: 13, color: C.gris });
  b += n(800, 110, C.verde) + texto(800, 88, "v1.0.0", { size: 13, color: C.gris });

  const etapas = [["Subo el cambio", "git push"], ["GitHub lo compila", "npm run build"], ["Corre las pruebas", "solas, sin que yo esté"], ["Vercel publica", "la nueva versión"]];
  etapas.forEach(([t, s], i) => {
    const x = 55 + i * 230;
    b += caja(x, 320, 190, 72, t, [s], { size: 15, fill: i === 3 ? C.azulC : C.verdeC, stroke: i === 3 ? C.azul : C.verde });
    if (i < etapas.length - 1) b += flecha(x + 190, 356, x + 230, 356);
  });
  b += texto(470, 300, "Lo que pasa en cada cambio", { size: 16, peso: 700, color: C.verdeO });
  b += texto(470, 430, "A main solo llega código que compila y que pasa todas las pruebas.", { size: 14, color: C.gris });
  diagramas["git-cicd"] = svg(940, 455, b, "Ramas de Git y publicación automática");
}

// 9. Pirámide de pruebas
{
  let b = "";
  const niveles = [
    ["Pruebas E2E", "28 casos en teléfono y tableta", C.azulC, C.azul],
    ["Interfaz y base de datos", "41 pruebas", C.verdeC, C.verde],
    ["Pruebas unitarias", "44 pruebas de reglas y permisos", C.oroC, C.oro]
  ];
  niveles.forEach(([t, s, fill, stroke], i) => {
    const y = 75 + i * 95, mitad = 110 + i * 100;
    b += `<polygon points="${400 - mitad},${y + 88} ${400 + mitad},${y + 88} ${400 + mitad - 50},${y} ${400 - mitad + 50},${y}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`;
    b += texto(400, y + 42, t, { size: 16, peso: 700 });
    b += texto(400, y + 65, s, { size: 13.5, color: C.gris });
  });
  b += texto(400, 400, "Abajo van muchas pruebas chicas y rápidas; arriba, pocas pero más parecidas al uso real.", { size: 14, color: C.gris });
  diagramas["piramide-pruebas"] = svg(800, 425, b, "Cómo probé la aplicación");
}

for (const [nombre, contenido] of Object.entries(diagramas)) {
  writeFileSync(OUT + nombre + ".svg", contenido);
  await sharp(Buffer.from(contenido), { density: 192 }).png().toFile(OUT + nombre + ".png");
}
console.log("Diagramas:", Object.keys(diagramas).join(", "));
