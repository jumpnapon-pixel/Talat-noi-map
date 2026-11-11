// Builds the single-file Talat Noi map (index.html) from src/.
//
// The recovered bundle (src/recovered/*.js) and the readable app code (src/app/*.jsx)
// share ONE function scope: they are concatenated inside a single IIFE, so the app code
// can use the recovered components by their original (minified) names. The aliases in
// src/app/internals.js give those names readable equivalents.
//
//   node scripts/build.mjs            build index.html (minified)
//   node scripts/build.mjs --dev      build without minification (readable stack traces)
//   node scripts/build.mjs --artifact --out=<file>
//                                     page body for publishing as a claude.ai artifact (the
//                                     platform adds the document skeleton around it)
//   node scripts/build.mjs --standalone --out=<file>
//                                     one self-contained file to share: every image and data
//                                     file it uses is embedded, so it opens from disk or any
//                                     host (read-only visitor map; see embedFiles below)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const dev = process.argv.includes("--dev");
const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? "index.html";
const outPath = (file) => (file.startsWith("/") ? file : join(root, file));

// Order matters only for code that runs at load time (the entry file runs last).
const APP_FILES = [
  "src/app/internals.js",
  "src/app/geo.js",
  "src/app/store.js",
  "src/app/history.js",
  "src/app/fields.jsx",
  "src/vendor/qrcode-generator.js",
  "src/app/guide.jsx",
  "src/app/place-panel.jsx",
  "src/app/place-card.jsx",
  "src/app/share.jsx",
  "src/app/editor-toolbar.jsx",
  "src/app/App.jsx",
  "src/app/entry.js",
];

async function buildScript() {
  const seed = JSON.stringify(JSON.parse(read("src/data/published-seed.json")));
  const recovered = ["src/recovered/01-libraries-and-scene.js", "src/recovered/02-app-components.js"]
    .map(read)
    .join("\n")
    .replace("__TALAT_NOI_SEED_EDITION__", () => seed);

  const appParts = [];
  for (const file of APP_FILES) {
    const source = read(file);
    const { code } = await esbuild.transform(source, {
      loader: file.endsWith(".jsx") ? "jsx" : "js",
      jsx: "transform",
      jsxFactory: "h",
      jsxFragment: "Fragment",
      target: "es2020",
      sourcefile: file,
    });
    appParts.push(`// ---- ${file}\n${code}`);
  }

  const program = `"use strict";\n(() => {\n${recovered}\n${appParts.join("\n")}\n})();\n`;
  if (dev) return program;
  const { code } = await esbuild.transform(program, {
    minify: true,
    target: "es2020",
    legalComments: "none",
  });
  return code;
}

async function buildStyles() {
  const css = ["src/styles/app.css", "src/styles/page.css", "src/styles/editor.css", "src/styles/guide.css"].map(read).join("\n");
  if (dev) return css;
  const { code } = await esbuild.transform(css, { loader: "css", minify: true, legalComments: "none" });
  return code;
}

// Standalone build: the page refers to its images and data by relative paths
// ("assets/…", "data/…?v=…"). Each file is embedded once as base64. Quoted paths in the
// script become __tnFile("…") calls, which turn the embedded bytes into a blob: URL on first
// use (fetch, <img> and links all accept those). The one CSS url() becomes a data: URL.
const FILE_PATH = /(?:assets|data)\/[A-Za-z0-9_.\/-]+\.(?:webp|jpg|jpeg|png|json)/;
const MIME = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", json: "application/json" };
const mimeOf = (path) => MIME[path.split(".").pop().toLowerCase()];

function embedFiles(script, styles) {
  const used = new Set();
  const styled = styles.replace(new RegExp(`url\\((${FILE_PATH.source})\\)`, "g"), (_, path) => {
    const data = readFileSync(join(root, path)).toString("base64");
    return `url(data:${mimeOf(path)};base64,${data})`;
  });
  const scripted = script.replace(new RegExp(`"(${FILE_PATH.source})(?:\\?[^"]*)?"`, "g"), (_, path) => {
    used.add(path);
    return `__tnFile(${JSON.stringify(path)})`;
  });
  const files = Object.fromEntries(
    [...used].sort().map((path) => [path, [mimeOf(path), readFileSync(join(root, path)).toString("base64")]]),
  );
  const loader = `(()=>{const f=${JSON.stringify(files)},u={};window.__tnFile=p=>{if(u[p])return u[p];const e=f[p];if(!e)return p;const b=atob(e[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return u[p]=URL.createObjectURL(new Blob([a],{type:e[0]}))}})();`;
  return { script: `${loader}\n${scripted}`, styles: styled, count: used.size };
}

let [script, styles] = await Promise.all([buildScript(), buildStyles()]);
const standalone = process.argv.includes("--standalone");
if (standalone) {
  const embedded = embedFiles(script, styles);
  ({ script, styles } = embedded);
  console.log(`Embedded ${embedded.count} files`);
}
const licenses = read("src/recovered/LICENSES.txt");
const artifact = process.argv.includes("--artifact");
const html = read(artifact ? "src/artifact.template.html" : "src/index.template.html")
  .replace("/*__STYLES__*/", () => styles.replaceAll("</style", "<\\/style"))
  .replace("/*__SCRIPT__*/", () => `${script.replaceAll("</script", "<\\/script")}\n${licenses}`);
mkdirSync(dirname(outPath(out)), { recursive: true });
writeFileSync(outPath(out), html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} KB${dev ? ", dev" : ""})`);
