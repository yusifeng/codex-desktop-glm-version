import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  frame: null,
  hostPointerDown: null,
  suggestion: { active: true, kind: "browser-autocomplete", query: "exa" },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
  },
};
const React = {
  useEffect(effect) { effect(); },
  useLayoutEffect(effect) { effect(); },
  useState(value) { return [typeof value === "function" ? value() : value, () => {}]; },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
};
globalThis.window = {
  clearTimeout() {},
  matchMedia() { return { matches: false }; },
  setTimeout(callback) { state.timeout = callback; return 7; },
};
globalThis.requestAnimationFrame = (callback) => { state.frame = callback; return 3; };
globalThis.cancelAnimationFrame = () => {};
globalThis.__browserAddressShortcut = { jsx, React, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "export const $3=()=>{};",
    "export const I3=()=>globalThis.__browserAddressShortcut.jsx;",
    "export const e6=()=>globalThis.__browserAddressShortcut.React;",
    "export const HG=value=>JSON.stringify(value);",
    "export const LG={safeParse(value){return value&&value.browserId&&value.source&&value.tabId?{success:true,data:value}:{success:false};}};",
    "export const VG=value=>{try{return JSON.parse(value)}catch{return null}};",
    "export const wu={getState(){return globalThis.__browserAddressShortcut.state.suggestion;}};",
    "export const G3={subscribe(_event,handler){globalThis.__browserAddressShortcut.state.hostPointerDown=handler;return ()=>{};}};",
  ].join("\n"),
  "app-initial": "export const VZ=()=>{};export const UZ=(controller,reader)=>reader(controller);",
  "browser-address-suggestion-overlay": "export const BrowserAddressSuggestionOverlay=props=>({type:'overlay',props});",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/browser-address-shortcut/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "browser-address-shortcut-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
        path: importPath.slice(8),
        namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({
        contents: mocks[module] ?? "export {};",
        loader: "js",
      }));
    },
  }],
});
const shortcut = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(shortcut), ["BrowserAddressShortcut"]);

const listeners = new Map();
const parentAttributes = new Map();
const mention = {
  attrs: { faviconUrl: "old", path: JSON.stringify({ browserId: "browser-1", pluginId: "plugin-1", source: "extension", tabId: "tab-1" }) },
  type: { name: "browserTabMention" },
};
const transaction = {
  docChanged: false,
  setMeta(key, value) { this.meta = { key, value }; return this; },
  setNodeMarkup(_position, _type, attributes) { mention.attrs = attributes; this.docChanged = true; return this; },
};
const controller = {
  attached: null,
  blurred: false,
  dispatched: null,
  focused: true,
  text: "initial",
  attachBrowserAutocompleteRuntime(runtime) { this.attached = runtime; },
  eventEmitter: {
    addListener(event, listener) { listeners.set(event, listener); },
    emit(event) { listeners.get(event)?.(); },
    removeListener(event) { listeners.delete(event); },
  },
  getBrowserAutocompleteRuntime() { return null; },
  setText(value) { this.text = value; },
  view: {
    dispatch(next) { controller.dispatched = next; },
    dom: {
      isConnected: true,
      parentElement: {
        removeAttribute(name) { parentAttributes.delete(name); },
        setAttribute(name, value) { parentAttributes.set(name, value); },
      },
      blur() { controller.blurred = true; },
    },
    hasFocus() { return controller.focused; },
    isDestroyed: false,
    state: {
      doc: { descendants(visitor) { visitor(mention, 4); } },
      tr: transaction,
    },
  },
};

const view = shortcut.BrowserAddressShortcut({
  browserConversationId: "conversation-1",
  composerController: controller,
  composerId: "composer-1",
  placement: "top",
});
assert.equal(view.type, "overlay");
assert.equal(view.props.suggestionState.query, "exa");
assert.equal(view.props.composerController, controller);
assert.equal(typeof controller.attached.updateMention, "function");
assert.equal(typeof state.hostPointerDown, "function");
controller.attached.setMentionPath(mention.attrs.path);
assert.equal(controller.attached.hasStandaloneMention(), true);
state.hostPointerDown();
assert.equal(controller.blurred, true);
controller.focused = false;
controller.attached.setReducedMotion(true);
controller.attached.dismissStandaloneMentionOnBlur();
state.frame();
assert.equal(controller.text, "");
const updated = controller.attached.updateMention({
  browserId: "browser-1",
  faviconUrl: "new",
  pluginId: "plugin-1",
  snapshot: { title: "Example" },
  source: "extension",
  tabId: "tab-1",
});
assert.equal(updated, true);
assert.equal(mention.attrs.faviconUrl, "new");
assert.deepEqual(JSON.parse(mention.attrs.path).snapshot, { title: "Example" });
assert.deepEqual(controller.dispatched.meta, { key: "addToHistory", value: false });
let cleaned = 0;
controller.attached.trackMentionMetadata(() => { cleaned += 1; })();
assert.equal(cleaned, 1);
state.suggestion = null;
assert.equal(shortcut.BrowserAddressShortcut({ composerController: controller, composerId: "composer-2" }), null);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " browser address shortcut assertions passed");
