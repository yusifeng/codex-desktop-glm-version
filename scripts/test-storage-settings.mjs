import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const usage = {
  allowed_bytes: 10 * 1024 * 1024,
  breakdown_by_file_type: [
    { count: 2, file_type: "image", used_bytes: 512 * 1024 },
    { count: 3, file_type: "document", used_bytes: 1024 * 1024 },
    { count: 1, file_type: "audio", used_bytes: 256 * 1024 },
  ],
  is_over_limit: false,
  limit_tier: "plus",
  remaining_bytes: 8.25 * 1024 * 1024,
  used_bytes: 1.75 * 1024 * 1024,
};
const state = {
  analytics: [],
  apiPaths: [],
  initialized: 0,
  navigations: [],
  queryOptions: null,
  queryResult: null,
  refetches: 0,
  toasts: [],
};

function queryResult(overrides = {}) {
  return {
    data: undefined,
    isError: false,
    isPending: false,
    refetch: async () => { state.refetches += 1; return state.queryResult; },
    ...overrides,
  };
}
state.queryResult = queryResult({ isPending: true });

const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const React = {
  useEffect(effect) { effect(); },
  useId() { return "storage-usage-label"; },
  useRef(value) { return { current: value }; },
};
globalThis.__storageSettings = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__storageSettings;",
    "const initialize=()=>{runtime.state.initialized+=1};",
    "export const $3=initialize;export const FX=initialize;export const gL=initialize;export const qm=initialize;",
    "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const ZI='app-scope';export const pk='toast-manager';",
    "export const LX=()=>({get:()=>({info:(message,options)=>runtime.state.toasts.push({message,options})})});",
    "export const n4=()=>({formatNumber:(value,options)=>new Intl.NumberFormat('en-US',options).format(value)});",
    "export const _L=options=>{runtime.state.queryOptions=options;return runtime.state.queryResult};",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__storageSettings.state;",
    "export const cRt='storage-viewed';export const sRt='storage-row-clicked';",
    "export const fRt=()=>{state.initialized+=1};",
    "export const o_n=()=>destination=>state.navigations.push(destination);",
    "export const rJt={safeGet:async path=>{state.apiPaths.push(path);return {ok:true}}};",
    "export const xpn=(_scope,event,payload)=>state.analytics.push({event,payload});",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/storage-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "storage-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["ChatGptStorageSettings"]);
assert.equal(state.initialized, 5);

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
function button(view, label) {
  return walk(view).find((node) => node.type === "button" && textContent(node).includes(label));
}

const loading = module.ChatGptStorageSettings();
assert.equal(textContent(loading).includes("Storage"), true);
assert.equal(walk(loading).some((node) => node.props?.role === "status"), true);
assert.deepEqual(state.queryOptions.queryKey, ["4231797315"]);
await state.queryOptions.queryFn();
assert.deepEqual(state.apiPaths, ["/files/library/storage/usage"]);

state.queryResult = queryResult({ isError: true });
const failed = module.ChatGptStorageSettings();
assert.equal(walk(failed).some((node) => node.props?.role === "alert"), true);
button(failed, "Retry").props.onClick();
await Promise.resolve();
assert.equal(state.refetches, 1);

state.queryResult = queryResult({ data: usage });
const success = module.ChatGptStorageSettings();
assert.equal(textContent(success).includes("1.75 MB of 10 MB used"), true);
const progress = walk(success).find((node) => node.props?.role === "progressbar");
assert.equal(progress.props["aria-valuemax"], 10 * 1024 * 1024);
assert.equal(progress.props["aria-valuenow"], 1.75 * 1024 * 1024);
assert.equal(progress.props.children.props.style.width, "17.5%");
assert.equal(textContent(button(success, "Files")).includes("1.25 MB • 4 files"), true);
assert.equal(textContent(button(success, "Images")).includes("512 KB • 2 images"), true);
assert.equal(state.analytics[0].event, "storage-viewed");
assert.equal(state.analytics[0].payload.surface, "settings_storage");

button(success, "Files").props.onClick();
assert.equal(state.analytics.at(-1).payload.target, "files");
assert.equal(state.navigations.at(-1), "/library?tab=all&entry_point=settings");
assert.equal(state.toasts.at(-1).options.id, "library-storage-manage-storage-guidance");
button(success, "Images").props.onClick();
assert.equal(state.analytics.at(-1).payload.target, "images");
assert.equal(state.navigations.at(-1), "/library?tab=images&entry_point=settings");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " storage settings assertions passed");
