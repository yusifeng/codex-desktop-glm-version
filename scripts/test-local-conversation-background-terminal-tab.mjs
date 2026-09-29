import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/local-conversation-background-terminal-tab/index.ts"), "utf8");
const state = { groups: [], initialized: 0, snapshots: new Map(), subscriptions: [], tabStates: [] };
const React = { useSyncExternalStore(subscribe, getSnapshot) { state.subscriptions.push(subscribe); return getSnapshot(); } };
const jsx = { jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__backgroundTerminalTab = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__backgroundTerminalTab;export const $3=()=>{r.state.initialized+=1};export const FX=()=>{r.state.initialized+=1};export const K2=()=>{r.state.initialized+=1};export const qm=()=>{r.state.initialized+=1};export const H3=()=>{r.state.initialized+=1};",
    "export const BX=()=>r.state.groups;export const I3=()=>r.jsx;export const e6=()=>r.React;",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__backgroundTerminalTab;export const HZt=()=>{r.state.initialized+=1};export const Lgn=()=>{r.state.initialized+=1};export const n$t='conversation-entries';",
    "export const Rgn={getSnapshot:id=>r.state.snapshots.get(id)??null,subscribeToSessionSnapshot:(id,listener)=>{r.state.subscriptions.push({id,listener});return()=>{r.state.subscriptions.push({id,unsubscribed:true})}}};",
  ].join("\n"),
  "xterm-output-panel": "export const XtermOutputPanel=props=>({type:'xterm-output-panel',props});",
  "terminal-panel": "export {};",
  "theme-font-face-loader": "export {};",
  "theme-font-family": "export {};",
  "xterm-window-zoom": "export {};",
};
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/local-conversation-background-terminal-tab/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "background-terminal-tab-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function render(overrides = {}) {
  const props = { conversationId: "conversation-1", terminalId: "terminal-1", setTabState: (next) => state.tabStates.push(next), renderSlots: (slots) => ({ type: "slots-result", props: slots }), ...overrides };
  return module.LocalConversationBackgroundTerminalTab(props);
}
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" " ); return textContent(value.props?.children); }

assert.deepEqual(Object.keys(module), ["LocalConversationBackgroundTerminalTab"]);
assert.deepEqual([...source.matchAll(/@rchunk\/([^"]+)/g)].map((match) => match[1]).sort(), ["app-initial", "app-shared", "rolldown-runtime", "terminal-panel", "theme-font-face-loader", "theme-font-family", "xterm-output-panel", "xterm-window-zoom"].sort());
assert.equal(/\b(?:appSharedChunk|appInitialChunk|xtermOutputPanelChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(state.initialized, 7);

let view = render();
assert.equal(view.type, "slots-result");
assert.deepEqual(view.props.headerRows, []);
assert.equal(textContent(view.props.content), "No output yet");
assert.equal(walk(view.props.content).find((node) => node.props?.role === "status").type, "div");
assert.equal(state.subscriptions.length, 1);
let listenerCalled = false;
const unsubscribe = state.subscriptions[0](() => { listenerCalled = true; });
assert.deepEqual(state.subscriptions.at(-1).id, "terminal-1");
state.subscriptions.at(-1).listener();
assert.equal(listenerCalled, true);
unsubscribe();
assert.equal(state.subscriptions.at(-1).unsubscribed, true);

state.snapshots.set("terminal-1", { buffer: "snapshot output" });
view = render();
let panel = walk(view.props.content).find((node) => node.type === "xterm-output-panel");
assert.equal(panel.props.output, "snapshot output");
panel.props.onRenderedOutputReady("snapshot output");
assert.deepEqual(state.tabStates.at(-1), { readOutput: "snapshot output" });

state.groups = [{ items: [{ aggregatedOutput: "older", id: "terminal-1", type: "commandExecution" }] }, { items: [{ aggregatedOutput: "latest aggregate", id: "terminal-1", type: "commandExecution" }] }];
view = render();
panel = walk(view.props.content).find((node) => node.type === "xterm-output-panel");
assert.equal(panel.props.output, "latest aggregate");
assert.notEqual(panel.props.output, "snapshot output");

state.groups = [{ items: [{ aggregatedOutput: "ignored", id: "terminal-1", type: "message" }, { aggregatedOutput: "other terminal", id: "terminal-2", type: "commandExecution" }] }];
view = render();
panel = walk(view.props.content).find((node) => node.type === "xterm-output-panel");
assert.equal(panel.props.output, "snapshot output");

state.groups = [{ items: [{ aggregatedOutput: null, id: "terminal-1", type: "commandExecution" }] }];
view = render();
panel = walk(view.props.content).find((node) => node.type === "xterm-output-panel");
assert.equal(panel.props.output, "snapshot output");
state.groups = [{ items: [{ aggregatedOutput: "", id: "terminal-1", type: "commandExecution" }] }];
view = render();
assert.equal(textContent(view.props.content), "No output yet");
assert.equal(walk(view.props.content).some((node) => node.type === "xterm-output-panel"), false);

state.groups = [];
state.snapshots.set("terminal-1", { buffer: "updated output" });
view = render();
panel = walk(view.props.content).find((node) => node.type === "xterm-output-panel");
assert.equal(panel.props.output, "updated output");
view = render({ terminalId: "terminal-2" });
assert.equal(textContent(view.props.content), "No output yet");
const subscribeTerminal2 = state.subscriptions.at(-1);
subscribeTerminal2(() => undefined);
assert.equal(state.subscriptions.at(-1).id, "terminal-2");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " local conversation background terminal tab assertions passed");
