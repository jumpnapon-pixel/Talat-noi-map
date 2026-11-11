// Writes the printable launch QR for SHARE_URL (src/app/share.jsx), using the same QR encoder
// as the in-app Share map, then decodes the PNG to check it.
//
//   node scripts/make-qr.mjs            -> dist/launch-qr/talat-noi-map-qr.png and .svg
//
// Change SHARE_URL in src/app/share.jsx first; the in-app button, copy link and this QR
// then all use the same link.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");
const jsQRModule = require("jsqr");
const jsQR = jsQRModule.default ?? jsQRModule;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = readFileSync(join(root, "src/app/share.jsx"), "utf8").match(/const SHARE_URL = "([^"]+)"/)[1];
const readable = url.replace(/^https:\/\//, "").replace(/#.*$/, "");

const sandbox = {};
vm.runInNewContext(`${readFileSync(join(root, "src/vendor/qrcode-generator.js"), "utf8")}\nthis.qrcode = qrcode;`, sandbox);
const qr = sandbox.qrcode(0, "M");
qr.addData(url);
qr.make();
const count = qr.getModuleCount();
const quiet = 4; // white margin, in modules
const size = count + quiet * 2;

// PNG: black on white, about 1,200 px.
const scale = Math.ceil(1200 / size);
const png = new PNG({ width: size * scale, height: size * scale });
for (let y = 0; y < png.height; y++)
  for (let x = 0; x < png.width; x++) {
    const row = Math.floor(y / scale) - quiet;
    const col = Math.floor(x / scale) - quiet;
    const dark = row >= 0 && col >= 0 && row < count && col < count && qr.isDark(row, col);
    const i = (y * png.width + x) * 4;
    png.data[i] = png.data[i + 1] = png.data[i + 2] = dark ? 0 : 255;
    png.data[i + 3] = 255;
  }

// SVG: the same code with the readable link underneath as a fallback.
let path = "";
for (let row = 0; row < count; row++)
  for (let col = 0; col < count; col++) if (qr.isDark(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
const textBand = 6;
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size + textBand}" width="${size * 20}" height="${(size + textBand) * 20}" shape-rendering="crispEdges">
  <title>Talat Noi Story Map: ${readable}</title>
  <rect width="${size}" height="${size + textBand}" fill="#fff"/>
  <path d="${path}" fill="#000"/>
  <text x="${size / 2}" y="${size + 2.6}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="1.75" fill="#000" shape-rendering="geometricPrecision">${readable}</text>
</svg>
`;

const out = join(root, "dist/launch-qr");
mkdirSync(out, { recursive: true });
const pngFile = join(out, "talat-noi-map-qr.png");
writeFileSync(pngFile, PNG.sync.write(png));
writeFileSync(join(out, "talat-noi-map-qr.svg"), svg);

const check = PNG.sync.read(readFileSync(pngFile));
const decoded = jsQR(new Uint8ClampedArray(check.data), check.width, check.height)?.data;
if (decoded !== url) throw new Error(`QR check failed: decoded ${decoded}`);
console.log(`Wrote ${pngFile} (${png.width} px) and the SVG; decodes to ${decoded}`);
