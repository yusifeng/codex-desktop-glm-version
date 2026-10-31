import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const importBundle = async (entry, stubs = []) => {
  const output = await build({
    entryPoints: [new URL(entry, import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false,
    plugins: [{ name: "runtime-stubs", setup(api) {
      for (const [index, [filter, contents]] of stubs.entries()) {
        const namespace = `stub-${index}`;
        api.onResolve({ filter }, ({ path }) => ({ path, namespace }));
        api.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: "js" }));
      }
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
};

const find = await importBundle("../src/main/main-app/browser-sidebar/find-in-page.ts");
let requestId = 10;
const findCalls = [];
const webContents = {
  isDestroyed: () => false,
  findInPage: (query, options) => { findCalls.push([query, options]); return requestId++; },
  stopFindInPage: (action) => findCalls.push(["stop", action]),
};
const owner = { isDestroyed: () => false };
const messages = [];
const windowManager = { sendMessageToWebContents: (_target, message) => messages.push(message) };
const tab = { browserTabId: "tab", findState: find.emptyFindState(), page: { view: { webContents } } };
equal(tab.findState, { activeMatchOrdinal: 0, matches: 0, query: "", requestId: null });
find.openFindInPage(windowManager, owner, "conversation", tab);
equal(messages[0].command.type, "open-find");
equal(messages[1].type, "browser-sidebar-find-state");
find.updateFindQuery(windowManager, owner, "conversation", tab, "needle");
equal(tab.findState.requestId, 10);
equal(findCalls[0], ["needle", undefined]);
find.findNext(tab);
equal(findCalls[1], ["needle", { findNext: false, forward: true }]);
find.findPrevious(tab);
equal(findCalls[2], ["needle", { findNext: false, forward: false }]);
find.applyFindResult(windowManager, owner, "conversation", tab, { activeMatchOrdinal: 2, finalUpdate: true, matches: 5, requestId: 12 });
equal(tab.findState.matches, 5);
equal(tab.findState.requestId, null);
find.closeFindInPage(windowManager, owner, "conversation", tab);
equal(findCalls.at(-1), ["stop", "clearSelection"]);
equal(tab.findState, find.emptyFindState());

const shortcuts = await importBundle("../src/main/main-app/browser-sidebar/browser-shortcuts.ts", [
  [/^@chunk\/shared$/, `
    export const Et = [];
    export const Ot = () => ({ kind: "webview", allowsKeyRepeat: true });
    export const At = ({ commandId }) => ["CmdOrCtrl+" + commandId];
    export const jt = ({ commandId }) => commandId === "closeTab" ? ["CmdOrCtrl+W"] : [];
  `],
  [/^\.\/app-shell-keyboard$/, `
    const primary = (event) => process.platform === "darwin" ? event.meta === true : event.control === true;
    export const matchesAccelerator = (event, accelerator) => event.type === "keyDown" && primary(event) && accelerator.endsWith(event.key === "." ? "." : event.key.toUpperCase());
    export const toDomKeyboardEvent = (event) => ({ altKey: !!event.alt, code: event.code, ctrlKey: !!event.control, key: event.key, metaKey: !!event.meta, repeat: !!event.isAutoRepeat, shiftKey: !!event.shift });
    export const matchesDomAcceleratorEvent = (event, accelerator) => accelerator.endsWith(event.key.toUpperCase());
    export const actionForEvent = (event) => event.key.toLowerCase() === "w" ? { type: "close-active-app-shell-tab" } : null;
  `],
]);
const primary = process.platform === "darwin" ? { control: false, meta: true } : { control: true, meta: false };
const input = (key, code = `Key${key.toUpperCase()}`) => ({ type: "keyDown", code, key, alt: false, ...primary, shift: false, isAutoRepeat: false });
const modes = [];
let captures = 0;
let prevented = 0;
const handler = shortcuts.createBrowserSidebarKeyboardHandler({
  captureTextSelection: () => { captures += 1; },
  closeBrowserTab: () => {},
  getCanCloseBrowserTab: () => false,
  getInteractionMode: () => "browse",
  isCommentModeAvailable: () => true,
  owner: { focus() {} },
  runCommandInOwner() {},
  setInteractionMode: (...args) => modes.push(args),
});
handler({ preventDefault: () => { prevented += 1; } }, input(".", "Period"));
equal(prevented, 1, "wrapper event and keyboard input remain separate");
equal(captures, 1);
equal(modes, [["comment", "keyboard-shortcut"]]);
const accelerators = shortcuts.ownerCommandAcceleratorsFromKeymap({});
equal(Array.isArray(accelerators.closeTab), true);
equal("focusTab9" in accelerators, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/find-in-page.js")'), true);
equal(main.includes('require("./main-app/browser-sidebar/browser-shortcuts.js")'), true);
for (const oldOwner of ["function oq(", "function HGe(", "function mq("]) equal(main.includes(oldOwner), false, `${oldOwner} is removed`);

console.log(`${assertions} main browser find/shortcuts runtime assertions passed`);
