/** Genera los documentos Word de la entrega. Uso: node docs/generador/generar.mjs [1 2 3 4 5 6] */
const cuales = process.argv.slice(2);
const docs = {
  1: () => import("./doc1-requerimientos.mjs"),
  2: () => import("./doc2-diseno.mjs"),
  3: () => import("./doc3-codigo.mjs"),
  4: () => import("./doc4-datos.mjs"),
  5: () => import("./doc5-pruebas.mjs"),
  6: () => import("./doc6-despliegue.mjs")
};
for (const [n, cargar] of Object.entries(docs)) {
  if (cuales.length && !cuales.includes(n)) continue;
  await (await cargar()).generar();
}
