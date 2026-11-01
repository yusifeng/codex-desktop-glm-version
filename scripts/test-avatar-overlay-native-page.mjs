import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = [];
let hookIndex = 0;
const state = {
  avatar: { id: "codex", displayName: "Codex", source: "codex-asset", type: "builtin" },
  avatarId: "codex", bridgeMessages: [], collaborationMode: "default", debugBorder: false,
  failMessage: null, gates: { "665486075": true, "1532120159": false, "620613358": true },
  initialized: [], nativeVoiceTransition: true, petVisible: true, pointerStates: [],
  sessions: [{ id: "session-1", title: "Fix authentication", body: "Editing files", path: "/tasks/session-1", status: "running" }],
};
const React = {
  useRef(initial) { hookIndex += 1; return { current: initial }; },
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial;
    return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }];
  },
  useEffect(effect) { hookIndex += 1; effect(); },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__avatarOverlayNativePage = { React, jsx, state };

const dependencyNames = [
  "rolldown-runtime", "app-shared", "app-initial", "plan-implementation-request",
  "use-floating-window-pointer-interactivity", "mcp-tool-activity-label",
  "use-realtime-voice-native-overlay-transition-enabled", "active-tool-activity-label",
  "permission-request-model", "avatar-overlay-debug-state", "controls",
  "avatar-mascot-button", "realtime-voice-handoff-target",
];
const mocks = Object.fromEntries(dependencyNames.map((name) => [name, "export {};"]));
mocks["app-shared"] = [
  "const runtime=globalThis.__avatarOverlayNativePage;",
  "export const $3=()=>runtime.state.initialized.push('runtime');export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
  "export const $R={petVisible:{key:'petVisible',default:true}};",
  "export const G3={dispatchMessage:(type,payload)=>{if(runtime.state.failMessage===type)throw new Error('bridge failed');runtime.state.bridgeMessages.push({type,payload})}};",
].join("\n");
mocks["app-initial"] = [
  "const runtime=globalThis.__avatarOverlayNativePage;",
  "export const Kcn=()=>runtime.state.petVisible;export const bc=()=>({selectedAvatar:runtime.state.avatar,selectedAvatarId:runtime.state.avatarId});",
  "export const ofn=gate=>Boolean(runtime.state.gates[gate]);export const p4=()=>({activeMode:runtime.state.collaborationMode});export const q2=()=>runtime.state.initialized.push('overlay-activity');",
].join("\n");
mocks["use-floating-window-pointer-interactivity"] = [
  "const runtime=globalThis.__avatarOverlayNativePage;export const t=()=>runtime.state.initialized.push('pointer');",
  "export const n=options=>{const interactive=!options.isPaused?.();runtime.state.pointerStates.push(interactive);options.onInteractiveChange(interactive);return !interactive};",
].join("\n");
mocks["use-realtime-voice-native-overlay-transition-enabled"] = "const runtime=globalThis.__avatarOverlayNativePage;export const t=()=>runtime.state.initialized.push('voice-transition');export const n=()=>runtime.state.nativeVoiceTransition;";
mocks["avatar-overlay-debug-state"] = "const runtime=globalThis.__avatarOverlayNativePage;export const n=()=>runtime.state.initialized.push('debug');export const t={get value(){return runtime.state.debugBorder}};";
mocks["avatar-mascot-button"] = "const runtime=globalThis.__avatarOverlayNativePage;export const r=()=>runtime.state.initialized.push('mascot');export const t=props=>({type:'avatar-mascot',props});";
mocks["realtime-voice-handoff-target"] = "const runtime=globalThis.__avatarOverlayNativePage;export const n=()=>runtime.state.initialized.push('handoff');export const t=props=>({type:'voice-handoff',props});";

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/avatar-overlay-native-page/index.ts")], bundle: true,
  format: "esm", platform: "node", target: "node22", write: false, metafile: true, logLevel: "silent",
  plugins: [{ name: "avatar-overlay-native-page-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["AvatarOverlayNativePage"]);
assert.deepEqual(state.initialized, ["runtime", "pointer", "overlay-activity", "voice-transition", "debug", "mascot", "handoff"]);
assert.deepEqual(Object.keys(result.metafile.inputs).filter((input) => input.startsWith("mock:")).map((input) => input.slice(5)).sort(), [...dependencyNames].sort());

function render(clear = false) { hookIndex = 0; if (clear) hookState.length = 0; return module.AvatarOverlayNativePage(); }
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value); walk(value.props?.children, output); return output;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function find(view, predicate) { return walk(view).find(predicate); }
function button(view, label) { return find(view, (node) => node.type === "button" && (node.props?.["aria-label"] === label || textContent(node) === label)); }

let view = render(true);
assert.equal(view.props["data-avatar-overlay-state"], "ready");
assert.equal(view.props["data-native-voice-transition"], true);
assert.equal(state.pointerStates.at(-1), true);
assert.equal(find(view, (node) => node.type === "avatar-mascot").props.state, "idle");
assert.equal(find(view, (node) => node.type === "avatar-mascot").props.source, "codex-asset");
assert.equal(textContent(view).includes("Fix authentication Editing files"), false);
assert.equal(find(view, (node) => node.type === "voice-handoff").props.surface, "global-overlay");

button(view, "Open Codex in Codex").props.onClick();
assert.deepEqual(state.bridgeMessages.at(-1), { type: "open-current-main-window", payload: { focusComposer: true, stealFocus: true, appEntryAttribution: { channel: "shortcut", source: "shortcut" } } });
button(view, "Close pet").props.onClick();
assert.deepEqual(state.bridgeMessages.at(-1), { type: "avatar-overlay-close", payload: {} });
find(view, (node) => node.props?.["aria-label"] === "Quick chat prompt").props.onChange({ target: { value: "  review this patch  " } });
view = render();
assert.equal(button(view, "Send").props.disabled, false);
find(view, (node) => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.deepEqual(state.bridgeMessages.at(-1), { type: "avatar-overlay-submit-quick-chat", payload: { activeCollaborationMode: "default", avatarId: "codex", prompt: "review this patch", target: { type: "projectless" }, turnTrigger: "avatar_quick_chat" } });
view = render();
assert.equal(find(view, (node) => node.props?.["aria-label"] === "Quick chat prompt").props.value, "");

state.debugBorder = true; view = render();
assert.equal(view.props["data-debug-border"], true);
state.gates["665486075"] = false; state.gates["1532120159"] = false; state.gates["620613358"] = false;
state.sessions = []; view = render(true);
assert.equal(find(view, (node) => node.type === "form"), undefined);
assert.equal(find(view, (node) => node.type === "voice-handoff"), undefined);
assert.equal(state.pointerStates.at(-1), false);

state.avatar = { id: "loading", displayName: "Loading", type: "builtin" }; state.avatarId = "custom:pixel";
view = render(true);
assert.equal(view.props["data-avatar-overlay-state"], "pending-custom-avatar");
assert.equal(view.props.role, "status");
state.avatar = null; view = render(true);
assert.equal(view, null);
assert.deepEqual(state.bridgeMessages.at(-1), { type: "avatar-overlay-pointer-interaction-changed", payload: { isInteractive: false } });

state.avatar = { id: "codex", displayName: "Codex", type: "builtin" }; state.avatarId = "codex";
state.gates["665486075"] = true; state.failMessage = "avatar-overlay-submit-quick-chat"; view = render(true);
find(view, (node) => node.props?.["aria-label"] === "Quick chat prompt").props.onChange({ target: { value: "fail" } });
view = render(); find(view, (node) => node.type === "form").props.onSubmit({ preventDefault() {} });
view = render();
assert.equal(find(view, (node) => node.props?.role === "alert").props.children, "bridge failed");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " avatar overlay native page assertions passed");
