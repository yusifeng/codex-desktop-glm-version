import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/browser-use/autocomplete.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const declaration = (name) => ast.body.find((node) =>
  (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") && node.id?.name === name,
);
const slice = (name) => {
  const node = declaration(name);
  assert.ok(node, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(node.start, node.end);
};

const projectMenuItems = Function(`${slice("projectMenuItems")}; return projectMenuItems;`)();
equal(projectMenuItems([{ type: "normal", label: "Open" }, { type: "separator" }]), [
  { actionable: undefined, checked: undefined, commandId: undefined, enabled: undefined, groupId: undefined, label: "Open", submenu: undefined, type: "normal" },
  { actionable: undefined, checked: undefined, commandId: undefined, enabled: undefined, groupId: undefined, label: undefined, submenu: undefined, type: "separator" },
]);
equal(projectMenuItems([{ type: "unknown" }]), null);
equal(projectMenuItems([{ type: "submenu", submenu: [{ type: "unknown" }] }]), null);

let scopeUses = 0;
let scopeDisposals = 0;
const usingScope = () => ({
  u(value) { scopeUses += 1; return value; },
  e: undefined,
  d() { scopeDisposals += 1; },
});
const managerPrelude = [
  "const DATA_HTML_PATTERN = /^data:text\\/html(?:[;,]|$)/i;",
  "const FAVICON_CACHE_LIMIT = 128;",
  slice("faviconKey"),
  slice("projectMatch"),
  slice("projectResultWithoutFavicons"),
  slice("projectResultWithFavicons"),
].join("\n");
const AutocompleteManager = Function(
  "usingScope",
  `${managerPrelude}\n${slice("AutocompleteManager")}; return AutocompleteManager;`,
)(usingScope);

const match = (url, extra = {}) => ({
  contents: "title",
  contentsClass: [],
  description: "desc",
  descriptionClass: [],
  destinationURL: url,
  fillIntoEdit: url,
  inlineAutocompletion: "",
  ...extra,
});
const controller = {
  result: { defaultMatch: null, done: true, matches: [match("https://a.test"), match("https://a.test")] },
  listeners: new Map(),
  on(event, listener) { this.listeners.set(event, listener); return this; },
  start() {}, stop() {}, resetSession() {}, accept() {}, recordNavigation() {}, deleteMatch() {}, destroy() {},
};
let faviconLoads = 0;
const manager = new AutocompleteManager(() => controller, () => null, async () => {
  faviconLoads += 1;
  return "data:image/png;base64,a";
});
const owner = { id: 1, once() {} };
const resultPayloads = [];
let resultStreamDisposals = 0;
const resultStream = (payload) => { resultPayloads.push(payload); return Promise.resolve(); };
resultStream.dup = () => resultStream;
resultStream.onRpcBroken = () => {};
resultStream[Symbol.dispose] = () => { resultStreamDisposals += 1; };
manager.start(owner, {
  browserTabId: "tab",
  conversationId: "conversation",
  editingSessionId: "edit",
  input: { text: "a" },
  requestId: "request",
  surface: "browser",
}, resultStream);
await Promise.resolve();
await Promise.resolve();
await Promise.resolve();
await new Promise((resolve) => setImmediate(resolve));
equal(faviconLoads, 1);
equal(resultPayloads.length, 2);
equal(resultPayloads.at(-1).result.matches.map((entry) => entry.faviconDataURL), [
  "data:image/png;base64,a",
  "data:image/png;base64,a",
]);
equal(scopeUses, 2);
equal(scopeDisposals, 2);

controller.result = {
  defaultMatch: match("data:text/html,<h1>x</h1>"),
  done: true,
  matches: [match("data:text/html,<h1>x</h1>"), match("https://safe.test")],
};
manager.start(owner, {
  browserTabId: "tab",
  conversationId: "conversation",
  editingSessionId: "edit-2",
  input: { text: "" },
  requestId: "request-2",
  surface: "browser",
}, resultStream);
equal(resultPayloads.at(-1).result.matches.map((entry) => entry.destinationURL), ["https://safe.test"]);
equal(resultPayloads.at(-1).result.defaultMatch.destinationURL, "https://safe.test");

class EventEmitterBase {}
let menuStreamDisposals = 0;
const ExtensionActionMenus = Function(
  "getDesktopFeatureAvailability",
  "projectMenuItems",
  "usingScope",
  `${slice("ExtensionActionMenus")}; return ExtensionActionMenus;`,
)(() => ({ browserExtensions: true }), projectMenuItems, usingScope);
const originListeners = new Map();
const origin = {
  isDestroyed: () => false,
  once: (event, listener) => originListeners.set(event, listener),
  removeListener: (event) => originListeners.delete(event),
};
const webListeners = new Map();
let closedMenuId = null;
const webContents = {
  isDestroyed: () => false,
  beginExtensionActionContextMenu: () => ({ status: "opened", menuId: "menu", items: [{ type: "normal", commandId: "open" }] }),
  closeExtensionActionContextMenu: (menuId) => { closedMenuId = menuId; },
  executeExtensionActionContextMenuCommand: () => true,
  on: (event, listener) => webListeners.set(event, listener),
  once: (event, listener) => webListeners.set(event, listener),
  removeListener: (event) => webListeners.delete(event),
};
const menuStream = () => Promise.resolve();
menuStream.dup = () => menuStream;
menuStream.onRpcBroken = () => {};
menuStream[Symbol.dispose] = () => { menuStreamDisposals += 1; };
const menus = new ExtensionActionMenus(origin);
equal(menus.begin(webContents, { actionId: "action", browserTabId: "tab", conversationId: "conversation" }, menuStream, false).status, "opened");
menus.close({ browserTabId: "tab", conversationId: "conversation", menuId: "menu" });
equal(menuStreamDisposals, 1);
equal(closedMenuId, "menu");

equal(source.includes("requestCache.set(key, pending);"), true);
equal(source.indexOf("requestCache.set(key, pending);") > source.indexOf("if (ownerCache != null)"), true);
equal(source.includes("eventStream[Symbol.dispose]();"), true);
equal(source.includes('import { en as usingScope } from "@chunk/bootstrap"'), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(
  main.includes('const { AutocompleteManager: bke, AutocompleteService: Cke, ExtensionActionMenus: wke } = require("./main-app/browser-use/autocomplete.js");'),
  true,
);
equal(main.includes("bke = class"), false);
equal(main.includes("var Cke = class"), false);
equal(main.includes("wke = class"), false);
equal(main.includes("new wke(n)"), true);
equal(main.includes("new bke("), true);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("browserAutocomplete: new Cke("), true);

console.log(`${assertions} main browser-use autocomplete owner assertions passed`);
