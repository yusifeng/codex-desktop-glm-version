import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["conversation-summary", "chatgpt-sources-message", "chatgpt-entity-side-panel-tab"];
const state = globalThis.__chatGptConversationSupportTest = { stateUpdates: [] };
state.jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
state.react = { useState(initial) { const value = typeof initial === "function" ? initial() : initial; return [value, (next) => state.stateUpdates.push(next)]; } };

const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) {
      const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (name) names.add(name);
    }
    imports.set(match[2], names);
  }
}
const overrides = {
  I3: `() => globalThis.__chatGptConversationSupportTest.jsx`,
  Yh: `(props) => ({ type: "Button", props })`,
  e6: `() => globalThis.__chatGptConversationSupportTest.react`,
  m4: `(...values) => values.filter(Boolean).join(" ")`,
};
function mockModule(name) {
  if (name !== "app-shared") return "export {};";
  return [...(imports.get(name) ?? [])].map((exportName) => `export const ${exportName} = ${overrides[exportName] ?? "undefined"};`).join("\n");
}
let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "conversation-support-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, (candidate) => { if (result == null && predicate(candidate)) result = candidate; }); return result; }
const screenAssertions = assertReleaseOwner("conversation-screen", [
  /chatSeatAccess\.reviewAccess/,
  /export \{ J as n, be as r, X as t \}/,
]);

assertReleaseOwner("conversation-summary");

assertReleaseOwner("archived-conversation-preview-footer");

// chatgpt-sources-message: 7
const messages = await bundle("chatgpt-sources-message");
assert.deepEqual(Object.keys(messages).sort(), ["a", "i", "n", "r", "t"]);
assert.equal(messages.i.defaultMessage, "Sources");
assert.equal(messages.r.web.defaultMessage, "Web");
assert.equal(messages.r.apps.defaultMessage, "Apps");
assert.equal(messages.n.plugin.defaultMessage, "Plugin");
assert.equal(messages.t.userMemory.defaultMessage, "Saved memory");
assert.equal(new Set(Object.values(messages.r).map((message) => message.id)).size, 7);

// chatgpt-entity-side-panel-tab: 6
const entity = await bundle("chatgpt-entity-side-panel-tab");
assert.deepEqual(Object.keys(entity), ["ChatGptEntitySidePanelTab"]);
let renderedInput;
const entityPanel = entity.ChatGptEntitySidePanelTab({ conversationId: "c7", params: { sourceId: "source" }, renderEntity: (input) => { renderedInput = input; return "entity"; } });
assert.equal(entityPanel.type, "section");
assert.equal(renderedInput.conversationId, "c7");
assert.equal(renderedInput.flushTop, false);
assert.match(find(entityPanel, (node) => node.props?.children === "entity").props.className, /px-6/);
const memoryPanel = entity.ChatGptEntitySidePanelTab({ conversationId: "c8", params: { memorySource: "saved" }, renderEntity: (input) => input.flushTop ? "memory" : null });
assert.match(find(memoryPanel, (node) => node.props?.className?.includes("p-panel")).props.className, /p-panel/);

console.log(`chatgpt conversation support cluster tests passed with ${screenAssertions} screen release assertions`);
