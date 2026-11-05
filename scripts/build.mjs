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
import { readFileSync, writeFileSync } from "node:fs";
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
  "src/app/place-panel.jsx",
  "src/app/editor-toolbar.jsx",
  "src/app/placement-bar.jsx",
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
  const css = ["src/styles/app.css", "src/styles/page.css", "src/styles/editor.css"].map(read).join("\n");
  if (dev) return css;
  const { code } = await esbuild.transform(css, { loader: "css", minify: true, legalComments: "none" });
  return code;
}

const [script, styles] = await Promise.all([buildScript(), buildStyles()]);
const licenses = read("src/recovered/LICENSES.txt");
const artifact = process.argv.includes("--artifact");
const html = read(artifact ? "src/artifact.template.html" : "src/index.template.html")
  .replace("/*__STYLES__*/", () => styles.replaceAll("</style", "<\\/style"))
  .replace("/*__SCRIPT__*/", () => `${script.replaceAll("</script", "<\\/script")}\n${licenses}`);
writeFileSync(outPath(out), html);
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} KB${dev ? ", dev" : ""})`);
