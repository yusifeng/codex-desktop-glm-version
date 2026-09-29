import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  allowDebugMenu: true,
  chromeEnabled: false,
  gpu: {
    disableScrollFadeMask: false,
    disableScrollFadeMaskAnimation: true,
    disableBackdropBlur: false,
    disableCssMotion: false,
    disableSquircles: true,
    forceOpaqueRendererBackground: false,
  },
  initialized: 0,
  writes: [],
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const React = { Fragment: "Fragment" };
globalThis.__debugSettings = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__debugSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};",
    "export const Cq={allowDebugMenu:()=>runtime.state.allowDebugMenu};",
    "export const HX=()=>runtime.state.gpu;",
    "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const LX=()=>({});export const ZI='app-scope';",
    "export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace('{settingName}',values?.settingName??'')});",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__debugSettings.state;",
    "export const bn='gpu-debug-settings';",
    "export const vz={debugChromePagesEnabled:{key:'debugChromePagesEnabled'}};",
    "export const Kcn=()=>state.chromeEnabled;",
    "export const Ucn=async(_scope,setting,value)=>{state.chromeEnabled=value;state.writes.push({kind:'setting',key:setting.key,value})};",
    "export const Sn=(_scope,key,value)=>{state.gpu[key]=value;state.writes.push({kind:'gpu',key,value})};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/debug-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "debug-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["DebugSettings"]);
assert.equal(state.initialized, 1);

function walk(value, result = []) {
  if (value == null || typeof value !== "object") return result;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, result);
    return result;
  }
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
function row(view, label) {
  return walk(view).find((node) => typeof node.props?.className === "string"
    && node.props.className.includes("min-h-14")
    && textContent(node.props.children[0]).includes(label));
}
function toggle(view, label) {
  return row(view, label).props.children[1].props.children;
}

const root = module.DebugSettings();
assert.equal(root.type, "div");
assert.equal(textContent(root).includes("Debug"), true);
assert.equal(textContent(root).includes("Chrome debug pages"), true);
assert.equal(textContent(root).includes("GPU Tearing Debug"), true);
for (const label of [
  "Disable scroll fade mask",
  "Disable scroll fade animation",
  "Disable backdrop blur",
  "Disable CSS motion",
  "Disable squircles",
  "Force opaque web background",
]) assert.ok(row(root, label));
assert.equal(toggle(root, "Enable Chrome debug pages").props["aria-checked"], false);
toggle(root, "Enable Chrome debug pages").props.onClick();
await Promise.resolve();
assert.deepEqual(state.writes.at(-1), { kind: "setting", key: "debugChromePagesEnabled", value: true });
assert.equal(toggle(root, "Disable scroll fade animation").props["aria-checked"], true);
toggle(root, "Disable scroll fade animation").props.onClick();
assert.deepEqual(state.writes.at(-1), { kind: "gpu", key: "disableScrollFadeMaskAnimation", value: false });
assert.equal(toggle(root, "Disable squircles").props["aria-label"], "Toggle Disable squircles");

state.allowDebugMenu = false;
const gated = module.DebugSettings();
assert.equal(textContent(gated).includes("Chrome debug pages"), false);
assert.equal(textContent(gated).includes("GPU Tearing Debug"), true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " debug settings assertions passed");
