// Genera los íconos PNG de la PWA a partir de public/favicon.svg
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const svg = await readFile(new URL("../public/favicon.svg", import.meta.url));
const out = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

await sharp(svg).resize(192, 192).png().toFile(out("pwa-192.png"));
await sharp(svg).resize(512, 512).png().toFile(out("pwa-512.png"));
await sharp(svg).resize(180, 180).flatten({ background: "#00492C" }).png().toFile(out("apple-touch-icon.png"));

// Maskable: ícono cuadrado sin esquinas redondeadas y con zona segura
const maskable = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#00492C"/>
  <g transform="translate(76.8 76.8) scale(0.7)">${svg.toString().replace(/<svg[^>]*>|<\/svg>/g, "").replace(/<rect width="512" height="512" rx="112" fill="#00492C"\/>/, "")}</g></svg>`
);
await sharp(maskable).resize(512, 512).png().toFile(out("pwa-maskable-512.png"));
console.log("Íconos generados en public/");
