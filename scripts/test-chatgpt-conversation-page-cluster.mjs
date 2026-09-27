import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/chatgpt-conversation-page-core/index.ts"), "utf8");
const imports = new Map();
for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
  const names = imports.get(match[2]) ?? new Set();
  for (const item of match[1].split(",")) {
    const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
    if (name) names.add(name);
  }
  imports.set(match[2], names);
}

const state = globalThis.__chatGptConversationPageTest = { buttonClicks: 0 };
state.jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
state.react = { useState(initial) { return [typeof initial === "function" ? initial() : initial, () => {}]; } };
const overrides = {
  I3: `() => globalThis.__chatGptConversationPageTest.jsx`,
  Yh: `(props) => ({ type: "Button", props })`,
  e6: `() => globalThis.__chatGptConversationPageTest.react`,
};
function mockModule(name) {
  if (name !== "app-shared") return "export {};";
  return [...(imports.get(name) ?? [])]
    .map((exportName) => `export const ${exportName} = ${overrides[exportName] ?? "undefined"};`)
    .join("\n");
}

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/chatgpt-conversation-page-core/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{ name: "conversation-page-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
  } }],
});
const page = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#conversation-page`);

function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit));
  else walk(children, visit);
}
function find(node, predicate) { let resultNode; walk(node, (candidate) => { if (resultNode == null && predicate(candidate)) resultNode = candidate; }); return resultNode; }
function findAll(node, predicate) { const nodes = []; walk(node, (candidate) => { if (predicate(candidate)) nodes.push(candidate); }); return nodes; }

assert.deepEqual(Object.keys(page).sort(), ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
page.c(); page.c(); page.f(); page.m(); page.u();
assert.equal(typeof page.i, "function");

const toolbar = page.p({ allowsThreadContentOverlap: true, project: { id: "p1", name: "Research", shared: true }, workTitle: "Plan", startActions: "actions" });
assert.equal(toolbar.type, "header");
assert.equal(toolbar.props["data-app-shell-thread-content-overlap"], true);
assert.equal(find(toolbar, (node) => node.type === "nav").props["aria-label"], "Breadcrumb");
assert.equal(find(toolbar, (node) => node.type === "a").props.href, "/g/p1");
assert.equal(find(toolbar, (node) => node.props?.["aria-current"] === "page").props.children, "Plan");

let reported = "";
const disclaimer = page.d({ conversationId: "shared-1", onReport: (id) => { reported = id; } });
assert.equal(disclaimer.type, "div");
assert.match(find(disclaimer, (node) => node.type === "p").props.children, /won't be added to memory/);
find(disclaimer, (node) => node.type === "Button").props.onClick();
assert.equal(reported, "shared-1");
assert.equal(page.d().props.children[1], null);

assert.equal(page.l({ authMethod: "api-key", chatGptAccessStatus: "allowed" }), null);
assert.equal(page.l({ authMethod: "chatgpt", chatGptAccessStatus: "denied" }), null);
assert.equal(page.l({ authMethod: "chatgpt", chatGptAccessStatus: "allowed", isWorkOnlyChatDisabled: true }), null);
assert.equal(page.l({ authMethod: "chatgpt", chatGptAccessStatus: "allowed", children: "menu" }).props.children, "menu");

const layout = page.a({ conversationId: "c1", header: "header", title: "Thread", children: "content", rightPanel: "panel" });
assert.equal(find(layout, (node) => node.type === "main").props["data-conversation-id"], "c1");
assert.equal(find(layout, (node) => node.type === "main").props.children, "content");
assert.equal(find(layout, (node) => node.type === "aside").props.children, "panel");
assert.equal(find(layout, (node) => node.props?.className === "conversation-document-title").props.children, "Thread");
assert.equal(find(page.a({ conversationId: "c2", isArchivedPreview: true }), (node) => node.props?.className === "conversation-document-title"), undefined);

const temporaryHeader = page.n({ isTemporaryChat: true });
assert.equal(temporaryHeader.props["aria-label"], "Temporary chat");
const cloudHeader = page.n({ isCloudTask: true, title: "Cloud work" });
assert.equal(find(cloudHeader, (node) => node.props?.["aria-label"] === "Cloud chat").props.children, "☁");
const breadcrumbHeader = page.n({ breadcrumbHeader: "crumb", title: "Thread" });
assert.equal(breadcrumbHeader.type, "Fragment");
assert.equal(breadcrumbHeader.props.children[0], "crumb");

const actions = page.r({ children: "share" });
assert.equal(actions.props["data-header-action-id"], "chatgpt-conversation-actions");
assert.equal(actions.props.children, "share");

const redirect = page.i();
assert.equal(redirect.type, "a");
assert.equal(redirect.props.href, "/");
const conversation = page.i({ conversationId: "c3", title: "Hello", turns: [{ id: "t1", role: "user", text: "Hi" }] });
assert.equal(find(conversation, (node) => node.props?.["data-conversation-id"] === "c3").type, "main");
assert.equal(find(conversation, (node) => node.props?.["data-turn-id"] === "t1").props.children, "Hi");

assert.equal(page.s().props["data-redirect"], true);
const shared = page.s({ sharedConversationId: "s1", turns: [{ id: "t2", role: "assistant", text: "Answer" }] });
assert.equal(find(shared, (node) => node.props?.["data-shared-conversation-id"] === "s1").props["data-shared-conversation-id"], "s1");
assert.equal(find(shared, (node) => node.props?.["aria-disabled"] === true).props["aria-disabled"], true);
assert.match(find(shared, (node) => node.type === "p").props.children, /shared ChatGPT chat/);

const loading = page.t({ conversationId: "loading", isLoading: true });
assert.equal(find(loading, (node) => node.props?.role === "status").props.children, "Loading conversation…");
let retried = 0;
const failed = page.t({ conversationId: "failed", error: "Network error", onRetry: () => { retried++; } });
assert.equal(find(failed, (node) => node.props?.role === "alert").type, "div");
find(failed, (node) => node.type === "Button").props.onClick();
assert.equal(retried, 1);
assert.equal(find(page.t({ conversationId: "empty", emptyState: "No messages" }), (node) => node.props?.className === "min-h-0 flex-1").props.children, "No messages");

let sharedId = "";
const share = page.o({ conversationId: "c4", onShare: (id) => { sharedId = id; } });
assert.equal(share.type, "Button");
assert.equal(share.props.disabled, false);
share.props.onClick();
assert.equal(sharedId, "c4");
assert.equal(page.o({ conversationId: "c", isRestricted: true }).props.title, "Sharing isn't available for this chat");
assert.equal(page.o({ conversationId: "c", isStreaming: true }).props.title, "Wait for ChatGPT to finish responding");
assert.equal(page.o({ conversationId: "c", isReady: false }).props.title, "Load the conversation before sharing");

console.log("chatgpt conversation page cluster tests passed");
