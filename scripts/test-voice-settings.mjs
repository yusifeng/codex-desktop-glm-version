import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/voice-settings/index.ts"), "utf8");
const accessSignal = { name: "voice-access" };
const accountSignal = { name: "account" };
const languageSignal = { name: "language" };
const toastSignal = { name: "toast" };
const state = {
  access: { status: "loading" },
  accountId: "acct-1",
  accountUpdates: [],
  audioPauses: 0,
  audioPlays: [],
  failAccountUpdate: false,
  failSettingWrite: false,
  initialized: 0,
  languageQuery: { data: { voiceMainLanguage: "auto" }, isError: false, refetch: async () => { state.languageRefetches += 1; } },
  languageRefetches: 0,
  microphoneQuery: null,
  microphoneRefetches: 0,
  settings: { "microphone-input-device-id": "mic-1", "voice-chat-hotkey": "Ctrl+Shift+V" },
  settingWrites: [],
  toasts: [],
  voiceQuery: null,
  voiceRefetches: 0,
};
function query(overrides = {}) { return { data: undefined, isError: false, isFetching: false, isLoading: false, refetch: async () => undefined, ...overrides }; }
function voiceData(overrides = {}) { return { accountVoiceStatus: "available", effectiveVoiceSlug: "ember", voices: [{ slug: "ember", name: "Ember", description: "Warm and confident", previewUrl: "https://example.test/ember.mp3" }, { slug: "breeze", name: "Breeze", description: "Bright and calm", previewUrl: "https://example.test/breeze.mp3" }], ...overrides }; }
state.microphoneQuery = query({ data: [{ deviceId: "mic-1", kind: "audioinput", label: "Studio microphone" }], refetch: async () => { state.microphoneRefetches += 1; } });
state.voiceQuery = query({ data: voiceData(), refetch: async () => { state.voiceRefetches += 1; } });

let hookCursor = 0;
let hookValues = [];
function resetHooks() { hookCursor = 0; hookValues = []; }
const React = {
  useRef(initialValue) { const index = hookCursor++; if (!(index in hookValues)) hookValues[index] = { current: initialValue }; return hookValues[index]; },
  useState(initialValue) { const index = hookCursor++; if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue; return [hookValues[index], (next) => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; }]; },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const toastManager = {
  danger(message, options) { state.toasts.push({ kind: "danger", message, options }); },
  success(message) { state.toasts.push({ kind: "success", message }); },
};
const scope = { get(signal) { return signal === toastSignal ? toastManager : undefined; } };
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: { enumerateDevices: async () => [{ deviceId: "mic-1", kind: "audioinput", label: "Studio microphone" }] } } });
globalThis.Audio = class {
  constructor(url) { this.url = url; this.currentTime = 0; this.onended = null; }
  pause() { state.audioPauses += 1; }
  async play() { state.audioPlays.push(this.url); }
};
globalThis.__voiceSettings = { React, accessSignal, accountSignal, jsx, languageSignal, scope, state, toastSignal };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__voiceSettings;",
    "export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;",
    "export const ZI='scope';export const pk=r.toastSignal;export const LX=()=>r.scope;",
    "export const HX=signal=>signal===r.accessSignal?r.state.access:signal===r.accountSignal?r.state.accountId:r.state.languageQuery;",
    "export const _L=options=>options.queryKey?.[0]==='voice-settings-microphones'?r.state.microphoneQuery:r.state.voiceQuery;",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage??''});",
    "export const iz={microphoneInputDeviceId:{key:'microphone-input-device-id'},voiceChatHotkey:{key:'voice-chat-hotkey'}};",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__voiceSettings;const s=r.state;",
    "export const Eln=r.accessSignal;export const U6t=r.accountSignal;export const bqt=r.languageSignal;",
    "export const Xl=()=>{s.initialized+=1};export const su=()=>{s.initialized+=1};",
    "export const Kcn=key=>s.settings[key];",
    "export const Ucn=async(scope,setting,value)=>{s.settingWrites.push({scope,setting,value});if(s.failSettingWrite)throw Error('setting write failed');s.settings[setting.key]=value};",
  ].join("\n"),
  "app-primary": [
    "const s=globalThis.__voiceSettings.state;",
    "export const Wp=()=>{s.initialized+=1};",
    "export const Gp=async(scope,accountId,setting,value)=>{s.accountUpdates.push({scope,accountId,setting,value});if(s.failAccountUpdate)throw Error('account update failed')};",
  ].join("\n"),
  "settings-loading-row": "const r=globalThis.__voiceSettings;export const n=()=>{r.state.initialized+=1};export const t=props=>({type:'loading-row',props});",
  "chatgpt-voices-query": [
    "const runtime=globalThis.__voiceSettings;export const t=['chatgpt-settings-voices'];export const r=()=>{runtime.state.initialized+=1};",
    "export const n={getOptions:(input,context)=>({queryKey:[...t,context?.accountId??null,input.voice_mode,input.spoken_language],input,context})};",
  ].join("\n"),
  "spoken-language-options": [
    "export const r=()=>{globalThis.__voiceSettings.state.initialized+=1};",
    "export const n=()=>[{label:'Automatic',value:'auto'},{label:'English',value:'en'},{label:'Spanish',value:'es'}];",
    "export const t=value=>({auto:'Automatic',en:'English',es:'Spanish'})[value]??value;",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/voice-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "voice-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function walk(value, result = []) {
  if (value == null || typeof value !== "object") return result;
  if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; }
  result.push(value);
  walk(value.props?.children, result);
  return result;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function render() { hookCursor = 0; return module.VoiceSettings(); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
function select(view, label) { return walk(view).find((node) => node.type === "select" && node.props?.["aria-label"] === label); }
function input(view, label) { return walk(view).find((node) => node.type === "input" && node.props?.["aria-label"] === label); }

assert.deepEqual(Object.keys(module), ["VoiceSettings"]);
assert.equal(state.initialized, 7);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]),
  ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "settings-loading-row", "chatgpt-voices-query", "spoken-language-options", "dictionary-dialog"],
);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|appPrimaryChunk|settingsLoadingRowChunk|chatgptVoicesQueryChunk|spokenLanguageOptionsChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(source.includes("voicesQueryKey"), true);

