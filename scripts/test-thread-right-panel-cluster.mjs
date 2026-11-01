import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["panel", "thread-panel-toggle-button"];
const state = globalThis.__threadRightPanelTest = { lazyLoaders: [], stateValues: [] };
state.jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
state.react = {
  useState(initial) {
    const value = state.stateValues.length === 0 ? initial : state.stateValues.shift();
    return [value, (next) => { state.lastState = typeof next === "function" ? next(value) : next; }];
  },
};

const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) {
      const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (name) names.add(name);
    }
    imports.set(match[2], names);
  }
}
const overrides = {
  "app-shared": {
    I3: `() => globalThis.__threadRightPanelTest.jsx`, Jm: `loader => { globalThis.__threadRightPanelTest.lazyLoaders.push(loader); return "LazySideChat"; }`,
    Y2: `"FormattedMessage"`, Yh: `"Button"`, e6: `globalThis.__threadRightPanelTest.react`,
    m4: `(...values) => values.filter(Boolean).join(" ")`,
  },
  "local-conversation-thread-entry": { LocalConversationSideChatTab: `"LocalConversationSideChatTab"` },
};
function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = name === "app-shared" ? Object.keys(overrides["app-shared"]) : [...(imports.get(name) ?? [])];
  return names.map((exportName) => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`).join("\n");
}
let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "thread-panel-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, (candidate) => { if (result == null && predicate(candidate)) result = candidate; }); return result; }
function findAll(node, predicate) { const result = []; walk(node, (candidate) => { if (predicate(candidate)) result.push(candidate); }); return result; }

// panel
const panel = await bundle("panel");
assert.deepEqual(Object.keys(panel).sort(), ["n", "t"]);
panel.n(); panel.n();
let closed = 0;
let debug = panel.t({ conversationIdOverride: "c1", onClose: () => { closed++; } });
assert.equal(debug.type, "div");
assert.equal(find(debug, (node) => node.type === "h2").props.children, "Debug");
assert.equal(findAll(debug, (node) => node.type === "button").length, 9);
assert.equal(find(debug, (node) => node.props?.["data-debug-section"] != null).props["data-debug-section"], "conversation");
assert.equal(find(debug, (node) => node.props?.["data-debug-section"] != null).props.children, "Conversation c1");
find(debug, (node) => node.type === "Button").props.onClick();
assert.equal(closed, 1);
debug = panel.t({ initialSectionId: "plugins", sections: [{ id: "conversation", label: "Conversation", content: "chat" }, { id: "plugins", label: "Plugins", content: "plugin-state" }], showHeader: false });
assert.equal(find(debug, (node) => node.type === "h2"), undefined);
assert.equal(find(debug, (node) => node.props?.["data-debug-section"] != null).props.children, "plugin-state");

// thread-panel-toggle-button
const toggle = await bundle("thread-panel-toggle-button");
assert.deepEqual(Object.keys(toggle).sort(), ["_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "y"]);
toggle.n(); toggle.n();
assert.equal(state.lazyLoaders.length, 1);
assert.equal(toggle.p, "LazySideChat");
const iconButton = toggle._({ children: "icon" });
assert.equal(iconButton.type, "Button");
assert.equal(iconButton.props.size, "toolbar");
assert.equal(toggle.h({ count: 0 }).props.children[1], null);
assert.equal(toggle.h({ count: 4 }).props.children[1].props.children, 4);
assert.equal(toggle.h({ count: 14 }).props.children[1].props.children, "9+");

const selected = [];
const actions = [{ id: "browser", label: "Browser", onSelect: () => selected.push("browser") }, { disabled: true, id: "review", label: "Review", onSelect: () => selected.push("review") }];
const launcherState = toggle.f({ actions });
assert.deepEqual(launcherState.actions, actions);
assert.equal(launcherState.hasOutputArtifacts, false);
let launcher = toggle.l({ actions, children: "header" });
assert.equal(launcher.props["data-panel-target"], "right");
assert.equal(findAll(launcher, (node) => node.type === "li").length, 2);
find(launcher, (node) => node.type === "button" && node.props.disabled !== true).props.onClick();
assert.deepEqual(selected, ["browser"]);

let dropdown = toggle.s({ launcher: launcherState, open: false, triggerButton: "trigger" });
assert.equal(dropdown.props.children[0], "trigger");
assert.equal(dropdown.props.children[1], null);
dropdown = toggle.s({ launcher: launcherState, open: true, triggerButton: "trigger" });
assert.equal(findAll(dropdown, (node) => node.type === "li").length, 2);

let openChange;
const contextMenu = toggle.a({ children: "tab", onOpenChange: (open) => { openChange = open; } });
const trigger = find(contextMenu, (node) => node.type === "span");
let prevented = 0;
trigger.props.onContextMenu({ preventDefault() { prevented++; }, stopPropagation() { prevented++; } });
assert.equal(prevented, 2);
assert.equal(state.lastState, true);
assert.equal(openChange, true);

const toolbar = toggle.r({ mainToolbar: "toolbar" });
assert.equal(toolbar.type, "Fragment");
assert.equal(toolbar.props.children[1], "toolbar");
const toolbarButton = toggle.t({ children: "review", color: "outline", label: "Review", pressed: true, shortcut: "⌘R" });
assert.equal(toolbarButton.props.color, "outlineActive");
assert.equal(toolbarButton.props.title, "Review (⌘R)");
assert.equal(toolbarButton.props["aria-pressed"], true);
assert.equal(toggle.b(), undefined);
assert.equal(toggle.y(), null);

console.log("thread right panel cluster tests passed");
