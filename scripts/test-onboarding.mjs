import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/onboarding/index.ts"), "utf8");
const state = { analytics: [], extension: { isExtensionPinned: false, isSidePanelOpen: false }, initialized: 0, userAgent: "Mozilla/5.0 Chrome/140.0" };
const hooks = [];
const effects = [];
let hookIndex = 0;
let id = 0;
const React = {
  __clear() { hooks.length = 0; effects.length = 0; hookIndex = 0; },
  __flushEffects() { for (const effect of effects.splice(0)) effect(); },
  __reset() { effects.length = 0; hookIndex = 0; },
  useEffect(effect) { effects.push(effect); },
  useId() { id += 1; return "id-" + id; },
  useRef(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; },
  useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; },
};
const jsx = { jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const signal = { kind: "extension-onboarding" };
globalThis.__extensionOnboarding = { React, jsx, signal, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__extensionOnboarding;",
    "export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;",
    "export const ZI='app-scope';export const LX=()=>({kind:'analytics-scope'});export const HX=()=>r.state.extension;",
    "export const YI=()=>r.state.userAgent;export const dZ=()=>r.signal;export const n4=()=>({formatMessage:(message,values)=>values?.browser?message.defaultMessage.replace('{browser}',values.browser):message.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__extensionOnboarding;export const pIt=()=>{r.state.initialized+=1};export const ypn=()=>{r.state.initialized+=1};",
    "export const XFt='extension-onboarding';export const xpn=(scope,event,payload)=>r.state.analytics.push({scope,event,payload});",
    "export const YFt={CHATGPT_WORK_CHROME_ONBOARDING_ACTION_CHECKLIST_STEP_SELECTED:'checklist',CHATGPT_WORK_CHROME_ONBOARDING_ACTION_SAMPLE_SELECTED:'sample',CHATGPT_WORK_CHROME_ONBOARDING_ACTION_SIDEBAR_CLICKED:'sidebar',CHATGPT_WORK_CHROME_ONBOARDING_ACTION_STEP_VIEWED:'view'};",
    "export const ZFt={CHATGPT_WORK_CHROME_ONBOARDING_STEP_OPEN_SIDEBAR:'open-sidebar',CHATGPT_WORK_CHROME_ONBOARDING_STEP_PAGE:'page',CHATGPT_WORK_CHROME_ONBOARDING_STEP_PIN_EXTENSION:'pin',CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_GALLERY:'gallery',CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_EMAIL:'email',CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_REPORT:'report',CHATGPT_WORK_CHROME_ONBOARDING_STEP_SAMPLE_INVENTORY:'inventory'};",
  ].join("\n"),
  "document-title": "const runtime=globalThis.__extensionOnboarding;export const r=()=>{runtime.state.initialized+=1};export const t=props=>({type:'document-title',props});",
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/onboarding/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "onboarding-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function render({ clear = false, flushEffects = true } = {}) { if (clear) React.__clear(); else React.__reset(); const view = module.ExtensionOnboarding(); if (flushEffects) React.__flushEffects(); return view; }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" " ); return textContent(value.props?.children); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
function progress(view) { return walk(view).find((node) => node.props?.role === "progressbar"); }
function dialog(view) { return walk(view).find((node) => node.props?.role === "dialog"); }

assert.deepEqual(Object.keys(module), ["ExtensionOnboarding"]);
assert.deepEqual([...source.matchAll(/@rchunk\/([^"]+)/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "document-title"]);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|documentTitleChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(state.initialized, 4);

let view = render({ clear: true });
assert.equal(textContent(view).includes("Welcome to ChatGPT for Chrome"), true);
assert.equal(walk(view).find((node) => node.type === "document-title").props.title, "ChatGPT for Chrome");
assert.equal(progress(view).props["aria-valuenow"], 0);
assert.equal(progress(view).props["aria-valuemax"], 3);
assert.equal(button(view, "Pin the extension").props.disabled, true);
assert.equal(button(view, "Try ChatGPT on sample work").props.disabled, true);
assert.equal(textContent(view).includes("Open the ChatGPT extension"), true);
assert.deepEqual(state.analytics.slice(0, 2).map((event) => event.payload), [{ action: "view", step: "page" }, { action: "view", step: "open-sidebar" }]);
button(view, "Open sidebar").props.onClick();
assert.deepEqual(state.analytics.at(-1).payload, { action: "sidebar", step: "open-sidebar" });
button(view, "Pin the extension").props.onClick();
assert.notEqual(state.analytics.at(-1).payload.action, "checklist");

state.extension = { isExtensionPinned: false, isSidePanelOpen: true };
view = render();
assert.equal(progress(view).props["aria-valuenow"], 1);
assert.equal(button(view, "Pin the extension").props["aria-current"], "step");
assert.equal(textContent(view).includes("Add ChatGPT to your Chrome toolbar"), true);
assert.deepEqual(state.analytics.at(-1).payload, { action: "view", step: "pin" });
button(view, "Open the extension in the sidebar").props.onClick();
assert.deepEqual(state.analytics.at(-1).payload, { action: "checklist", step: "open-sidebar" });
view = render();
assert.equal(button(view, "Open the extension in the sidebar").props["aria-current"], "step");

state.extension = { isExtensionPinned: true, isSidePanelOpen: true };
view = render();
assert.equal(progress(view).props["aria-valuenow"], 2);
assert.equal(textContent(view).includes("Draft an email"), true);
assert.equal(textContent(view).includes("Summarize a report"), true);
assert.equal(textContent(view).includes("Update an inventory system"), true);
button(view, "Try Draft an email").props.onClick();
assert.deepEqual(state.analytics.at(-1).payload, { action: "sample", step: "email" });
view = render();
assert.equal(progress(view).props["aria-valuenow"], 3);
assert.equal(dialog(view).props["aria-label"], "Reply to Samuel's message");
assert.equal(textContent(view).includes("Prompt added to side chat"), true);
assert.notEqual(walk(view).find((node) => node.type === "textarea"), undefined);
button(dialog(view), "Done").props.onClick();
view = render();
assert.equal(dialog(view), undefined);

button(view, "Try Summarize a report").props.onClick();
view = render();
assert.equal(dialog(view).props["aria-label"], "Q2 Customer Research");
assert.equal(textContent(dialog(view)).includes("Executive summary"), true);
button(dialog(view), "Done").props.onClick();
view = render();
button(view, "Try Update an inventory system").props.onClick();
view = render();
assert.equal(textContent(dialog(view)).includes("Products: 3"), true);
button(dialog(view), "Add product").props.onClick();
view = render();
assert.equal(textContent(dialog(view)).includes("Products: 4"), true);
button(dialog(view), "Undo").props.onClick();
view = render();
assert.equal(textContent(dialog(view)).includes("Products: 3"), true);
button(dialog(view), "Done").props.onClick();
view = render();
assert.equal(textContent(dialog(view)).includes("Saved"), true);
button(dialog(view), "Close").props.onClick();

state.userAgent = "Mozilla/5.0 Edg/140.0";
state.extension = { isExtensionPinned: false, isSidePanelOpen: false };
view = render({ clear: true });
assert.equal(textContent(view).includes("Welcome to ChatGPT for Edge"), true);
assert.equal(textContent(view).includes("Open and pin the extension"), true);
assert.equal(button(view, "Pin the extension"), undefined);
assert.equal(progress(view).props["aria-valuemax"], 2);
assert.equal(textContent(view).includes("Add ChatGPT to your Edge toolbar"), true);
state.extension = { isExtensionPinned: false, isSidePanelOpen: true };
view = render();
assert.equal(progress(view).props["aria-valuenow"], 0);
assert.equal(button(view, "Open and pin the extension").props["aria-current"], "step");
state.extension = { isExtensionPinned: true, isSidePanelOpen: true };
view = render();
assert.equal(progress(view).props["aria-valuenow"], 1);
assert.equal(textContent(view).includes("Try ChatGPT on sample work"), true);

state.userAgent = "Mozilla/5.0 OPR/120.0";
view = render({ clear: true });
assert.equal(textContent(view).includes("Welcome to ChatGPT for Opera"), true);
state.userAgent = "Mozilla/5.0 Vivaldi/7.0";
view = render({ clear: true });
assert.equal(textContent(view).includes("Welcome to ChatGPT for Vivaldi"), true);
state.userAgent = "Mozilla/5.0 Brave/1.80";
view = render({ clear: true });
assert.equal(textContent(view).includes("Welcome to ChatGPT for Brave"), true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " onboarding assertions passed");
