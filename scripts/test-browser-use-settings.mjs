import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const enabled = () => ({ enabled: true, isLoading: false });
const state = {
  bridgeClears: [],
  chosenDirectory: "/Users/demo/Downloads/browser",
  feature: enabled(),
  initialized: 0,
  location: { pathname: "/settings/browser-use" },
  navigations: [],
  selectedHostId: "host-1",
  settings: new Map([
    ["annotationScreenshotsMode", "necessary"],
    ["downloadDirectory", "/Users/demo/Downloads"],
    ["localUrlOpenTarget", "in-app-browser"],
    ["promptForDownloadLocation", false],
    ["showFullUrl", true],
  ]),
  toasts: [],
  visibility: {
    contactInfo: enabled(),
    downloads: enabled(),
    extensions: enabled(),
    history: enabled(),
    passwordManager: enabled(),
    siteSettings: enabled(),
  },
  writes: [],
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const React = {
  Fragment: "Fragment",
  useEffect(effect) { effect(); },
  useState(value) {
    let current = typeof value === "function" ? value() : value;
    return [current, (next) => { current = typeof next === "function" ? next(current) : next; }];
  },
};
globalThis.__browserUseSettings = { React, jsx, state };

const sideEffectModules = [
  "app-primary",
  "browser-browsing-data-dialog",
  "browser-profile-import-availability",
  "browser-use-origin-state-queries",
  "compact-empty-state",
  "dialog-launcher-core",
  "browser-profile-import-history-icon",
  "rolldown-runtime",
  "settings-plugin-selection",
  "settings-row-disclosure",
  "toolbar-breadcrumb",
];
const mocks = Object.fromEntries(sideEffectModules.map((name) => [name, "export {};"]));
mocks["app-shared"] = [
  "const runtime=globalThis.__browserUseSettings;",
  "export const $3=()=>{runtime.state.initialized+=1};",
  "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
  "export const ZI='app-scope';export const pk='toast-manager';",
  "export const LX=()=>({get:()=>({danger:message=>runtime.state.toasts.push(message)})});",
  "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  "export const Y2=props=>props.defaultMessage;",
  "export const Yh=props=>({type:'button',props});",
].join("\n");
mocks["app-initial"] = [
  "const state=globalThis.__browserUseSettings.state;",
  "export const Gv=()=>({selectedHostId:state.selectedHostId});",
  "export const Kcn=key=>state.settings.get(key);",
  "export const Ucn=async(_scope,key,value)=>{state.settings.set(key,value);state.writes.push({key,value})};",
  "export const i_n=()=>state.location;",
  "export const o_n=()=>((path,options)=>state.navigations.push({path,options}));",
  "export const pnt={browsingData:{clear:async categories=>state.bridgeClears.push([...categories])},downloads:{chooseDownloadDirectory:async()=>state.chosenDirectory}};",
  "export const w6t=()=>state.feature;",
].join("\n");
mocks["browser-settings-visibility"] = [
  "const state=globalThis.__browserUseSettings.state;",
  "export const n=()=>state.visibility;",
  "export const t=()=>{state.initialized+=1};",
].join("\n");

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/browser-use-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "browser-use-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["BrowserUseSettings"]);
assert.equal(state.initialized, 2);

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
function action(view, label) {
  return row(view, label).props.children[1].props.children;
}

const root = module.BrowserUseSettings();
assert.equal(root.type, "div");
assert.equal(textContent(root).includes("Browser Use"), true);
for (const title of ["Browser availability", "General", "Autofill and passwords", "Extensions", "Downloads", "Sites"]) {
  assert.equal(walk(root).some((node) => node.type === "h2" && textContent(node) === title), true);
}
assert.equal(textContent(row(root, "In-app browser")).includes("Available on host-1"), true);
assert.equal(action(root, "Show full URL").props["aria-checked"], true);
action(root, "Show full URL").props.onClick();
await Promise.resolve();
assert.deepEqual(state.writes.at(-1), { key: "showFullUrl", value: false });
action(root, "Open local URLs").props.onChange({ currentTarget: { value: "external-browser" } });
await Promise.resolve();
assert.deepEqual(state.writes.at(-1), { key: "localUrlOpenTarget", value: "external-browser" });
action(root, "Browsing history").props.onClick();
assert.equal(state.navigations.at(-1).path, "/settings/browser-use/browsing-history");
await action(root, "Location").props.onClick();
assert.deepEqual(state.writes.at(-1), { key: "downloadDirectory", value: "/Users/demo/Downloads/browser" });
action(root, "Site settings").props.onClick();
assert.equal(state.navigations.at(-1).path, "/settings/browser-use/site-settings");

state.location = { pathname: "/settings/browser-use/extensions" };
const extensions = module.BrowserUseSettings();
assert.equal(textContent(extensions).includes("Manage extensions available to the in-app browser."), true);
assert.equal(textContent(extensions).includes("Host: host-1"), true);
walk(extensions).find((node) => node.type === "button").props.onClick();
assert.equal(state.navigations.at(-1).path, "/settings/browser-use");

state.visibility.extensions = { enabled: true, isLoading: true };
const loadingSubpage = module.BrowserUseSettings();
assert.equal(loadingSubpage.props.role, "status");
state.visibility.extensions = { enabled: false, isLoading: false };
const disabledSubpage = module.BrowserUseSettings();
assert.equal(disabledSubpage, null);
assert.deepEqual(state.navigations.at(-1), { path: "/settings/browser-use", options: { replace: true } });

state.location = { pathname: "/settings/browser-use" };
state.feature = { enabled: true, isLoading: true };
const loadingRoot = module.BrowserUseSettings();
assert.equal(loadingRoot.props.role, "status");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " browser use settings assertions passed");