let view = render();
assert.equal(walk(view).some((node) => node.type === "loading-row"), true);
assert.equal(textContent(view).includes("Checking voice chat access…"), true);
assert.equal(select(view, "Microphone").props.value, "mic-1");
assert.equal(select(view, "Language").props.value, "auto");

state.access = { status: "error" };
resetHooks();
view = render();
assert.equal(textContent(view).includes("Unable to verify voice chat access"), true);

state.access = { status: "unavailable" };
resetHooks();
view = render();
assert.equal(textContent(view).includes("Voice chat unavailable"), true);
assert.equal(textContent(view).includes("does not have access to voice chat"), true);

state.access = { status: "available" };
state.voiceQuery = query({ isLoading: true, refetch: async () => { state.voiceRefetches += 1; } });
resetHooks();
view = render();
assert.equal(button(view, "Loading…").props.disabled, true);
assert.equal(input(view, "Voice chat hotkey").props.disabled, true);

state.voiceQuery = query({ isError: true, refetch: async () => { state.voiceRefetches += 1; } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Unable to load voice settings"), true);
button(view, "Retry").props.onClick();
await Promise.resolve();
assert.equal(state.voiceRefetches, 1);

state.voiceQuery = query({ data: voiceData(), refetch: async () => { state.voiceRefetches += 1; } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Voice chat"), true);
assert.equal(textContent(view).includes("Choose the voice Codex uses for new voice chats"), true);
assert.equal(button(view, "Ember") != null, true);
assert.equal(input(view, "Voice chat hotkey").props.value, "Ctrl+Shift+V");

button(view, "Ember").props.onClick();
view = render();
assert.equal(walk(view).some((node) => node.props?.role === "dialog"), true);
assert.equal(button(view, "Done").props.disabled, true);
const radios = walk(view).filter((node) => node.type === "input" && node.props?.type === "radio");
radios[1].props.onChange();
view = render();
assert.equal(button(view, "Done").props.disabled, false);
const previewButtons = walk(view).filter((node) => node.type === "button" && textContent(node) === "Preview");
await previewButtons[1].props.onClick();
assert.deepEqual(state.audioPlays, ["https://example.test/breeze.mp3"]);
view = render();
assert.equal(button(view, "Stop preview") != null, true);
await button(view, "Done").props.onClick();
assert.deepEqual(state.accountUpdates.at(-1), { scope, accountId: "acct-1", setting: "realtime_voice", value: "breeze" });
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Voice saved" });

resetHooks();
state.failAccountUpdate = true;
view = render();
button(view, "Ember").props.onClick();
view = render();
walk(view).filter((node) => node.type === "input" && node.props?.type === "radio")[1].props.onChange();
view = render();
await button(view, "Done").props.onClick();
view = render();
assert.equal(textContent(view).includes("Unable to save voice"), true);
assert.equal(state.toasts.at(-1).kind, "danger");
state.failAccountUpdate = false;

resetHooks();
view = render();
await select(view, "Microphone").props.onChange({ currentTarget: { value: "" } });
assert.deepEqual(state.settingWrites.at(-1).setting, { key: "microphone-input-device-id" });
assert.equal(state.settingWrites.at(-1).value, null);
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Microphone saved" });

resetHooks();
view = render();
await select(view, "Language").props.onChange({ currentTarget: { value: "es" } });
assert.deepEqual(state.accountUpdates.at(-1), { scope, accountId: "acct-1", setting: "voice_main_language", value: "es" });
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Voice language saved" });

resetHooks();
view = render();
input(view, "Voice chat hotkey").props.onChange({ currentTarget: { value: "Alt+V" } });
view = render();
await button(view, "Save hotkey").props.onClick();
assert.deepEqual(state.settingWrites.at(-1), { scope, setting: { key: "voice-chat-hotkey" }, value: "Alt+V" });
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Voice chat hotkey saved" });
view = render();
await button(view, "Clear").props.onClick();
assert.equal(state.settingWrites.at(-1).value, null);

resetHooks();
state.failSettingWrite = true;
view = render();
input(view, "Voice chat hotkey").props.onChange({ currentTarget: { value: "Alt+Space" } });
view = render();
await button(view, "Save hotkey").props.onClick();
view = render();
assert.equal(textContent(view).includes("setting write failed"), true);
assert.equal(state.toasts.at(-1).kind, "danger");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " voice settings assertions passed");
