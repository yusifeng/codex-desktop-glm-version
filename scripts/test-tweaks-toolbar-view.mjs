import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/tweaks-toolbar-view/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceCheck = (value, message) => { assert.ok(value, message); sourceAssertions += 1; };
const dependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
sourceCheck([...dependencies].sort().join(",") === "app-initial,app-primary,app-shared,rolldown-runtime", "preserves all four static dependencies");
sourceCheck(!/import\s*\(/.test(source), "has no dynamic dependencies");
sourceCheck(!/\bany\b/.test(source), "does not introduce an explicit unsafe type");
sourceCheck(!/\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk)\s*\./.test(source), "does not consume namespace members");
sourceCheck(source.includes("useCallback") && !source.includes("useEffect("), "uses stable event callbacks without unnecessary effects");

const state = (globalThis.__tweaksToolbarViewTest = { initializers: [], setState: [], stateIndex: 0, stateValues: [] });
const jsx = { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const react = {
  useCallback(callback) { return callback; },
  useState(initial) { const index = state.stateIndex++; const value = index < state.stateValues.length ? state.stateValues[index] : initial; return [value, (next) => { const resolved = typeof next === "function" ? next(value) : next; state.setState.push({ index, value: resolved }); }]; },
};
state.jsx = jsx; state.react = react;
const marker = (name) => `export const ${name}=()=>globalThis.__tweaksToolbarViewTest.initializers.push("${name}");`;
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    marker("$3"), marker("K2"),
    "export const I3=()=>globalThis.__tweaksToolbarViewTest.jsx; export const e6=()=>globalThis.__tweaksToolbarViewTest.react;",
    "export const m4=(...values)=>values.filter(Boolean).join(' '); export const n4=()=>({formatMessage:(descriptor,values)=>values?.count?descriptor.defaultMessage.replace('{count}',String(values.count)):descriptor.defaultMessage});",
    "export const Ih='Dialog'; export const Lh='DialogText'; export const Oh='DialogBody'; export const Rh='DialogTitle'; export const Y2='FormattedMessage'; export const Yh='Button'; export const kh='DialogActions'; export const o_='Tooltip';",
  ].join("\n"),
  "app-initial": `
    export const Gg='Coachmark'; export const _p='DiscardIcon'; export const vp='ExitIcon';
    export const Kg=()=>globalThis.__tweaksToolbarViewTest.initializers.push('Kg');
  `,
  "app-primary": `
    export const Jc=value=>value?.nodeType===1; export const cs='AnnotationIcon'; export const ls='ScreenshotIcon';
    export const qc=()=>globalThis.__tweaksToolbarViewTest.initializers.push('qc');
  `,
};
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "tweaks-toolbar-view-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let runtimeAssertions = 0;
const runtimeCheck = (value, message) => { assert.ok(value, message); runtimeAssertions += 1; };
const resetHooks = (values = []) => { state.stateIndex = 0; state.stateValues = values; state.setState = []; };
const event = (overrides = {}) => { const calls = { prevent: 0, stop: 0 }; return { calls, value: { altKey: false, code: "Space", composedPath: () => [], ctrlKey: false, isComposing: false, isTrusted: true, metaKey: false, preventDefault: () => { calls.prevent += 1; }, shiftKey: false, stopImmediatePropagation: () => { calls.stop += 1; }, type: "keydown", ...overrides } }; };

runtimeCheck(Object.keys(module).sort().join(",") === "a,c,i,l,n,o,r,s,t,u", "preserves all ten public exports");
module.n(); module.n();
const initializerCounts = Object.fromEntries(state.initializers.map((name) => [name, state.initializers.filter((value) => value === name).length]));
runtimeCheck(initializerCounts.$3 === 4 && initializerCounts.K2 === 4 && initializerCounts.qc === 1 && initializerCounts.Kg === 1, "initializes each toolbar surface once and preserves dependency setup calls");
let keyboard = event(); runtimeCheck(module.l(keyboard.value, true, { preserveTyping: true }) === true && keyboard.calls.prevent === 1 && keyboard.calls.stop === 1, "captures trusted Space keydown while annotation mode is active");
keyboard = event({ type: "keyup" }); runtimeCheck(module.l(keyboard.value, true, { preserveTyping: true }) === false && keyboard.calls.prevent === 1, "captures Space keyup and returns false");
keyboard = event({ composedPath: () => [{ nodeType: 1, isContentEditable: true, closest: () => null }] }); runtimeCheck(module.l(keyboard.value, false, { preserveTyping: true }) === undefined && keyboard.calls.prevent === 0, "preserves typing in editable targets while inactive");
keyboard = event({ isTrusted: false }); runtimeCheck(module.l(keyboard.value, true, { preserveTyping: false }) === undefined, "ignores synthetic keyboard events");

