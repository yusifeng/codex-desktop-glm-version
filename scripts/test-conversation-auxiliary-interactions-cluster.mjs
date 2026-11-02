import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const tag = new Proxy({}, { get(_target, property) { if (["special", "standard", "function", "definition"].includes(String(property))) return value => `${String(property)}:${value}`; return String(property); } });
globalThis.__auxiliaryTest = { jsx, tag, avatar: props => ({ type: "avatar", props }), derived: (...args) => ({ type: "derived", args }), highlightDefine: rules => ({ type: "highlight-style", rules }), theme: rules => ({ type: "theme", rules }), syntax: style => ({ type: "syntax-highlighting", style }) };
function mockSource(module) {
  if (module === "app-shared") return "export const I3=()=>globalThis.__auxiliaryTest.jsx;export const m4=(...v)=>v.filter(Boolean).join(' ');export const rZ=(...args)=>globalThis.__auxiliaryTest.derived(...args);";
  if (module === "app-primary") return "export const Bl=globalThis.__auxiliaryTest.avatar;";
  if (module === "codemirror-state-runtime") return "export const o={};export const r=globalThis.__auxiliaryTest.tag;";
  if (module === "codemirror-view-runtime") return "export const M={theme:globalThis.__auxiliaryTest.theme};export const O=globalThis.__auxiliaryTest.syntax;export const R=()=>{};export const t={define:globalThis.__auxiliaryTest.highlightDefine};export const w=()=>{};";
  return "export {};";
}
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "auxiliary-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mockSource(module), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
const children = node => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];

assertReleaseOwner("subagent-panel");

// subagent-row
const row = await bundle("subagent-row");
assert.deepEqual(Object.keys(row), ["n", "t"]);
const renderedRow = row.t({ avatarSeed: "seed", name: "Builder", status: "Working" });
assert.equal(renderedRow.type, "div");
assert.equal(children(renderedRow)[0].type, "avatar");
assert.equal(children(renderedRow)[0].props.seed, "seed");
assert.equal(children(renderedRow)[1].props.children, "Builder");
assert.equal(children(renderedRow)[2].props.children, "Working");
assert.equal(row.n(), undefined);

// share-conversation-action
const actions = await bundle("share-conversation-action");
const share = { action_v2: { action_enum: "share_conversation", conversation_id: "c1", current_node_id: " node-1 ", title: "Share me" } };
const dropdown = { action_v2: { action_enum: "dropdown", items: [share] } };
assert.equal(actions.i([share]), true);
assert.equal(actions.i([dropdown]), true);
assert.equal(actions.i([{ action_v2: { action_enum: "copy" } }]), false);
assert.equal(actions.n({ scope: {}, canShare: false, conversationId: "c1" }), undefined);
let shared;
const shareOverride = actions.n({ scope: {}, canShare: true, conversationId: "c1", onShare(_scope, conversationId, title, nodeId) { shared = { conversationId, title, nodeId }; return true; } });
assert.equal(await shareOverride(share), true);
assert.deepEqual(shared, { conversationId: "c1", title: "Share me", nodeId: "node-1" });
assert.equal(await shareOverride({ action_v2: { ...share.action_v2, conversation_id: "other" } }), false);
assert.equal(actions.r({ action: share, shareConversationEligible: true, shareConversationOverride: shareOverride }), shareOverride);
assert.equal(typeof actions.r({ action: share, shareConversationEligible: false }), "symbol");
assert.equal(actions.r({ action: { action_v2: { action_enum: "copy" } }, getActionOverride: () => "copy-handler" }), "copy-handler");
const events = [];
const services = { getCurrentMessageId: () => "m1", getConversationModel: () => ({ slug: "old" }), getMessage: () => ({ message: {} }), resolveModel: (_model, slug) => ({ slug }), updateModel: (_scope, _conversationId, model) => events.push(["update", model.slug]), async retry(input) { events.push(["retry", input.model.slug]); } };
const regenerate = actions.o({ scope: {}, conversationId: "c1", allowedModelSlug: "gpt-x", services });
assert.equal(await regenerate({ action_v2: { action_enum: "copy" } }), false);
assert.equal(await regenerate({ action_v2: { action_enum: "regenerate", model_slug: "other" } }), false);
assert.equal(await regenerate({ action_v2: { action_enum: "regenerate", model_slug: "gpt-x", update_model_picker: true } }), true);
assert.deepEqual(events, [["update", "gpt-x"], ["retry", "gpt-x"]]);
assert.equal(actions.t.type, "derived");

// chatgpt-code-block-highlighting
const highlighting = await bundle("chatgpt-code-block-highlighting");
assert.deepEqual(Object.keys(highlighting), ["a", "i", "n", "r", "t"]);
assert.equal(highlighting.i.InlineCodePane, "_InlineCodePane_k3ovr_2");
assert.equal(highlighting.i.ViewerContent, "_ViewerContent_k3ovr_7");
assert.equal(highlighting.i.Comment, "_Comment_k3ovr_11");
assert.equal(highlighting.t.type, "highlight-style");
assert.equal(highlighting.t.rules.length, 13);
assert.equal(highlighting.t.rules[0].class, "_Comment_k3ovr_11");
assert.equal(highlighting.t.rules.at(-1).class, "text-codex-syntax-error underline");
assert.equal(highlighting.n.length, 2);
assert.equal(highlighting.n[0].type, "theme");
assert.equal(highlighting.n[1].type, "syntax-highlighting");
assert.equal(highlighting.a(), undefined);
assert.equal(highlighting.r(), undefined);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(`${assertionCount} conversation auxiliary interaction assertions passed`);
