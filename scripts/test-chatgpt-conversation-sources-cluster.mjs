import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["open-conversation-files"];
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
function mockModule(name) {
  if (name === "app-shared") return `export const I3 = () => globalThis.__conversationSourcesTest.jsx; export const Yh = (props) => ({ type: "Button", props }); export const QI=()=>{};export const ZI={};export const QX=(scope,factory)=>({scope,factory});export const rZ=(scope,factory)=>({scope,factory});export const Rv='FilesIcon';export const HX=()=>null;export const BX=()=>({data:[],refetch:async()=>{}});export const LX=()=>({});`;
  if (name === "app-initial") return `export const Sun=()=>{};export const cJt=()=>{};export const Wvt=()=>{};export const FDt=()=>{};export const IDt=(kind,component,options)=>({kind,component,...options});export const mun='account';export const _un='user';export const mpn='intl';export const $en={};export const Gvt=()=>{};export const gvt=()=>null;export const RVt={};export const jVt={};export const rJt={safeGet:async()=>({items:[]})};`;
  return "export {};";
}
let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "source-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" })); } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}
const releaseAssertions = assertReleaseOwner("chatgpt-sources-side-panel-tab", [
  /\/sidebar\/conversation_context_sources/,
  /No sources yet/,
  /conversationContextType === `user_memory`/,
  /Couldn’t update this memory\. Please try again/,
  /export \{ kn as ChatGptSourcesSidePanelTab, Dn as ChatGptSummarySourcesCount \}/,
]);

const audioReleaseAssertions = assertReleaseOwner("open-audio-summary-dialog");

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

console.log(`chatgpt conversation sources cluster tests passed with ${releaseAssertions + audioReleaseAssertions} release assertions`);
