import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/deep-research-fill/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const jsx = { jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; }, Fragment: "Fragment" };
globalThis.__deepResearchFill = { jsx };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "deep-research-fill-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: module === "app-shared" ? "export const I3=()=>globalThis.__deepResearchFill.jsx;" : "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }

deepEqual(Object.keys(module), ["default"]);
equal(typeof module.default, "function");
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);

let icon = module.default();
equal(icon.type, "svg");
equal(icon.props.width, "1em");
equal(icon.props.height, "1em");
equal(icon.props.viewBox, "0 0 20 20");
equal(icon.props.fill, "currentColor");
equal(icon.props.children.type, "path");
equal(typeof icon.props.children.props.d, "string");
equal(icon.props.children.props.d.startsWith("M16.2791 10.702"), true);
equal(icon.props.children.props.d.endsWith("14.8677Z"), true);
equal(icon.props.children.props.d.includes("M5.27905 13.014"), true);
equal(icon.props.children.props.d.includes("M9.90313 14.8677"), true);

icon = module.default({ width: 24, height: 32, fill: "#123456", className: "menu-icon", "aria-label": "Deep research", children: "ignored" });
equal(icon.props.width, 24);
equal(icon.props.height, 32);
equal(icon.props.fill, "#123456");
equal(icon.props.className, "menu-icon");
equal(icon.props["aria-label"], "Deep research");
equal(icon.props.children.type, "path");
ok(icon.props.children.props.d.length > 1000);

console.log(`deep-research-fill tests passed (${assertions} assertions)`);
