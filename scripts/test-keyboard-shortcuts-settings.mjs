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
  codexLocal: true,
  gate: true,
  initialized: 0,
  keymap: {
    bindings: [
      { command: "newTask", accelerator: "Cmd+N" },
      { command: "openSearch", accelerator: "Cmd+K" },
    ],
  },
  mutations: [],
  platform: "macOS",
  settings: {
    externalBrowserLinkShortcut: "primary",
    primaryNumberShortcutTarget: "tabs",
  },
  settingsWrites: [],
  workLocal: false,
};
const commands = [
  {
    id: "openSearch",
    kind: "webview",
    commandMenuGroupKey: "navigation",
    title: "Open search",
    description: "Search chats",
    order: 3,
  },
  {
    id: "newTask",
    kind: "webview",
    commandMenuGroupKey: "general",
    title: "New task",
    description: "Start a new task",
    order: 1,
  },
  {
    id: "openBrowserTab",
    kind: "webview",
    commandMenuGroupKey: "browser",
    title: "Open browser tab",
    description: "Open a browser tab",
    order: 4,
    defaultAccelerators: ["Cmd+Shift+B"],
  },
  {
    id: "hiddenCommand",
    kind: "webview",
    commandMenuGroupKey: "general",
    title: "Hidden",
    description: "Unavailable command",
    order: 2,
    hidden: true,
  },
];
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
globalThis.__keyboardShortcutsSettings = { React, commands, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__keyboardShortcutsSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};export const FX=()=>{};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const LX=()=>({scope:true});export const ZI='app-scope';export const Xp=runtime.commands;",
    "export const HX=signal=>signal==='keymap'?runtime.state.keymap:signal==='codex-local'?runtime.state.codexLocal:signal==='work-local'?runtime.state.workLocal:{};",
    "export const cz={externalBrowserLinkShortcut:{key:'externalBrowserLinkShortcut',default:'unassigned'},primaryNumberShortcutTarget:{key:'primaryNumberShortcutTarget',default:'tabs'}};",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__keyboardShortcutsSettings;",
    "export const $9='keymap';export const Fln='work-local';export const wEt='registered';export const wln='codex-local';",
    "export const E6t=()=>({platform:runtime.state.platform});export const T6t=()=>{};export const Vcn=()=>{};",
    "export const Kcn=setting=>runtime.state.settings[setting.key??setting];export const Ucn=async(_scope,setting,value)=>{runtime.state.settings[setting.key]=value;runtime.state.settingsWrites.push({key:setting.key,value})};",
    "export const iun=name=>({isPending:false,mutateAsync:async input=>{runtime.state.mutations.push({name,input});return runtime.state.keymap}});",
    "export const ofn=()=>runtime.state.gate;",
    "export const ret=(commandId,keymap,platform)=>keymap.bindings.filter(binding=>binding.command===commandId).map(binding=>({accelerator:binding.accelerator,label:binding.accelerator.split('+').map(part=>platform==='macOS'?({Cmd:'⌘',Ctrl:'⌃',Alt:'⌥',Shift:'⇧'}[part]??part):part==='Cmd'?'Ctrl':part).join(platform==='macOS'?'':'+')}));",
  ].join("\n"),
  "app-primary":
    "export const xm=()=>{};export const cm=props=>({type:'shortcut-capture',props});",
  "keyboard-shortcuts-gate":
    "export const n=()=>{};export const t='keyboard-shortcuts';",
  "command-messages":
    "export const r=()=>{};export const t=command=>({title:command.title,description:command.description});",
  "keyboard-shortcuts-search-input":
    "export const n=()=>{};export const t=props=>({type:'shortcut-search',props:{...props,children:props.trailingContent}});",
  "keyboard-shortcut-command-order":
    "export const n=()=>{};export const r=()=>{};export const a=command=>command.hidden!==true;export const t=(left,right)=>left.order-right.order;",
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/keyboard-shortcuts-settings/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "keyboard-shortcuts-settings-mocks",
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
assert.deepEqual(Object.keys(module), ["KeyboardShortcutsSettings"]);
assert.equal(state.initialized, 1);

