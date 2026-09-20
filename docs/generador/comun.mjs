/** Utilidades compartidas para generar los documentos .docx de Campus+. */
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, PageBreak, PageNumber,
  Packer, Paragraph, ShadingType, Table, TableCell, TableOfContents, TableRow, TextRun, VerticalAlign, WidthType
} from "docx";
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const RAIZ = fileURLToPath(new URL("../../", import.meta.url));
const IMG = RAIZ + "docs/img/";
const SALIDA = RAIZ + "docs/entregables/";
mkdirSync(SALIDA, { recursive: true });

export const DATOS = {
  proyecto: "Campus+",
  autor: "Jesús E. Gómez Monroy",
  fecha: "19 de septiembre de 2026",
  version: "1.0",
  repo: "https://github.com/JesusGomezMon/campus-plus",
  organizacion: "Universidad Autónoma del Estado de Quintana Roo"
};

const VERDE = "0B5124", VERDE_M = "17833C", VERDE_C = "EAF5EC", GRIS = "5C5C58", ORO_C = "FBF3D4";
const ANCHO = 9360; // 6.5" en DXA (Carta con márgenes de 1")

// ---------- texto con **negritas** y `código` ----------
function runs(texto, base = {}) {
  const partes = String(texto).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return partes.map((p) => {
    if (p.startsWith("**")) return new TextRun({ ...base, text: p.slice(2, -2), bold: true });
    if (p.startsWith("`")) return new TextRun({ ...base, text: p.slice(1, -1), font: "Consolas", size: (base.size ?? 22) - 2, color: VERDE });
    return new TextRun({ ...base, text: p });
  });
}

export const p = (texto, o = {}) =>
  new Paragraph({ children: runs(texto, o.run), spacing: { after: 120, line: 276 }, alignment: o.align ?? AlignmentType.JUSTIFIED, ...o.par });
export const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: true });
export const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
export const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const salto = () => new Paragraph({ children: [new PageBreak()] });

export const vinetas = (items, nivel = 0) =>
  items.map((t) => new Paragraph({ numbering: { reference: "vinetas", level: nivel }, children: runs(t), spacing: { after: 60 } }));
export const numerada = (items, ref = "numeros") =>
  items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60 } }));

/** Recuadro de nota / conclusión. */
export function nota(texto, titulo = "Nota") {
  return [espacio(), new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: [ANCHO],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: ANCHO, type: WidthType.DXA },
            shading: { fill: VERDE_C, type: ShadingType.CLEAR, color: "auto" },
            borders: { top: borde(VERDE_M), bottom: borde(VERDE_M), left: { style: BorderStyle.SINGLE, size: 24, color: VERDE_M }, right: borde(VERDE_M) },
            margins: { top: 100, bottom: 100, left: 180, right: 180 },
            children: [new Paragraph({ children: [new TextRun({ text: titulo, bold: true, color: VERDE })], spacing: { after: 60 } }), ...[].concat(texto).map((t) => p(t, { par: { spacing: { after: 60 } } }))]
          })
        ]
      })
    ]
  }), espacio()];
}

function borde(color = "BFBFBF") {
  return { style: BorderStyle.SINGLE, size: 4, color };
}

/** Tabla con encabezado verde. `anchos` en proporciones (se escalan al ancho útil). */
export function tabla(encabezados, filas, anchos, o = {}) {
  const total = anchos.reduce((a, b) => a + b, 0);
  const cols = anchos.map((a) => Math.floor((a / total) * ANCHO));
  cols[cols.length - 1] += ANCHO - cols.reduce((a, b) => a + b, 0);
  const tam = o.tam ?? 18;
  // Tablas cortas: mantener todas las filas juntas (keepNext en cada párrafo salvo la última fila).
  const juntar = o.juntar ?? filas.length <= 12;
  const celda = (contenido, i, cab, fila) =>
    new TableCell({
      width: { size: cols[i], type: WidthType.DXA },
      shading: cab ? { fill: VERDE_M, type: ShadingType.CLEAR, color: "auto" } : fila % 2 ? { fill: "F6F8F6", type: ShadingType.CLEAR, color: "auto" } : undefined,
      borders: { top: borde(), bottom: borde(), left: borde(), right: borde() },
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      verticalAlign: VerticalAlign.CENTER,
      children: [].concat(contenido).map((c) =>
        c instanceof Paragraph || c instanceof Table
          ? c
          : new Paragraph({ children: runs(String(c), { size: tam, color: cab ? "FFFFFF" : "1C1C1A", bold: cab || undefined }), spacing: { after: 0 }, keepNext: juntar && (cab || fila < filas.length - 1) })
      )
    });
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({ tableHeader: true, children: encabezados.map((e, i) => celda(e, i, true, 0)) }),
      ...filas.map((f, r) => new TableRow({ cantSplit: true, children: f.map((c, i) => celda(c, i, false, r)) }))
    ]
  });
}

