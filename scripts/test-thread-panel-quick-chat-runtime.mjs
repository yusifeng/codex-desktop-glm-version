import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__threadPanelQuickChat = { effects: [], portals: [], stateValues: [] };
state.jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.react = {
  useEffect(effect) { state.effects.push(effect); effect(); },
  useLayoutEffect(effect) { state.effects.push(effect); effect(); },
  useRef(value) { return { current: value }; },
  useState(initial) { const value = state.stateValues.length ? state.stateValues.shift() : (typeof initial === "function" ? initial() : initial); return [value, next => { state.lastState = typeof next === "function" ? next(value) : next; }]; },
};

async function load(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "thread-panel-quick-chat-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => {
      if (moduleName === "app-shared") return { loader: "js", contents: `
        export const I3=()=>globalThis.__threadPanelQuickChat.jsx;
        export const e6=globalThis.__threadPanelQuickChat.react;
        export const Jm=loader=>{globalThis.__threadPanelQuickChat.lazyLoader=loader;return "LazySideChat"};
        export const Yh="Button";
        export const m4=(...values)=>values.filter(Boolean).join(" ");
        export const createPortal=(children,container)=>{const value={type:"portal",props:{children,container}};globalThis.__threadPanelQuickChat.portals.push(value);return value};
      ` };
      return { loader: "js", contents: "export {};" };
    });
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Date.now()}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) walk(child, visit); }
function find(node, predicate) { let result; walk(node, candidate => { if (result == null && predicate(candidate)) result = candidate; }); return result; }

const panel = await load("thread-panel-toggle-button");
assert.deepEqual(Object.keys(panel).sort(), ["_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "y"]);
panel.n();
assert.equal(panel.p, "LazySideChat");
assert.equal(typeof state.lazyLoader, "function");
assert.equal(panel.b(), undefined);
assert.equal(panel.y({}), null);
assert.equal(panel._({ children: "icon" }).props.size, "toolbar");
assert.equal(panel.h({ count: 12 }).props.children[1].props.children, "9+");
let browserOpened = false;
const launcher = panel.f({ capabilities: { browser: true }, onOpenBrowser() { browserOpened = true; }, outputArtifacts: [{ id: "a1", title: "Report" }] });
assert.equal(launcher.actions.length, 1);
assert.equal(launcher.hasOutputArtifacts, true);
launcher.actions[0].onSelect();
assert.equal(browserOpened, true);
const newTab = panel.l({ actions: launcher.actions, children: "welcome", outputArtifacts: launcher.outputArtifacts, surface: "new-tab" });
assert.equal(newTab.props["data-new-tab-scroll-root"], true);
assert.equal(newTab.props.children.props.children[1], "welcome");
assert.equal(find(newTab, node => node.type === "button" && node.props.children === "Report") != null, true);
const dropdown = panel.s({ launcher, open: true, triggerButton: "trigger" });
assert.equal(dropdown.props.children[0], "trigger");
assert.equal(find(dropdown, node => node.props?.role === "menu") != null, true);
const toolbar = panel.r({ leadingToolbar: "left", mainToolbar: "middle", trailingToolbar: "right" });
assert.deepEqual(toolbar.props.children, ["left", "middle", "right"]);
assert.equal(panel.t({ children: "review", label: "Review", pressed: true }).props.color, "secondary");

const listeners = new Map();
const styleValues = new Map();
const ownerWindow = { addEventListener(type, listener) { listeners.set(type, listener); }, removeEventListener(type) { listeners.delete(type); } };
const body = { id: "body" };
const mainContent = {
  ownerDocument: { body, defaultView: ownerWindow },
  style: { setProperty(name, value) { styleValues.set(name, value); }, removeProperty(name) { styleValues.delete(name); } },
};
const quick = await load("content-quick-chat-overlay");
assert.deepEqual(Object.keys(quick).sort(), ["i", "n", "r", "t"]);
quick.i(); quick.n();
assert.equal(quick.r.defaultValue, "compact");
let presentation = null;
let minimized = null;
let childPresentation = null;
const portal = quick.t({ mainContentElement: mainContent, title: "Quick", statusState: "working", workingStatus: "Thinking",
  children(value) { childPresentation = value; return "composer"; }, renderTranscript() { return "transcript"; },
  onPresentationChange(value) { presentation = value; }, onMinimizedChange(value) { minimized = value; } });
assert.equal(portal.type, "portal");
assert.equal(portal.props.container, body);
const section = find(portal, node => node.type === "section");
assert.equal(section.props["data-dock-position"], "bottom-right");
assert.equal(section.props["data-presentation"], "compact");
assert.equal(childPresentation, "compact");
assert.equal(find(section, node => node.props?.["aria-live"] === "polite").props.children, "Thinking");
assert.equal(styleValues.get("--quick-chat-overlay-reserve-bottom"), "118px");
assert.equal(styleValues.get("--quick-chat-overlay-dock"), "bottom-right");
assert.equal(typeof listeners.get("keydown"), "function");
find(section, node => node.props?.["aria-label"] === "Expand chat").props.onClick();
assert.equal(presentation, "expanded");
find(section, node => node.props?.["aria-label"] === "Minimize chat").props.onClick();
assert.equal(minimized, true);

console.log("thread panel/quick chat runtime: 35 assertions passed");
