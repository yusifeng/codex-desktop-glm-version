import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const importBundle = async (entry, stubs) => {
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

globalThis.__siteFetches = [];
globalThis.__siteResponse = { ok: true, status: 200, body: { feature_status: { agent: true } } };
const commentStatus = await importBundle("../src/main/main-app/browser-sidebar/comment-site-status.ts", [
  [/^@chunk\/shared$/, `
    const schema = () => ({ parse(value) { return value; } });
    export const wf = () => schema(); export const Ef = () => schema(); export const Of = () => schema(); export const gf = () => schema();
  `],
  [/^@chunk\/logger$/, `export const memoizedTaggedLogger = () => () => ({ warning() {} });`],
  [/^@chunk\/bootstrap$/, `
    export const Tt = "desktop"; export const Et = "dev"; export const Kt = "prod";
    export const vt = async (request) => { globalThis.__siteFetches.push(request); const value = globalThis.__siteResponse; return { ok: value.ok, status: value.status, text: async () => JSON.stringify(value.body) }; };
  `],
]);
let now = 1000;
const lookup = commentStatus.createCommentModeSiteStatus({ appServerClient: {}, now: () => now });
equal(lookup.cachedCommentModeBlocked("https://www.example.com/path"), null);
equal(await lookup.isCommentModeBlocked("https://www.example.com/path"), true);
equal(globalThis.__siteFetches.length, 1);
equal(lookup.cachedCommentModeBlocked("https://example.com/other"), true, "www and bare host share cache");
equal(await lookup.isCommentModeBlocked("https://example.com/again"), true);
equal(globalThis.__siteFetches.length, 1, "cached status avoids a second request");
now += 86_400_000;
equal(lookup.cachedCommentModeBlocked("https://example.com"), null, "expired cache is evicted");
equal(lookup.cachedCommentModeBlocked("file:///tmp/a"), false);
equal(await commentStatus.createNoopCommentModeSiteStatus().isCommentModeBlocked("https://example.com"), false);

const keyboard = await importBundle("../src/main/main-app/browser-sidebar/app-shell-keyboard.ts", [
  [/^@chunk\/shared$/, `
    export const Ft = [];
    export const At = ({ commandId }) => commandId === "toggleDebugModal" ? ["CmdOrCtrl+Shift+D"] : [];
    export const jt = () => ["CmdOrCtrl+W"];
  `],
]);
const primary = process.platform === "darwin" ? { control: false, meta: true } : { control: true, meta: false };
const keyEvent = (overrides = {}) => ({
  type: "keyDown", code: "Equal", key: "+", alt: false, ...primary, shift: false, isAutoRepeat: false, ...overrides,
});
equal(keyboard.zoomCommandForEvent(keyEvent()), { type: "step-zoom", delta: 1 });
equal(keyboard.zoomCommandForEvent(keyEvent({ code: "Digit0", key: "0" })), { type: "reset-zoom" });
equal(keyboard.matchesAccelerator(keyEvent({ code: "KeyK", key: "k" }), "CmdOrCtrl+K"), true);
equal(keyboard.matchesAccelerator(keyEvent({ code: "KeyK", key: "k", control: false, meta: false }), "CmdOrCtrl+K"), false);
equal(keyboard.panelForConversation({ focusArea: "main", bottomPanelBrowserConversationId: "c", bottomPanelBrowserTabId: "t" }, "c", "t"), "bottom");
equal(keyboard.focusAreaPanel({ focusArea: "main" }), "right");
equal(keyboard.panelForHostKind("right-panel"), "right");
equal(keyboard.panelForHostKind("hidden-browser-use"), null);
equal(keyboard.closeTabAction({ focusArea: "bottom-panel", bottomPanelCanCloseActiveTab: true }), { panelId: "bottom", type: "close-active-app-shell-tab" });
equal(keyboard.actionForEvent(keyEvent(), { allowDebugMenu: false, state: { focusArea: "main", imagePreviewOpen: true } }), { type: "image-preview-zoom-command", command: { type: "step-zoom", delta: 1 } });

let prevented = 0;
const actions = [];
const dispatch = keyboard.createAppShellKeyboardDispatcher({
  allowDebugMenu: false,
  getState: () => ({ focusArea: "main", imagePreviewOpen: true }),
  sendAction: (action) => actions.push(action),
});
dispatch({ preventDefault: () => { prevented += 1; } }, keyEvent());
equal(prevented, 1, "dispatcher uses Electron event wrapper separately from input");
equal(actions[0].type, "image-preview-zoom-command");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/comment-site-status.js")'), true);
equal(main.includes('require("./main-app/browser-sidebar/app-shell-keyboard.js")'), true);
for (const oldOwner of ["function ZBe(", "function QBe(", "function iU(", "function uVe(", "function yU("]) equal(main.includes(oldOwner), false, `${oldOwner} is removed`);

console.log(`${assertions} main comment-status/app-shell-keyboard runtime assertions passed`);
