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
  avatarDirectory: "/Users/test/.codex/pets",
  avatars: [
    {
      id: "codex",
      displayName: "Codex",
      description: "Classic companion",
      type: "builtin",
    },
    {
      id: "custom:pixel",
      displayName: "Pixel",
      description: "Custom companion",
      type: "custom",
      upgradeDirectoryPath: "/pets/pixel",
    },
  ],
  bridgeMessages: [],
  gate: true,
  initialized: 0,
  isError: false,
  isLoading: false,
  navigations: [],
  overlayOpen: false,
  selectedAvatarId: "codex",
  selectionWrites: [],
  settings: { petSize: 144, petVisible: true, selectedAvatarId: "codex" },
  settingsWrites: [],
};
const React = {
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState))
      hookState[index] = typeof initial === "function" ? initial() : initial;
    return [
      hookState[index],
      (next) => {
        hookState[index] =
          typeof next === "function" ? next(hookState[index]) : next;
      },
    ];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
globalThis.__petsSettingsRoute = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__petsSettingsRoute;",
    "export const $3=()=>{runtime.state.initialized+=1};export const FX=()=>{};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const $R={petSize:{key:'petSize',default:144},petVisible:{key:'petVisible',default:true},selectedAvatarId:{key:'selectedAvatarId',default:'codex'}};",
    "export const G3={dispatchMessage:(name,payload)=>runtime.state.bridgeMessages.push({name,payload})};export const HX=()=>runtime.state.overlayOpen;",
    "export const LX=()=>({scope:true});export const ZI='app-scope';export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__petsSettingsRoute;",
    "export const I8t='avatar-overlay-open';export const Vcn=()=>{};export const ofn=()=>runtime.state.gate;",
    "export const Kcn=setting=>runtime.state.settings[setting.key];export const Ucn=async(_scope,setting,value)=>{runtime.state.settings[setting.key]=value;runtime.state.settingsWrites.push({key:setting.key,value})};",
    "export const bc=options=>({selectedAvatar:options.find(option=>option.id===runtime.state.selectedAvatarId)??options[0]??{id:'codex'},setSelectedAvatarId:id=>{runtime.state.selectedAvatarId=id;runtime.state.selectionWrites.push(id)}});",
    "export const h2=()=>input=>runtime.state.navigations.push(input);",
  ].join("\n"),
  "app-primary": "export {};",
  controls: "export const n=()=>{};",
  "avatar-mascot-button":
    "export const m=()=>{};export const r=()=>{};export const t=props=>({type:'mascot',props});",
  "codex-pet-assets":
    "export const n=()=>{};export const t={codex:'codex-asset'};",
  "settings-loading-row":
    "export const n=()=>{};export const t=props=>({type:'settings-loading-row',props});",
  "recommended-skill-statsig-overrides": "export const n=()=>{};",
  "use-avatar-options": [
    "const runtime=globalThis.__petsSettingsRoute;",
    "export const t=()=>{};export const n=()=>({avatarDirectory:runtime.state.avatarDirectory,avatarOptions:runtime.state.avatars,isError:runtime.state.isError,isLoading:runtime.state.isLoading});",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/pets-settings-route/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "pets-settings-route-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: module }) => ({
            contents: mocks[module] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
assert.deepEqual(Object.keys(module), ["PetsSettingsRoute"]);
assert.equal(state.initialized, 1);

function render() {
  hookIndex = 0;
  return module.PetsSettingsRoute();
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function find(view, predicate) {
  return walk(view).find(predicate);
}
function findAll(view, predicate) {
  return walk(view).filter(predicate);
}
function petTile(view, id) {
  return find(view, (node) => node.props?.["data-pet-id"] === id);
}

let view = render();
assert.equal(find(view, (node) => node.type === "h1").props.children, "Pets");
assert.equal(
  find(view, (node) => node.props?.["aria-label"] === "My pets") != null,
  true,
);
assert.deepEqual(
  findAll(view, (node) => node.props?.["data-pet-id"]).map(
    (node) => node.props["data-pet-id"],
  ),
  ["mini", "codex", "custom:pixel"],
);
assert.equal(
  find(view, (node) => node.props?.["aria-label"] === "Pet preview") != null,
  true,
);
assert.equal(
  find(view, (node) => node.type === "mascot").props.source.assetRef,
  "codex",
);

petTile(view, "custom:pixel").props.children[0].props.onClick();
assert.deepEqual(state.selectionWrites, ["custom:pixel"]);
view = render();
assert.equal(
  petTile(view, "custom:pixel").props.children[0].props["aria-pressed"],
  true,
);

petTile(view, "mini").props.children.props.onClick();
await Promise.resolve();
assert.deepEqual(state.settingsWrites.at(-1), {
  key: "petVisible",
  value: false,
});
view = render();
assert.equal(
  find(view, (node) => node.props?.["aria-label"] === "Pet preview"),
  undefined,
);

petTile(view, "codex").props.children[0].props.onClick();
await Promise.resolve();
assert.equal(state.selectionWrites.at(-1), "codex");
assert.deepEqual(state.settingsWrites.at(-1), {
  key: "petVisible",
  value: true,
});
view = render();

const size = find(view, (node) => node.props?.["aria-label"] === "Pet size");
size.props.onInput({ currentTarget: { value: "180" } });
await Promise.resolve();
assert.deepEqual(state.settingsWrites.at(-1), { key: "petSize", value: 180 });
view = render();
find(
  view,
  (node) => node.type === "button" && node.props?.children === "Reset size",
).props.onClick();
await Promise.resolve();
assert.deepEqual(state.settingsWrites.at(-1), { key: "petSize", value: 144 });

find(
  view,
  (node) => node.type === "button" && node.props?.children === "Show pet",
).props.onClick();
assert.deepEqual(state.bridgeMessages.at(-1), {
  name: "avatar-overlay-open",
  payload: {},
});
find(
  view,
  (node) => node.type === "button" && node.props?.children === "Create pet",
).props.onClick();
assert.equal(state.navigations.at(-1).prefillComposerMode, "local");
find(
  view,
  (node) => node.props?.["aria-label"] === "Update Pixel",
).props.onClick();
assert.equal(state.navigations.at(-1).prefillPrompt.includes("Pixel"), true);

state.isLoading = true;
view = render();
assert.equal(
  find(view, (node) => node.type === "settings-loading-row").props.children,
  "Loading custom pets…",
);
state.isLoading = false;
state.isError = true;
view = render();
assert.equal(
  find(view, (node) => node.props?.role === "alert").props.children,
  "Unable to load custom pets",
);
state.isError = false;
state.avatars = [];
view = render();
assert.equal(
  find(view, (node) => node.props?.role === "status").props.children,
  "No pets available",
);

state.avatars = [{ id: "codex", displayName: "Codex", type: "builtin" }];
state.gate = false;
state.settings.petVisible = true;
view = render();
assert.equal(
  find(view, (node) => node.props?.["aria-label"] === "Pick a pet") != null,
  true,
);
assert.equal(petTile(view, "mini"), undefined);
assert.equal(
  find(
    view,
    (node) => node.type === "button" && node.props?.children === "Create",
  ) != null,
  true,
);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " pets settings route assertions passed");