export const espacio = () => new Paragraph({ children: [], spacing: { after: 60 } });

// ---------- figuras numeradas ----------
let nFigura = 0, nTabla = 0;
export function reiniciarContadores() {
  nFigura = 0;
  nTabla = 0;
}

async function imagenRun(ruta, anchoPx) {
  const buf = readFileSync(ruta);
  const m = await sharp(buf).metadata();
  const alto = Math.round((anchoPx * m.height) / m.width);
  return new ImageRun({ type: "png", data: buf, transformation: { width: anchoPx, height: alto }, altText: { title: ruta.split(/[\\/]/).pop(), description: ruta.split(/[\\/]/).pop(), name: ruta.split(/[\\/]/).pop() } });
}

/** Figura centrada con pie numerado. */
export async function figura(ruta, pie, anchoPx = 620) {
  nFigura += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [await imagenRun(IMG + ruta, anchoPx)], spacing: { before: 120, after: 60 }, keepNext: true }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Figura ${nFigura}. `, bold: true, size: 18, color: VERDE }), new TextRun({ text: pie, italics: true, size: 18, color: GRIS })], spacing: { after: 200 } })
  ];
}

/** Rejilla de capturas (n columnas) con pie por imagen. */
export async function rejilla(items, columnas = 3, anchoPx = 180) {
  const cols = Array(columnas).fill(Math.floor(ANCHO / columnas));
  const filas = [];
  for (let i = 0; i < items.length; i += columnas) {
    const grupo = items.slice(i, i + columnas);
    const celdas = [];
    for (let c = 0; c < columnas; c++) {
      const it = grupo[c];
      let hijos = [new Paragraph({ children: [] })];
      if (it) {
        nFigura += 1;
        hijos = [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [await imagenRun(IMG + it.ruta, it.ancho ?? anchoPx)], spacing: { after: 40 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Figura ${nFigura}. `, bold: true, size: 16, color: VERDE }), new TextRun({ text: it.pie, size: 16, color: GRIS })], spacing: { after: 0 } })
        ];
      }
      celdas.push(new TableCell({ width: { size: cols[c], type: WidthType.DXA }, borders: sinBordes(), margins: { top: 80, bottom: 120, left: 60, right: 60 }, children: hijos }));
    }
    filas.push(new TableRow({ cantSplit: true, children: celdas }));
  }
  return new Table({ width: { size: ANCHO, type: WidthType.DXA }, columnWidths: cols, rows: filas });
}

function sinBordes() {
  const n = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: n, bottom: n, left: n, right: n };
}

/** Pie de tabla numerado (se coloca antes de la tabla). */
export function tituloTabla(t) {
  nTabla += 1;
  return new Paragraph({ children: [new TextRun({ text: `Tabla ${nTabla}. `, bold: true, size: 18, color: VERDE }), new TextRun({ text: t, italics: true, size: 18, color: GRIS })], spacing: { before: 160, after: 80 }, keepNext: true });
}

/** Bloque de código monoespaciado. */
export function codigo(texto) {
  const lineas = texto.replace(/\t/g, "  ").split("\n");
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: [ANCHO],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: ANCHO, type: WidthType.DXA },
            shading: { fill: "F4F5F4", type: ShadingType.CLEAR, color: "auto" },
            borders: { top: borde("D9D9D5"), bottom: borde("D9D9D5"), left: borde("D9D9D5"), right: borde("D9D9D5") },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: lineas.map((l) => new Paragraph({ children: [new TextRun({ text: l || " ", font: "Consolas", size: 16, color: "1C1C1A" })], spacing: { after: 0, line: 240 } }))
          })
        ]
      })
    ]
  });
}

