import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__browserAddressOverlayTest = { cleanups: [], effects: [], listeners: new Map() };
state.React = {
  useState: value => [typeof value === "function" ? value() : value, () => {}],
  useCallback: value => value,
  useSyncExternalStore(subscribe, getSnapshot) { state.cleanups.push(subscribe(() => {})); return getSnapshot(); },
  useLayoutEffect(effect) { const cleanup = effect(); if (typeof cleanup === "function") state.cleanups.push(cleanup); },
  useEffect(effect) { const cleanup = effect(); if (typeof cleanup === "function") state.cleanups.push(cleanup); },
};
state.jsx = {
  Fragment: Symbol("Fragment"),
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.requestAnimationFrame = callback => { callback(); return 1; };
globalThis.document = { getElementById: () => null };

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/browser-address-suggestion-overlay/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\/popup$/ }, () => ({ path: path.join(ROOT, "src/renderer/popup/index.ts") }));
    build.onResolve({ filter: /^@rchunk\// }, ({ path: request }) => ({ path: request.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: request }) => ({ loader: "js", contents: request === "app-shared" ? `
      export const I3=()=>globalThis.__browserAddressOverlayTest.jsx;
      export const e6=()=>globalThis.__browserAddressOverlayTest.React;
      export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});
    ` : request === "app-initial" ? `export const _=props=>props.children;` : "export {};" }));
  } }],
});
const overlay = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

const attributes = new Map();
const dom = {
  getAttribute: name => attributes.get(name) ?? null,
  setAttribute: (name, value) => attributes.set(name, value),
  removeAttribute: name => attributes.delete(name),
  addEventListener: (name, listener) => state.listeners.set(name, listener),
  removeEventListener: name => state.listeners.delete(name),
};
const inserted = [];
const composerController = {
  view: { dom, state: {} },
  suggestionState: { active: true, kind: "browser-autocomplete", query: "exa" },
  getBrowserAutocompleteRuntime: () => ({}),
  insertBrowserTabMention: (mention, editorState) => inserted.push({ mention, editorState }),
  eventEmitter: { addListener() {}, removeListener() {} },
};
const suggestions = [
  { id: "exact", content: "Example", destinationURL: "https://example.com", description: "Example", textMatch: "exact", canBeDefault: true },
  { id: "prefix", content: "Example docs", destinationURL: "https://example.com/docs", textMatch: "prefix" },
];
const tree = overlay.BrowserAddressSuggestionOverlay({
  autocompleteService: {}, browserConversationId: "conversation-1", composerController, composerId: "composer-1", suggestionState: composerController.suggestionState, suggestions,
});
assert.equal(tree.props.role, "listbox");
assert.match(tree.props.id, /^composer-browser-address-suggestions-/);
assert.equal(tree.props.children.length, 2);
assert.equal(tree.props.children[0].props.children[0].props["aria-selected"], true);
assert.equal(attributes.get("role"), "combobox");
assert.equal(attributes.get("aria-autocomplete"), "list");
assert.equal(attributes.get("aria-expanded"), "true");
assert.equal(attributes.get("aria-controls"), tree.props.id);
tree.props.children[0].props.children[0].props.onClick();
assert.equal(inserted.length, 1);
assert.equal(inserted[0].mention.snapshot.url, "https://example.com");
let prevented = 0, stopped = 0;
state.listeners.get("keydown")({ key: "ArrowDown", preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
assert.equal(prevented, 1);
assert.equal(stopped, 1);
for (const cleanup of state.cleanups.reverse()) cleanup?.();
assert.equal(attributes.has("role"), false);
console.log("browser address suggestion overlay assertions passed");
