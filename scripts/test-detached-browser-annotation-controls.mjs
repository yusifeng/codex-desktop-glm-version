import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/detached-browser-annotation-controls/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
assert.deepEqual([...dependencies].sort(), ["app-shared", "rolldown-runtime", "tweaks-toolbar-view"]);
assert.ok(!/import\s*\(/.test(source));
assert.ok(!/\bany\b/.test(source));
assert.ok(!/import \* as/.test(source));

const state = globalThis.__detachedAnnotationTest = { effects: [], initializers: [], stateIndex: 0, stateValues: [], updates: [] };
const jsx = { jsx: (type, props) => ({ type, props: props ?? {} }), jsxs: (type, props) => ({ type, props: props ?? {} }) };
const react = {
  useEffect(effect) { state.effects.push(effect); },
  useRef(value) { return { current: value }; },
  useState(initial) { const index = state.stateIndex++; const value = index < state.stateValues.length ? state.stateValues[index] : initial; return [value, (next) => state.updates.push({ index, value: typeof next === "function" ? next(value) : next })]; },
};
state.jsx = jsx; state.react = react;
globalThis.window = { addEventListener() {}, removeEventListener() {} };
globalThis.document = { activeElement: null, documentElement: { dir: "ltr" } };
const marker = (name) => `export const ${name}=()=>globalThis.__detachedAnnotationTest.initializers.push("${name}");`;
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [marker("$3"), marker("K2"), marker("h4"), marker("wL"), "export const I3=()=>globalThis.__detachedAnnotationTest.jsx;export const e6=()=>globalThis.__detachedAnnotationTest.react;export const m4=(...v)=>v.filter(Boolean).join(' ');export const n4=()=>({formatMessage:d=>d.defaultMessage});"].join("\n"),
  "tweaks-toolbar-view": `
    ${marker("c")} ${marker("i")} ${marker("n")} ${marker("o")} ${marker("u")}
    export const a='ScreenshotButton'; export const r='DiscardDialog'; export const s='CommentModeButton'; export const t='TweaksToolbarView';
    export const l=(event,active)=>event.code==='Space'?(event.type==='keydown'):undefined;
  `,
};
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "annotation-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(module).sort(), ["DetachedBrowserAnnotationButton", "DetachedBrowserTweaksToolbar"]);
assert.equal(state.initializers.length, 9);
const reset = (values = []) => { state.stateIndex = 0; state.stateValues = values; state.updates = []; state.effects = []; };

let focused = 0; const errors = []; const commands = []; const actions = [];
reset();
const button = module.DetachedBrowserAnnotationButton({
  browserTabId: "tab", browserToolbarCapabilities: { showAnnotationCoachmark: true }, conversationId: "c", focusPage: () => { focused += 1; }, onError: (message) => errors.push(message),
  requestToolbarSourceAction: (action) => { actions.push(action); return true; }, runCommand: (request) => { commands.push(request); return "accepted"; }, snapshot: { interactionMode: "browse", tabType: "web", url: "https://example.com/path" },
});
assert.equal(button.type, "div"); assert.equal(button.props["aria-hidden"], false);
const commentButton = button.props.children; assert.equal(commentButton.type, "CommentModeButton"); assert.equal(commentButton.props.showCoachmark, true);
commentButton.props.onToggle(); await Promise.resolve(); assert.equal(commands[0].command.interactionMode, "comment"); assert.equal(focused, 1);
commentButton.props.onDismissCoachmark(); await Promise.resolve(); assert.equal(actions[0].type, "dismiss-annotation-coachmark");
reset(); const hidden = module.DetachedBrowserAnnotationButton({ browserTabId: "tab", browserToolbarCapabilities: {}, conversationId: "c", focusPage() {}, onError() {}, requestToolbarSourceAction: () => true, runCommand: () => "accepted", snapshot: { tabType: "other", url: "" } });
assert.equal(hidden.props["aria-hidden"], true); assert.equal(hidden.props.children.props.disabled, true);

const presentations = []; reset(); commands.length = 0; actions.length = 0;
const toolbarRoot = module.DetachedBrowserTweaksToolbar({
  browserHost: { setAnnotationPresentation: async (value) => { presentations.push(value); } }, browserTabId: "tab", browserToolbarCapabilities: { annotationMarkersVisible: false, canCaptureScreenshot: true, canUseComposer: true, isComposerListenerRegistered: true, pendingCommentAttachmentCount: 2, reduceMotion: false }, conversationId: "c", onError: (message) => errors.push(message), requestToolbarSourceAction: async (action) => { actions.push(action); return true; }, runCommand: async (request) => { commands.push(request); return "accepted"; }, showFullUrl: false, snapshot: { comments: [{ id: 1 }], interactionMode: "comment", tabType: "web", url: "https://example.com/path" }, viewport: { contains: () => false },
});
assert.equal(toolbarRoot.type, "div"); const toolbar = toolbarRoot.props.children[0]; assert.equal(toolbar.type, "TweaksToolbarView");
assert.equal(toolbar.props.displayUrl, "example.com/path"); assert.equal(toolbar.props.hasPendingAnnotations, true); assert.equal(toolbar.props.pendingAnnotationCount, 2); assert.equal(toolbar.props.screenshotButton.type, "ScreenshotButton");
toolbar.props.onAddToComposer(); await Promise.resolve(); assert.equal(commands.at(-1).command.type, "add-annotations-to-composer");
toolbar.props.onToggleMarkers(); await Promise.resolve(); await Promise.resolve(); assert.equal(actions.at(-1).type, "set-annotation-markers-visible"); assert.equal(presentations.at(-1).markersVisible, true);
toolbar.props.onOriginalViewKeyDown({ key: "Enter", repeat: false, preventDefault() {} }); await Promise.resolve(); assert.equal(commands.at(-1).command.enabled, true);
toolbar.props.onOriginalViewKeyUp({ key: "Enter", preventDefault() {} }); await Promise.resolve(); assert.equal(commands.at(-1).command.enabled, false);
toolbar.props.screenshotButton.props.onCapture(); await Promise.resolve(); assert.equal(actions.at(-1).type, "capture-screenshot-clicked"); assert.equal(commands.at(-1).command.type, "capture-screenshot");
reset([true, false, false]); const dialogRoot = module.DetachedBrowserTweaksToolbar({ browserHost: { setAnnotationPresentation: async () => {} }, browserTabId: "tab", browserToolbarCapabilities: {}, conversationId: "c", onError() {}, requestToolbarSourceAction: () => true, runCommand: (request) => { commands.push(request); return "accepted"; }, snapshot: { url: "https://example.com" }, viewport: { contains: () => false } });
assert.equal(dialogRoot.props.children[1].type, "DiscardDialog"); dialogRoot.props.children[1].props.onConfirm(); await Promise.resolve(); assert.equal(commands.at(-1).command.type, "discard-pending-annotations");
console.log("20 detached browser annotation controls assertions passed");
