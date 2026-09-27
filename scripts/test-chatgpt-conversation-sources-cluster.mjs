import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["chatgpt-sources-side-panel-tab", "open-audio-summary-dialog", "open-conversation-files"];
const state = globalThis.__conversationSourcesTest = {};
state.jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) { const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]; if (name) names.add(name); }
    imports.set(match[2], names);
  }
}
const categories = Object.fromEntries(["apps", "files", "links", "memory", "more", "skills", "web"].map((key) => [key, { defaultMessage: key[0].toUpperCase() + key.slice(1) }]));
function mockModule(name) {
  if (name === "app-shared") return `export const I3 = () => globalThis.__conversationSourcesTest.jsx; export const Yh = (props) => ({ type: "Button", props });`;
  if (name === "chatgpt-sources-message") return `export const i={defaultMessage:"Sources"}; export const n={skill:{defaultMessage:"Skill"}}; export const r=${JSON.stringify(categories)}; export const t={userInstructions:{defaultMessage:"Custom instructions"},userMemory:{defaultMessage:"Saved memory"},generalMemory:{defaultMessage:"Memory"}};`;
  return "export {};";
}
let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "source-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" })); } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, (candidate) => { if (result == null && predicate(candidate)) result = candidate; }); return result; }
function findAll(node, predicate) { const result = []; walk(node, (candidate) => { if (predicate(candidate)) result.push(candidate); }); return result; }

// chatgpt-sources-side-panel-tab: 24
const sourcesModule = await bundle("chatgpt-sources-side-panel-tab");
assert.deepEqual(Object.keys(sourcesModule).sort(), ["ChatGptSourcesSidePanelTab", "ChatGptSummarySourcesCount"]);
const loading = sourcesModule.ChatGptSourcesSidePanelTab({ isLoading: true, sources: [] });
assert.equal(loading.props.role, "status");
assert.match(loading.props.children, /Loading/);
const empty = sourcesModule.ChatGptSourcesSidePanelTab({ sources: [] });
assert.equal(empty.props["aria-label"], "Sources");
assert.equal(find(empty, (node) => node.type === "h2").props.children, "Sources");
assert.equal(find(empty, (node) => node.type === "p").props.children, "No sources");
const sourceList = [
  { key: "w1", kind: "web", label: "OpenAI", snippet: "Official source" },
  { key: "f1", kind: "file", label: "Notes.pdf", attribution: "Uploaded" },
  { key: "m1", kind: "memory", label: "Prefers tea", memoryId: "memory-1", conversationContextType: "user_memory" },
  { key: "m2", kind: "memory", label: "PREFERS TEA", memoryId: "memory-1", conversationContextType: "user_memory" },
  { key: "p1", kind: "memory", label: "Earlier chat", url: "/c/old%20chat", conversationContextType: "past_conversation" },
];
let opened, deleted;
const panel = sourcesModule.ChatGptSourcesSidePanelTab({ sources: sourceList, presentation: "summary", onOpenSource: (source) => { opened = source; }, onDeleteMemory: (source) => { deleted = source; } });
assert.equal(panel.props["data-presentation"], "summary");
assert.equal(findAll(panel, (node) => node.type === "li").length, 4);
assert.equal(findAll(panel, (node) => node.type === "h3").length, 3);
assert.equal(find(panel, (node) => node.type === "h3" && node.props.children === "Web").props.children, "Web");
assert.equal(find(panel, (node) => node.type === "h3" && node.props.children === "Files").props.children, "Files");
assert.equal(find(panel, (node) => node.type === "h3" && node.props.children === "Memory").props.children, "Memory");
assert.equal(find(panel, (node) => node.type === "p" && node.props.children === "Official source").props.children, "Official source");
assert.equal(find(panel, (node) => node.type === "small" && node.props.children === "Uploaded").props.children, "Uploaded");
assert.equal(find(panel, (node) => node.type === "small" && node.props.children === "Saved memory").props.children, "Saved memory");
find(panel, (node) => node.type === "button" && node.props.children === "OpenAI").props.onClick(); assert.equal(opened.key, "w1");
find(panel, (node) => node.type === "Button").props.onClick(); assert.equal(deleted.memoryId, "memory-1");
const blocked = sourcesModule.ChatGptSourcesSidePanelTab({ sources: sourceList.slice(0, 1), shouldBlockExternalEgress: true });
assert.equal(find(blocked, (node) => node.type === "button").props.disabled, true);
const count = sourcesModule.ChatGptSummarySourcesCount({ inputCount: 2, sources: sourceList });
assert.equal(count.type, "span");
assert.equal(count.props.children, 5);
assert.equal(sourcesModule.ChatGptSummarySourcesCount({ sources: sourceList.slice(2) }).props.children, 1);
assert.equal(sourcesModule.ChatGptSummarySourcesCount({ sources: [] }).props.children, 0);

// open-audio-summary-dialog: 5
const audio = await bundle("open-audio-summary-dialog");
assert.deepEqual(Object.keys(audio), ["openAudioSummaryDialog"]);
let dialogId, dialogRequest;
audio.openAudioSummaryDialog({ openDialog(id, request) { dialogId = id; dialogRequest = request; } }, "conversation-1");
assert.equal(dialogId, "audio-summary");
assert.deepEqual(dialogRequest, { conversationId: "conversation-1" });
assert.equal(audio.openAudioSummaryDialog({}, "conversation-2"), undefined);
assert.equal(typeof audio.openAudioSummaryDialog, "function");

// open-conversation-files: 8
const files = await bundle("open-conversation-files");
assert.deepEqual(Object.keys(files), ["openConversationFiles"]);
let panelRequest;
const filesHost = { accountId: "account", userId: "user", openPanel(panel) { panelRequest = panel; } };
files.openConversationFiles(filesHost, { conversationId: "conversation-3" });
assert.equal(panelRequest.id, "chatgpt-conversation-files");
assert.equal(panelRequest.kind, "chatgpt-conversation-files");
assert.equal(panelRequest.target, "right");
assert.equal(panelRequest.title, "Files in chat");
assert.deepEqual(panelRequest.props, { accountId: "account", conversationId: "conversation-3", userId: "user" });
panelRequest = undefined; files.openConversationFiles({ ...filesHost, accountId: null }); assert.equal(panelRequest, undefined);
assert.equal(typeof files.openConversationFiles, "function");

console.log("chatgpt conversation sources cluster tests passed");
