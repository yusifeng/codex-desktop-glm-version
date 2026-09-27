import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["conversation-screen", "conversation-summary", "archived-conversation-preview-footer", "chatgpt-sources-message", "chatgpt-entity-side-panel-tab"];
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
function findAll(node, predicate) { const result = []; walk(node, (candidate) => { if (predicate(candidate)) result.push(candidate); }); return result; }

// conversation-screen: 11
const screen = await bundle("conversation-screen");
assert.deepEqual(Object.keys(screen).sort(), ["n", "r", "t"]);
screen.r(); assert.equal(screen.n({ status: "allowed" }), null);
let requestCount = 0, switchCount = 0;
const restricted = screen.n({ status: "restricted", email: "person@example.com", canSwitchToWork: true, onRequestAccess: () => requestCount++, onSwitchToWork: () => switchCount++ });
assert.match(find(restricted, (node) => node.type === "h1").props.children, /don’t have access/);
assert.equal(find(restricted, (node) => node.type === "p").props.children, "person@example.com");
assert.equal(findAll(restricted, (node) => node.type === "Button").length, 2);
findAll(restricted, (node) => node.type === "Button")[0].props.onClick(); assert.equal(requestCount, 1);
findAll(restricted, (node) => node.type === "Button")[1].props.onClick(); assert.equal(switchCount, 1);
assert.equal(screen.t({ enabled: false, children: "chat" }), "chat");
assert.equal(screen.t({ enabled: true, isLoading: true, children: "chat" }), null);
assert.equal(screen.t({ enabled: true, isCapable: false, children: "chat" }), "chat");
assert.equal(find(screen.t({ enabled: true, isCapable: true, status: "restricted" }), (node) => node.type === "h1").type, "h1");

// conversation-summary: 18
const summary = await bundle("conversation-summary");
assert.deepEqual(Object.keys(summary).sort(), ["a", "i", "n", "o", "r", "t"]);
const base = { display_schedule: null, is_enabled: true, last_run_time: null, next_run_times: [], schedule_components: { frequency: "once" }, timing_mode: "scheduled" };
const oldTask = { ...base, id: "one", updated_at: "2026-09-20T00:00:00Z" };
const newTask = { ...oldTask, updated_at: "2026-09-21T00:00:00Z" };
const merged = summary.r([oldTask], [newTask, { ...base, id: "two", updated_at: "2026-09-22T00:00:00Z" }]);
assert.equal(merged.length, 2);
assert.equal(merged[0].automation.updated_at, "2026-09-21T00:00:00Z");
assert.deepEqual(merged.map((item) => item.automation.id), ["one", "two"]);
assert.equal(summary.i(oldTask), "completed");
assert.equal(summary.i({ ...oldTask, next_run_times: ["2026-09-28T00:00:00Z"] }), "active");
assert.equal(summary.i({ ...oldTask, is_enabled: false, next_run_times: ["2026-09-28T00:00:00Z"] }), "paused");
assert.equal(summary.i({ ...oldTask, timing_mode: "condition_watch" }), "active");
const active = { automation: { ...oldTask, id: "active", next_run_times: ["2026-09-28T00:00:00Z"] } };
const paused = { automation: { ...oldTask, id: "paused", is_enabled: false, next_run_times: ["2026-09-28T00:00:00Z"], updated_at: "2026-09-27T10:00:00Z" } };
const completed = { automation: { ...oldTask, id: "done", updated_at: "2026-09-27T09:00:00Z" } };
const groups = summary.a([active, paused, completed], Date.parse("2026-09-27T12:00:00Z"));
assert.deepEqual(groups.active.map((item) => item.automation.id), ["active"]);
assert.deepEqual(groups.paused.map((item) => item.automation.id), ["paused"]);
assert.deepEqual(groups.completed.map((item) => item.automation.id), ["done"]);
assert.deepEqual(groups.recent.map((item) => item.automation.id), ["paused", "done"]);
assert.equal(groups.paused[0].automation.updated_at, "2026-09-27T10:00:00Z");
const line = summary.t({ item: active, now: new Date("2026-09-27T23:30:00Z") });
assert.match(line.props.children, /Scheduled/);
assert.match(summary.t({ item: active, runPhase: "starting" }).props.children, /Starting run/);
assert.match(summary.t({ item: paused }).props.children, /Paused/);
assert.equal(summary.t({ item: completed }).props["data-automation-status"], "completed");
summary.n(); summary.o(); assert.equal(typeof summary.r, "function");
assert.equal(typeof summary.t, "function");

// archived-conversation-preview-footer: 10
const footer = await bundle("archived-conversation-preview-footer");
assert.deepEqual(Object.keys(footer).sort(), ["n", "t"]);
let recovered, done = 0, failure;
const archived = footer.t({ conversationId: "c1", kind: "cloud", onRecover: (input) => { recovered = input; } });
assert.equal(archived.type, "footer");
assert.match(find(archived, (node) => node.type === "p").props.children, /archived chat preview/);
assert.equal(find(archived, (node) => node.type === "Button").props.children, "Restore chat");
await find(archived, (node) => node.type === "Button").props.onClick(); assert.deepEqual(recovered, { conversationId: "c1", kind: "cloud" });
const restored = footer.t({ conversationId: "c1", kind: "chatgpt", restored: true, onDone: () => done++ });
assert.equal(find(restored, (node) => node.type === "p").props.children, "Chat restored");
find(restored, (node) => node.type === "Button").props.onClick(); assert.equal(done, 1);
assert.equal(find(footer.t({ conversationId: "c1", kind: "local", restoring: true }), (node) => node.type === "Button").props.disabled, true);
const rejected = footer.t({ conversationId: "c2", kind: "local", onRecover: () => Promise.reject(new Error("no")), onError: (error) => { failure = error; } });
await find(rejected, (node) => node.type === "Button").props.onClick(); assert.equal(failure.message, "no");
footer.n(); assert.equal(typeof footer.t, "function");

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

console.log("chatgpt conversation support cluster tests passed");
