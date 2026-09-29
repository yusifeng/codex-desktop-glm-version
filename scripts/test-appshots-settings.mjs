import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  appshot: { configuredHotkey: "DoubleCommand", supported: true },
  available: true,
  bridgeCalls: [],
  bridgeResult: { success: true, state: { configuredHotkey: "DoubleOption", supported: true } },
  initialized: 0,
  platform: "macos",
  settings: new Map([["destination", "automatic"], ["soundEnabled", true]]),
  writes: [],
};
const hookState = [];
let hookIndex = 0;
const React = {
  Fragment: "Fragment",
  __reset() { hookIndex = 0; },
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial;
    return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__appshotsSettings = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-primary": "export {};",
  "app-shared": [
    "const runtime=globalThis.__appshotsSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};",
    "export const HX=signal=>signal==='available'?runtime.state.available:runtime.state.appshot;",
    "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const LX=()=>({});export const ZI='app-scope';",
    "export const bz={destination:{key:'destination'},soundEnabled:{key:'soundEnabled'}};",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__appshotsSettings.state;",
    "export const _A='available';export const bA='appshot-state';",
    "export const E6t=()=>({platform:state.platform});",
    "export const Kcn=setting=>state.settings.get(setting.key);",
    "export const Ucn=async(_scope,setting,value)=>{state.settings.set(setting.key,value);state.writes.push({key:setting.key,value})};",
    "export const pnt={appshot:{setHotkey:async hotkey=>{state.bridgeCalls.push(hotkey);return state.bridgeResult}}};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appshots-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "appshots-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["AppshotsSettings"]);
assert.equal(state.initialized, 1);

function render() { React.__reset(); return module.AppshotsSettings(); }
function walk(value, result = []) {
  if (value == null || typeof value !== "object") return result;
  if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; }
  result.push(value); walk(value.props?.children, result); return result;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function row(view, label) {
  return walk(view).find((node) => typeof node.props?.className === "string"
    && node.props.className.includes("min-h-14")
    && textContent(node.props.children[0]).includes(label));
}
function control(view, label) { return row(view, label).props.children[1].props.children; }

let view = render();
assert.equal(textContent(view).includes("Take an appshot to show ChatGPT your frontmost window"), true);
assert.equal(walk(view).some((node) => node.type === "video" && node.props.src === "appshot-demo-dc57d9bd1938.mp4"), true);
assert.equal(control(view, "Hotkey").props.value, "DoubleCommand");
assert.equal(textContent(control(view, "Hotkey")).includes("⌘ + ⌘"), true);
assert.equal(textContent(row(view, "Hotkey")).includes("Press both ⌘ keys simultaneously"), true);
control(view, "Hotkey").props.onChange({ currentTarget: { value: "DoubleOption" } });
await Promise.resolve();
assert.deepEqual(state.bridgeCalls, ["DoubleOption"]);
control(view, "Appshot destination").props.onChange({ currentTarget: { value: "new-chat" } });
await Promise.resolve();
assert.deepEqual(state.writes.at(-1), { key: "destination", value: "new-chat" });
assert.equal(control(view, "Play sound effect").props["aria-checked"], true);
control(view, "Play sound effect").props.onClick();
await Promise.resolve();
assert.deepEqual(state.writes.at(-1), { key: "soundEnabled", value: false });

state.bridgeResult = { success: false, error: "Hotkey already in use", state: state.appshot };
control(view, "Hotkey").props.onChange({ currentTarget: { value: "" } });
await Promise.resolve();
view = render();
assert.equal(textContent(row(view, "Hotkey")).includes("Hotkey already in use"), true);

state.platform = "windows";
view = render();
assert.equal(textContent(control(view, "Hotkey")).includes("Alt + Alt"), true);
assert.equal(textContent(control(view, "Hotkey")).includes("⌘ + ⌘"), false);
state.available = false;
assert.equal(render(), null);
state.available = true;
state.appshot = { supported: false };
assert.equal(render(), null);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " appshots settings assertions passed");
