import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/right-panel-composer-overlay/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = globalThis.__rightPanelOverlayTest = { stateCursor: 0, stateValues: [], refs: [], refCursor: 0, alignments: [], tracking: [] };
state.jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
state.react = {
  useContext() { return null; },
  useEffect(effect) { effect(); },
  useLayoutEffect(effect) { effect(); },
  useRef(initial) { const index = state.refCursor++; return state.refs[index] ??= { current: initial }; },
  useState(initial) { const index = state.stateCursor++; const value = state.stateValues[index] ?? (typeof initial === "function" ? initial() : initial); return [value, next => { state.stateValues[index] = typeof next === "function" ? next(value) : next; }]; },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
};

const mocks = {
  "app-shared": `
    export const C_ = {};
    export const I3 = () => globalThis.__rightPanelOverlayTest.jsx;
    export const e6 = () => globalThis.__rightPanelOverlayTest.react;
    export const LX = () => ({ get() { return null; }, set(signal, value) { globalThis.__rightPanelOverlayTest.lastScopeWrite = { signal, value }; }, value: { routeKind: "thread" } });
    export const HX = () => null;
    export const P3 = () => ({ createPortal(node, container) { return { portal: true, node, container }; } });
    export const m4 = (...values) => values.filter(Boolean).join(" ");
    export const xm = (value, zoom) => value / zoom;
  `,
  "app-initial": `
    export const $en = {};
    export const Jen = value => value?.id ?? null;
    export const Ken = () => "conversation-1";
    export const Yen = value => value?.browser === true;
    export const _gt = { subscribe() { return () => {}; }, getSnapshot() { return { tabType: "web", url: "https://example.com", isLoading: false }; } };
    export const qvt = { activeTab$: {} };
    export const Jbt = {}; export const tQ = {}; export const nQ = {}; export const hU = {}; export const bU = {}; export const yU = {}; export const gU = {};
  `,
  "app-primary": `export const ar = {}; export const or = {}; export const rt = {}; export const et = { browserHost: { setFloatingComposerRevealTracking(options) { globalThis.__rightPanelOverlayTest.tracking.push(options); } } };`,
  "right-panel-composer-overlay-alignment": `export const r = (_scope, options) => globalThis.__rightPanelOverlayTest.alignments.push(options); export const t = () => { globalThis.__rightPanelOverlayTest.restored = true; };`,
  "wheel-swipe-gesture": `export class Tracker { begin() {} isContinuation() { return false; } } export const t = Tracker; export const n = () => {};`,
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "overlay-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mocks[importPath] ?? "export {};", loader: "js" })); } }] });
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(module).sort(), ["n", "t"]);
assert.equal(module.n(), undefined);

function reset() { state.stateCursor = 0; state.refCursor = 0; state.stateValues = []; state.refs = []; }
function flatten(node, output = []) { if (node == null || typeof node !== "object") return output; output.push(node); const children = node.props?.children; if (Array.isArray(children)) children.forEach(child => flatten(child, output)); else flatten(children, output); return output; }

reset();
let tree = module.t({ children: "composer", browserPanelEnabled: false, browserReady: true, overlayVisibility: "visible", transitionHeight: 20 });
let nodes = flatten(tree);
let overlay = nodes.find(node => node.props?.["data-testid"] === "right-panel-composer-overlay");
assert.equal(overlay.props["data-presentation"], "default");
assert.equal(overlay.props["data-transition-state"], "visible");
assert.equal(overlay.props.style.transform, "translateY(98px)");
assert.equal(nodes.some(node => node.props?.["data-right-panel-composer-overlay-content"] === "true"), true);
assert.equal(nodes.some(node => node.props?.["data-testid"] === "floating-composer-reveal-handle"), false);

reset();
tree = module.t({ children: "composer", browserPanelEnabled: true, browserReady: true, browserPeeked: false, overlayVisibility: "hidden", activeBrowserTabId: "tab-1" });
nodes = flatten(tree);
overlay = nodes.find(node => node.props?.["data-testid"] === "right-panel-composer-overlay");
assert.equal(overlay.props["data-presentation"], "floating");
assert.equal(overlay.props["data-composer-peeked"], true);
const revealElement = nodes.find(node => node.type?.name === "RevealHandle");
assert.equal(revealElement.props.visible, true);
const revealButton = revealElement.type(revealElement.props);
revealButton.props.onClick({ type: "click", detail: 1, clientY: 0 });
assert.equal(state.alignments.length, 1);

reset();
tree = module.t({ children: "composer", browserPanelEnabled: true, browserReady: true, browserPeeked: true, browserTabMatchesConversation: true, overlayVisibility: "visible", activeBrowserTabId: "tab-1" });
nodes = flatten(tree);
overlay = nodes.find(node => node.props?.["data-testid"] === "right-panel-composer-overlay");
assert.equal(overlay.props["data-transition-state"], "visible");
const content = nodes.find(node => node.props?.["data-right-panel-composer-overlay-content"] === "true");
assert.equal(content.props["data-mode"], "expanded");
const hideElement = nodes.find(node => node.type?.name === "HideHandle");
assert.equal(hideElement.props.visible, true);
hideElement.type(hideElement.props).props.onClick({ type: "click", detail: 0 });
assert.equal(state.restored, true);

reset();
const body = {};
const host = { ownerDocument: { body }, getBoundingClientRect: () => ({ height: 600, left: 100, top: 20, width: 400 }) };
tree = module.t({ children: "composer", browserPanelEnabled: false, browserReady: true, overlayVisibility: "visible", overlayHost: host, zoom: 2 });
assert.equal(tree.type, "Fragment");
assert.equal(tree.props.children[0].portal, true);
assert.equal(tree.props.children[0].container, body);
assert.match(source, /ResizeObserver/);
assert.match(source, /MutationObserver/);
assert.match(source, /setFloatingComposerRevealTracking/);
assert.match(source, /document\.addEventListener\("wheel"/);
assert.doesNotMatch(source, /kind:\s*["']right-panel-composer-overlay/);

console.log("25 right-panel composer overlay assertions passed");