function render() {
  hookIndex = 0;
  return module.KeyboardShortcutsSettings();
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
function rows(view) {
  return walk(view).filter((node) => node.props?.["data-command-id"]);
}
function captures(view, commandId) {
  const row = rows(view).find(
    (node) => node.props["data-command-id"] === commandId,
  );
  return walk(row).filter((node) => node.type === "shortcut-capture");
}

let view = render();
assert.equal(
  find(view, (node) => node.type === "h1").props.children,
  "Keyboard shortcuts",
);
assert.deepEqual(
  rows(view).map((row) => row.props["data-command-id"]),
  ["newTask", "openSearch", "openBrowserTab"],
);
assert.deepEqual(
  walk(view)
    .filter((node) => node.props?.["data-shortcut-group"])
    .map((node) => node.props["data-shortcut-group"]),
  ["general", "navigation", "browser"],
);
assert.equal(captures(view, "newTask")[0].props.acceleratorLabel, "⌘N");
assert.equal(captures(view, "openBrowserTab")[0].props.acceleratorLabel, "⌘⇧B");

const search = find(view, (node) => node.type === "shortcut-search");
search.props.onValueChange("browser");
view = render();
assert.deepEqual(
  rows(view).map((row) => row.props["data-command-id"]),
  ["openBrowserTab"],
);
find(view, (node) => node.type === "shortcut-search").props.onValueChange(
  "missing",
);
view = render();
assert.equal(
  find(view, (node) => node.props?.role === "status").props.children,
  "No matching shortcuts",
);
find(view, (node) => node.type === "shortcut-search").props.onValueChange("");

view = render();
const searchToggle = find(
  view,
  (node) => node.props?.["aria-label"] === "Search by keystrokes",
);
searchToggle.props.onClick();
view = render();
const keySearch = find(view, (node) => node.type === "shortcut-search");
assert.equal(keySearch.props.isSearchingByKeystrokes, true);
let prevented = false;
keySearch.props.onKeyDown({
  key: "K",
  metaKey: true,
  preventDefault: () => {
    prevented = true;
  },
  stopPropagation() {},
});
assert.equal(prevented, true);
view = render();
assert.deepEqual(
  rows(view).map((row) => row.props["data-command-id"]),
  ["openSearch"],
);

find(view, (node) => node.type === "shortcut-search").props.onValueChange("");
find(
  view,
  (node) => node.props?.["aria-label"] === "Search by keystrokes",
).props.onClick();
view = render();
let browserCapture = captures(view, "openBrowserTab")[0];
browserCapture.props.onStartCapture("replace");
browserCapture.props.onCapture("Cmd+N");
view = render();
browserCapture = captures(view, "openBrowserTab")[0];
assert.equal(browserCapture.props.conflict, "New task");
assert.equal(state.mutations.length, 0);
browserCapture.props.onCapture("Cmd+Shift+P");
await Promise.resolve();
assert.deepEqual(state.mutations.at(-1), {
  name: "set-codex-command-keybinding",
  input: {
    commandId: "openBrowserTab",
    update: {
      type: "replace",
      previousAccelerator: "Cmd+Shift+B",
      accelerator: "Cmd+Shift+P",
    },
  },
});

view = render();
captures(view, "newTask")[0].props.onClear();
await Promise.resolve();
assert.deepEqual(state.mutations.at(-1).input.update, {
  type: "remove",
  accelerator: "Cmd+N",
});

view = render();
const externalSelect = find(
  view,
  (node) => node.props?.["aria-label"] === "External browser link shortcut",
);
assert.deepEqual(
  externalSelect.props.children.map((option) => option.props.children),
  ["Unassigned", "⌘+Click", "⌥+Click", "⇧⌘+Click"],
);
await externalSelect.props.onChange({ currentTarget: { value: "alt" } });
assert.deepEqual(state.settingsWrites.at(-1), {
  key: "externalBrowserLinkShortcut",
  value: "alt",
});
const numberSelect = find(
  view,
  (node) => node.props?.["aria-label"] === "Number shortcut target",
);
await numberSelect.props.onChange({ currentTarget: { value: "sidebar" } });
assert.deepEqual(state.settingsWrites.at(-1), {
  key: "primaryNumberShortcutTarget",
  value: "sidebar",
});

const reset = find(
  view,
  (node) =>
    node.type === "button" && node.props?.children === "Reset all to defaults",
);
reset.props.onClick();
await Promise.resolve();
assert.equal(state.mutations.at(-1).name, "reset-codex-command-keybindings");

state.platform = "windows";
view = render();
assert.equal(captures(view, "newTask")[0].props.acceleratorLabel, "Ctrl+N");
assert.deepEqual(
  find(
    view,
    (node) => node.props?.["aria-label"] === "External browser link shortcut",
  ).props.children.map((option) => option.props.children),
  ["Unassigned", "Ctrl+Click", "Alt+Click", "Ctrl+Shift+Click"],
);

state.keymap = null;
view = render();
assert.equal(
  find(view, (node) => node.props?.role === "status").props.children,
  "Loading shortcuts…",
);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " keyboard shortcuts settings assertions passed");
