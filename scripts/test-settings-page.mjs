import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  dirty: new Set(), host: { kind: "local" }, init: 0, location: { hash: "", key: "1", pathname: "/settings/agent", search: "", state: null },
  narrow: false, navigations: [], routeRenders: [], selectedHostId: "local", hostSelections: [], shouldRender: true, redirect: false, returnPrevious: false,
  sections: [{ label: "General", slug: "general-settings" }, { label: "Agent", slug: "agent" }, { label: "Hooks", slug: "hooks-settings" }, { label: "Storage", slug: "storage" }],
};
const hooks = []; let hookIndex = 0; const effects = [];
const React = {
  Fragment: "Fragment", Suspense: ({ children }) => children, __reset() { hookIndex = 0; effects.length = 0; }, __flushEffects() { for (const effect of effects.splice(0)) effect(); },
  useEffect(effect) { effects.push(effect); }, useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; },
};
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__settingsPage = { React, jsx, state };

const sideEffects = ["rolldown-runtime", "experimental-feature-visibility", "dock-icon-setting-visibility", "filter"];
const mocks = Object.fromEntries(sideEffects.map((name) => [name, "export {};"]));
mocks["app-shared"] = [
  "const r=globalThis.__settingsPage;export const $3=()=>{r.state.init+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;export const ZI='app-scope';",
  "export const HX=signal=>signal==='dirty'?r.state.dirty:r.state.narrow;export const LX=()=>({set(){}});",
].join("\n");
mocks["app-initial"] = [
  "const r=globalThis.__settingsPage;export const CE='dirty';export const qe='narrow';export const ugn='local';export const Vfn=()=>r.state.host;export const Ul=section=>'/settings/'+section;",
  "export const Gv=()=>({connectedRemoteConnections:[{displayName:'Build box',hostId:'remote-1'}],selectedHostId:r.state.selectedHostId,setSelectedHostId:hostId=>{r.state.selectedHostId=hostId;r.state.hostSelections.push(hostId)}});",
  "export const i_n=()=>r.state.location;export const a_n=()=>({params:{section:r.state.location.pathname.split('/').filter(Boolean)[1]}});export const o_n=()=>(destination,options)=>r.state.navigations.push({destination,options});",
  "export const Xgn=({context,hostId})=>{r.state.routeRenders.push({context,hostId});return {type:'route-content',props:{children:'Content for '+r.state.location.pathname}}};",
].join("\n");
mocks["use-visible-settings-sections"] = "const r=globalThis.__settingsPage;export const t=()=>{r.state.init+=1};export const n=requested=>({activeSettingsSection:r.state.sections.some(s=>s.slug===requested)?requested:r.state.sections[0]?.slug??'general-settings',settingsNavigationSections:r.state.sections,visibleSettingsSections:r.state.sections,shouldRedirectToVisibleSettingsSection:r.state.redirect,shouldRenderRouteContent:r.state.shouldRender});";
mocks["settings-host-dropdown"] = "const r=globalThis.__settingsPage;export const n=()=>{r.state.init+=1};export const t=props=>({type:'host-dropdown',props});";
mocks["settings-route-state"] = "const r=globalThis.__settingsPage;export const o=()=>{r.state.init+=1};export const i=()=>r.state.returnPrevious;";
mocks["settings-unsaved-changes-dialog"] = "const r=globalThis.__settingsPage;export const n=()=>{r.state.init+=1};export const t=props=>({type:'unsaved-dialog',props});";
mocks["settings-search-documents"] = "export const settingsSearchDocuments=[{sectionSlug:'storage',terms:['files','images']}];";

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/settings-page/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "settings-page-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["SettingsPage"]);
assert.equal(state.init, 5);

function render({ flushEffects = true } = {}) { React.__reset(); const view = module.SettingsPage(); if (flushEffects) React.__flushEffects(); return view; }
function walk(value, result = []) { if (value == null || typeof value !== "object") return result; if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; } result.push(value); walk(value.props?.children, result); return result; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" "); return textContent(value.props?.children); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node).includes(label)); }

let view = render();
assert.equal(textContent(view).includes("Personal"), true);
assert.equal(textContent(view).includes("Coding"), true);
assert.equal(textContent(view).includes("Content for /settings/agent"), true);
assert.equal(walk(view).find((node) => node.type === "button" && textContent(node) === "Agent").props["aria-selected"], true);
assert.equal(state.routeRenders.at(-1).hostId, "local");

button(view, "Hooks").props.onClick();
assert.equal(state.navigations.at(-1).destination, "/settings/hooks-settings");
assert.equal(state.navigations.at(-1).options.replace, true);

const search = walk(view).find((node) => node.type === "input" && node.props?.type === "search");
search.props.onChange({ currentTarget: { value: "hooks" } });
view = render();
assert.equal(textContent(view).includes("Hooks"), true);
assert.equal(textContent(view).includes("Storage"), false);
walk(view).find((node) => node.type === "input").props.onChange({ currentTarget: { value: "missing" } });
view = render();
assert.equal(textContent(view).includes("No settings found"), true);

walk(view).find((node) => node.type === "input").props.onChange({ currentTarget: { value: "" } });
view = render();
const hostDropdown = walk(view).find((node) => node.type === "host-dropdown");
hostDropdown.props.onSelectHost("remote-1");
assert.equal(state.hostSelections.at(-1), "remote-1");

button(view, "Back").props.onClick();
assert.equal(state.navigations.at(-1).destination, "/");
state.returnPrevious = true;
view = render();
button(view, "Back").props.onClick();
assert.equal(state.navigations.at(-1).destination, -1);
state.returnPrevious = false;

state.dirty = new Set(["profile"]);
view = render();
button(view, "Storage").props.onClick();
view = render();
assert.notEqual(walk(view).find((node) => node.type === "unsaved-dialog").props.pendingNavigation, null);
assert.notEqual(state.navigations.at(-1).destination, "/settings/storage");
walk(view).find((node) => node.type === "unsaved-dialog").props.pendingNavigation();
assert.equal(state.navigations.at(-1).destination, "/settings/storage");
state.dirty = new Set();

state.narrow = true; state.location.pathname = "/settings/agent";
view = render();
assert.equal(textContent(view).includes("Back to settings"), true);
assert.equal(walk(view).some((node) => node.type === "aside"), false);
button(view, "Back to settings").props.onClick();
assert.equal(state.navigations.at(-1).destination, "/settings");
state.location.pathname = "/settings";
view = render();
assert.equal(walk(view).some((node) => node.type === "aside"), true);
assert.equal(walk(view).some((node) => node.type === "main"), false);

state.narrow = false; state.redirect = true; state.location.pathname = "/settings/hidden";
render();
assert.equal(state.navigations.at(-1).destination, "/settings/general-settings");
state.redirect = false; state.shouldRender = false; state.location.pathname = "/settings/general-settings";
view = render();
assert.equal(textContent(view).includes("Loading settings"), true);
state.sections = [];
view = render();
assert.equal(textContent(view).includes("Settings are unavailable"), true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " settings page assertions passed");
