import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["chatgpt-gizmo-header"];
const state = globalThis.__conversationHeaderRuntimeTest = { stateValues: [], updates: [] };
state.jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
state.react = { useState(initial) { const value = state.stateValues.length > 0 ? state.stateValues.shift() : typeof initial === "function" ? initial() : initial; return [value, (next) => state.updates.push(next)]; } };
const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) { const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]; if (name) names.add(name); }
    imports.set(match[2], names);
  }
}
const overrides = { I3: `() => globalThis.__conversationHeaderRuntimeTest.jsx`, Yh: `(props) => ({ type: "Button", props })`, e6: `() => globalThis.__conversationHeaderRuntimeTest.react` };
function mockModule(name) { if (name !== "app-shared") return "export {};"; return [...(imports.get(name) ?? [])].map((exportName) => `export const ${exportName} = ${overrides[exportName] ?? "undefined"};`).join("\n"); }
let index = 0;
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "header-runtime-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" })); } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${index++}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, (candidate) => { if (result == null && predicate(candidate)) result = candidate; }); return result; }
function findAll(node, predicate) { const result = []; walk(node, (candidate) => { if (predicate(candidate)) result.push(candidate); }); return result; }

// chatgpt-gizmo-header: 14
const gizmoHeader = await bundle("chatgpt-gizmo-header");
assert.deepEqual(Object.keys(gizmoHeader).sort(), ["n", "r", "t"]);
assert.equal(gizmoHeader.n({ gizmoId: "missing" }), null);
let action = "";
const gizmo = { id: "g1", name: "  Analyst  ", canWrite: true, isPinned: false };
const header = gizmoHeader.n({ gizmoId: "g1", gizmo, onAbout: () => { action = "about"; }, onPinChange: (_item, pinned) => { action = `pin:${pinned}`; }, onEdit: () => { action = "edit"; }, onReport: () => { action = "report"; } });
assert.equal(header.type, "div");
assert.equal(header.props["data-gizmo-id"], "g1");
assert.equal(find(header, (node) => node.props?.className === "truncate").props.children, "Analyst");
assert.equal(find(header, (node) => node.type === "details").props.className, "gizmo-actions");
const gizmoButtons = findAll(header, (node) => node.type === "button");
assert.equal(gizmoButtons.length, 4);
gizmoButtons[0].props.onClick(); assert.equal(action, "about");
gizmoButtons[1].props.onClick(); assert.equal(action, "pin:true");
gizmoButtons[2].props.onClick(); assert.equal(action, "edit");
gizmoButtons[3].props.onClick(); assert.equal(action, "report");
assert.equal(find(gizmoHeader.t({ gizmoId: "g1", gizmo: { ...gizmo, isPinned: true } }), (node) => node.props?.children === "Unpin GPT").type, "button");
assert.equal(findAll(gizmoHeader.t({ gizmoId: "g1", gizmo: { ...gizmo, isMigratedPlugin: true } }), (node) => node.type === "button").length, 3);
gizmoHeader.r(); assert.equal(typeof gizmoHeader.n, "function");

const temporaryChatReleaseAssertions = assertReleaseOwner("chatgpt-temporary-chat-ui");

const cloudBrowserReleaseAssertions = assertReleaseOwner("cloud-browser-preview");

console.log(`chatgpt conversation header runtime cluster and ${temporaryChatReleaseAssertions + cloudBrowserReleaseAssertions} release assertions passed`);