// ---------- portada y documento ----------
async function portada(titulo, subtitulo, descripcion) {
  const logo = await imagenRun(RAIZ + "public/pwa-512.png", 110);
  const fila = (k, v) =>
    new TableRow({
      children: [
        new TableCell({ width: { size: 2600, type: WidthType.DXA }, borders: sinBordes(), margins: { top: 50, bottom: 50, left: 0, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, color: VERDE, size: 21 })] })] }),
        new TableCell({ width: { size: 6760, type: WidthType.DXA }, borders: sinBordes(), margins: { top: 50, bottom: 50, left: 0, right: 0 }, children: [new Paragraph({ children: [new TextRun({ text: v, size: 21 })] })] })
      ]
    });
  return [
    new Paragraph({ children: [logo], spacing: { before: 600, after: 300 } }),
    new Paragraph({ children: [new TextRun({ text: "CAMPUS", bold: true, size: 30, color: VERDE_M, characterSpacing: 60 }), new TextRun({ text: "+", bold: true, size: 30, color: "CAA600" }), new TextRun({ text: "   ·   Proyecto final · Fase I", size: 22, color: GRIS })], spacing: { after: 240 } }),
    new Paragraph({ children: [new TextRun({ text: titulo, bold: true, size: 56, color: VERDE })], spacing: { after: 160 } }),
    new Paragraph({ children: [new TextRun({ text: subtitulo, size: 28, color: GRIS })], spacing: { after: 480 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: VERDE_M, space: 12 } } }),
    p(descripcion, { run: { size: 22, color: "3D3D3A" } }),
    new Paragraph({ children: [], spacing: { after: 600 } }),
    new Table({
      width: { size: ANCHO, type: WidthType.DXA },
      columnWidths: [2600, 6760],
      rows: [
        fila("Aplicación", "Campus+ · app web para organizar actividades escolares"),
        fila("Autor", DATOS.autor),
        fila("Caso de estudio", DATOS.organizacion),
        fila("Repositorio", DATOS.repo),
        fila("Versión del documento", DATOS.version),
        fila("Fecha", DATOS.fecha)
      ]
    }),
    salto()
  ];
}

function estilos() {
  return {
    default: { document: { run: { font: "Calibri", size: 22, color: "1C1C1A" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, color: VERDE, font: "Calibri" }, paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 27, bold: true, color: VERDE_M, font: "Calibri" }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, color: "3D3D3A", font: "Calibri" }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true } }
    ]
  };
}

/** Inserta un pequeño espacio después de cada tabla para que no quede pegada al siguiente bloque. */
function separarTablas(bloques) {
  const r = [];
  bloques.forEach((b, i) => {
    r.push(b);
    if (b instanceof Table && !(bloques[i + 1] instanceof Paragraph && bloques[i + 1].__vacio)) r.push(espacioTabla());
  });
  return r;
}
const espacioTabla = () => new Paragraph({ children: [], spacing: { after: 100 } });

/** Construye y guarda el documento. */
export async function guardar(archivo, { titulo, subtitulo, descripcion }, cuerpo) {
  const doc = new Document({
    creator: DATOS.autor,
    title: `${DATOS.proyecto} · ${titulo}`,
    description: subtitulo,
    styles: estilos(),
    features: { updateFields: true },
    numbering: {
      config: [
        { reference: "vinetas", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }, { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } }] },
        { reference: "numeros", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
        { reference: "numeros2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
        { reference: "numeros3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] }
      ]
    },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }, titlePage: true },
        headers: {
          default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Campus+ · ${titulo}`, size: 17, color: GRIS })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D5", space: 4 } } })] }),
          first: new Header({ children: [new Paragraph({ children: [] })] })
        },
        footers: {
          default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["Página ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES], size: 17, color: GRIS })] })] }),
          first: new Footer({ children: [new Paragraph({ children: [] })] })
        },
        children: [
          ...(await portada(titulo, subtitulo, descripcion)),
          new Paragraph({ children: [new TextRun({ text: "Contenido", bold: true, size: 34, color: VERDE })], spacing: { after: 200 } }),
          new TableOfContents("Contenido", { hyperlink: true, headingStyleRange: "1-2" }),
          ...separarTablas(cuerpo)
        ]
      }
    ]
  });
  const buf = await Packer.toBuffer(doc);
  writeFileSync(SALIDA + archivo, buf);
  console.log("✔", archivo);
}

export { AlignmentType, Paragraph, TextRun };
