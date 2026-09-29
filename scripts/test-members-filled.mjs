import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/members-filled/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const jsx = { jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; }, Fragment: "Fragment" };
globalThis.__membersFilled = { jsx };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "members-filled-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: module === "app-shared" ? "export const I3=()=>globalThis.__membersFilled.jsx;" : "export {};", loader: "js" })); } }] });
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
equal(Array.isArray(icon.props.children), true);
equal(icon.props.children.length, 4);
for (const child of icon.props.children) { equal(child.type, "path"); equal(typeof child.props.d, "string"); equal(child.props.d.endsWith("Z"), true); }
equal(icon.props.children[0].props.d.startsWith("M13.4834 10.8828"), true);
equal(icon.props.children[1].props.d.startsWith("M5.85547 10.7725"), true);
equal(icon.props.children[2].props.d.startsWith("M5.85547 4"), true);
equal(icon.props.children[3].props.d.startsWith("M13.4834 3.14453"), true);
deepEqual(icon.props.children.map((child) => child.key), [0, 1, 2, 3]);

icon = module.default({ width: 20, height: 24, fill: "red", className: "members", "aria-label": "Members", children: "ignored" });
equal(icon.props.width, 20);
equal(icon.props.height, 24);
equal(icon.props.fill, "red");
equal(icon.props.className, "members");
equal(icon.props["aria-label"], "Members");
equal(icon.props.children.length, 4);
ok(icon.props.children.every((child) => child.type === "path"));

console.log(`members-filled tests passed (${assertions} assertions)`);
