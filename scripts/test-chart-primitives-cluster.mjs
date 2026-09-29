import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; }, Fragment: "Fragment" };
globalThis.__chartPrimitives = { jsx };

async function load(moduleName) {
  const sourcePath = path.join(ROOT, `src/renderer/${moduleName}/index.ts`);
  const source = fs.readFileSync(sourcePath, "utf8");
  const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "chart-primitives-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: dependency === "app-shared" ? "export const $3=()=>{}; export const I3=()=>globalThis.__chartPrimitives.jsx;" : "export {};", loader: "js" })); } }] });
  return { module: await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64")), source };
}

const icon = await load("bar-chart-fill");
assert.deepEqual(Object.keys(icon.module), ["default"]);
assert.equal(typeof icon.module.default, "function");
assert.equal(/\bany\b/.test(icon.source), false);
assert.equal(/import \* as/.test(icon.source), false);
assert.deepEqual([...icon.source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared"]);
let rendered = icon.module.default();
assert.equal(rendered.type, "svg");
assert.equal(rendered.props.width, "1em");
assert.equal(rendered.props.height, "1em");
assert.equal(rendered.props.viewBox, "0 0 20 20");
assert.equal(rendered.props.fill, "currentColor");
assert.equal(rendered.props.children.length, 3);
assert.deepEqual(rendered.props.children.map((child) => child.type), ["path", "path", "path"]);
assert.equal(rendered.props.children[0].props.d.startsWith("M2 9.20001"), true);
assert.equal(rendered.props.children[2].props.d.endsWith("16V4.40001Z"), true);
rendered = icon.module.default({ width: 24, fill: "red", className: "chart", children: "ignored" });
assert.equal(rendered.props.width, 24);
assert.equal(rendered.props.fill, "red");
assert.equal(rendered.props.className, "chart");
assert.equal(rendered.props.children.length, 3);

const palette = await load("chart-colors");
assert.deepEqual(Object.keys(palette.module), ["n", "t"]);
assert.equal(/\bany\b/.test(palette.source), false);
assert.deepEqual([...palette.source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime"]);
palette.module.n();
assert.deepEqual(palette.module.t({ chatTheme: "blue", colorCount: 0, isDarkMode: false }), []);
assert.deepEqual(palette.module.t({ chatTheme: "blue", colorCount: Number.NaN, isDarkMode: false }), []);
assert.deepEqual(palette.module.t({ chatTheme: "blue", colorCount: 2.9, isDarkMode: false }), ["#539af8", "#6bc67f"]);
assert.deepEqual(palette.module.t({ chatTheme: "purple", colorCount: 3, isDarkMode: true }), ["#7849d1", "#ab4f7a", "#1f4e94"]);
assert.deepEqual(palette.module.t({ chatTheme: "unknown", colorCount: 1, isDarkMode: false }), ["#539af8"]);
assert.deepEqual(palette.module.t({ chatTheme: { light: "blue", dark: "pink" }, colorCount: 1, isDarkMode: true }), ["#1f4e94"]);
assert.deepEqual(palette.module.t({ chatTheme: "yellow", colorCount: 7, isDarkMode: false }), ["#f8d45d", "#b897f4", "#f68ebc", "#539af8", "#6bc67f", "#ef8b57", "#f8d45d"]);

console.log("chart primitives cluster tests passed (28 assertions)");