let suppression = []; let toggles = 0; resetHooks();
let comment = module.s({ isCommentMode: false, onActiveHoverSuppressedChange: (value) => suppression.push(value), onToggle: () => { toggles += 1; }, direction: "rtl", showCoachmark: true });
runtimeCheck(comment.type === "Coachmark" && comment.props.side === "right", "renders the annotation coachmark on the RTL side");
let commentButton = comment.props.children; commentButton.props.onClick({}); commentButton.props.onPointerLeave();
runtimeCheck(toggles === 1 && suppression.join(",") === "true,false", "toggles comment mode and resets hover suppression");
comment = module.s({ isCommentMode: false, disabled: true, disabledTooltipContent: "blocked", onToggle() {} });
runtimeCheck(comment.type === "Tooltip" && comment.props.tooltipContent === "blocked", "uses the disabled tooltip branch");

let captures = 0; resetHooks();
let screenshot = module.a({ captureScreenshotLabel: "Capture", hasBrowserPage: true, isCommentMode: false, onCapture: () => { captures += 1; }, prefersReducedMotion: false });
let screenshotButton = screenshot.props.children.props.children; screenshotButton.props.onClick();
runtimeCheck(captures === 1 && state.setState[0].value === 1, "captures a screenshot and advances the animation key");
resetHooks(); screenshot = module.a({ captureScreenshotLabel: "Capture", hasBrowserPage: false, isCommentMode: false, onCapture() {}, prefersReducedMotion: true, reserveSpaceWhenHidden: true });
runtimeCheck(screenshot.props["aria-hidden"] === true && screenshot.props.className.includes("max-w-8"), "reserves hidden screenshot space when requested");

let closes = 0; let confirms = 0; resetHooks();
const dialog = module.r({ onClose: () => { closes += 1; }, onConfirm: () => { confirms += 1; } });
dialog.props.onOpenChange(false); const dialogForm = dialog.props.children; let prevented = 0; dialogForm.props.onSubmit({ preventDefault: () => { prevented += 1; } });
runtimeCheck(closes === 2 && confirms === 1 && prevented === 1, "closes and confirms through the discard form");

const calls = { add: 0, discard: 0, exit: 0, markers: 0, original: [] };
const toolbarProps = { displayUrl: "example.com", hasPendingAnnotations: true, hasQueuedTweaks: true, isAddModifierPressed: true, isOriginalViewEnabled: false, isSubmitAvailable: true, markersVisible: false, onAddToComposer: () => { calls.add += 1; }, onDiscard: () => { calls.discard += 1; }, onExit: () => { calls.exit += 1; }, onOriginalViewBlur: () => calls.original.push("blur"), onOriginalViewKeyDown: () => calls.original.push("keydown"), onOriginalViewKeyUp: () => calls.original.push("keyup"), onOriginalViewPointerCancel: () => calls.original.push("cancel"), onOriginalViewPointerDown: () => calls.original.push("down"), onOriginalViewPointerUp: () => calls.original.push("up"), onSubmit: () => null, onToggleMarkers: () => { calls.markers += 1; }, pendingAnnotationCount: 2, screenshotButton: "screenshot" };
resetHooks(); let toolbar = module.t(toolbarProps); const left = toolbar.props.children[0]; const right = toolbar.props.children[2];
left.props.children[0].props.children.props.onClick(); left.props.children[1].props.children.props.onClick(); right.props.children[1].props.children.props.onClick();
runtimeCheck(calls.exit === 1 && calls.discard === 1 && calls.markers === 1, "wires exit, discard, and marker actions");
const originalButton = right.props.children[2].props.children; originalButton.props.onKeyDown(); originalButton.props.onPointerDown(); originalButton.props.onPointerUp();
runtimeCheck(calls.original.join(",") === "keydown,down,up", "forwards original-view interaction handlers");
const sendButton = right.props.children[3]; sendButton.props.onClick(); runtimeCheck(calls.add === 1, "adds annotations to the composer when the modifier is pressed");
let resolveSubmit; const request = new Promise((resolve) => { resolveSubmit = resolve; }); resetHooks(); toolbar = module.t({ ...toolbarProps, isAddModifierPressed: false, onSubmit: () => request }); toolbar.props.children[2].props.children[3].props.onClick();
runtimeCheck(state.setState[0].value === true, "enters loading state for async submission"); resolveSubmit(); await request; await Promise.resolve(); runtimeCheck(state.setState.at(-1).value === false, "leaves loading state after submission settles");
resetHooks(); toolbar = module.t({ ...toolbarProps, hasPendingAnnotations: false, isAddModifierPressed: false, isSubmitAvailable: false }); runtimeCheck(toolbar.props.children[2].props.children[3].props.disabled === true, "disables send without pending annotations");

console.log(`${sourceAssertions} source assertions, ${runtimeAssertions} runtime assertions passed for tweaks toolbar view`);
