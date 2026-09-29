import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storage = new Map();
const state = { colors: [], initialized: 0, kinds: [], queries: [], selections: [] };
globalThis.localStorage = {
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key, value) { storage.set(key, value); },
};
globalThis.HTMLElement = class HTMLElement {};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
let nextId = 0;
const React = {
  Fragment: "Fragment",
  useEffect(effect) { effect(); },
  useId() { nextId += 1; return "symbol-" + nextId; },
  useMemo(factory) { return factory(); },
  useRef(value) { return { current: value }; },
  useState(value) {
    let current = typeof value === "function" ? value() : value;
    return [current, (next) => { current = typeof next === "function" ? next(current) : next; }];
  },
};
globalThis.__symbolBrowser = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-initial": "export {};",
  "color-palette": "export {};",
  "app-shared": [
    "const runtime=globalThis.__symbolBrowser;",
    "export const $3=()=>{runtime.state.initialized+=1};",
    "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const n4=()=>({locale:'en',formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/symbol-browser/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "symbol-browser-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["SymbolBrowser"]);
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
function render(overrides = {}) {
  return module.SymbolBrowser({
    capabilities: { emoji: {}, icons: {} },
    kind: "emoji",
    onKindChange(kind) { state.kinds.push(kind); },
    onQueryChange(query) { state.queries.push(query); },
    onSelect(selection) { state.selections.push(selection); },
    query: "",
    ...overrides,
  });
}
function choiceButtons(view) {
  return walk(view).filter((node) => node.type === "button" && node.props?.["data-symbol-choice"] != null);
}

const emojiSearch = render({ capabilities: { emoji: {} }, query: "rocket" });
assert.equal(emojiSearch.props["data-symbol-browser"], "");
assert.equal(textContent(emojiSearch).includes("Results"), true);
const rocket = choiceButtons(emojiSearch).find((button) => button.props["data-symbol-choice"] === "🚀");
assert.equal(rocket.props["aria-label"], "rocket");
rocket.props.onClick();
assert.deepEqual(state.selections.at(-1), {
  kind: "emoji",
  metadata: { categoryId: "Travel & Places", keywords: ["space", "rocket"], label: "rocket" },
  source: "pointer",
  value: "🚀",
});
assert.equal(JSON.parse(storage.get("emoji-recent-v1"))[0], "🚀");

const allowed = render({
  capabilities: { emoji: { allowedEmojis: ["🔥", "🚀"], getEmojiLabel: (emoji) => emoji === "🔥" ? "Hot" : "Launch", selectedEmojis: ["🔥"] } },
  query: "hot",
});
assert.equal(choiceButtons(allowed).length, 1);
assert.equal(choiceButtons(allowed)[0].props["data-symbol-choice"], "🔥");
assert.equal(choiceButtons(allowed)[0].props["aria-pressed"], true);

const iconView = render({
  capabilities: { icons: { allowedIcons: ["function", "terminal"], color: "blue", onColorChange: (color) => state.colors.push(color), selectedIcon: "terminal" } },
  kind: "icon",
  query: "code",
});
assert.deepEqual(choiceButtons(iconView).map((button) => button.props["data-symbol-choice"]), ["function", "terminal"]);
assert.equal(choiceButtons(iconView)[1].props["aria-pressed"], true);
const red = walk(iconView).find((node) => node.type === "button" && node.props?.["aria-label"] === "red");
red.props.onClick();
assert.equal(state.colors.at(-1), "red");

const mixed = render();
const tabs = walk(mixed).filter((node) => node.type === "button" && (textContent(node) === "Emoji" || textContent(node) === "Icons"));
tabs[1].props.onClick();
assert.equal(state.kinds.at(-1), "icon");
const search = walk(mixed).find((node) => node.type === "input");
search.props.onChange({ currentTarget: { value: "wave" } });
assert.equal(state.queries.at(-1), "wave");
assert.equal(walk(mixed).some((node) => node.type === "h2" && textContent(node) === "Recently used"), true);

const empty = render({ capabilities: { emoji: {} }, query: "no-symbol-can-match-this" });
assert.equal(textContent(empty).includes("No matching emoji"), true);
const beforeDisabledSelection = state.selections.length;
const disabled = render({ capabilities: { emoji: { allowedEmojis: ["👍"] } }, disabled: true });
choiceButtons(disabled)[0].props.onClick();
assert.equal(state.selections.length, beforeDisabledSelection);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " symbol browser assertions passed");
