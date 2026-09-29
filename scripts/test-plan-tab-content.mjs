import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = { hostId: "host-7", initializers: [], markdownProps: [] };
globalThis.__planTab = state;
const dependencyNames = ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "surface"];
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": "const s=globalThis.__planTab;export const $3=()=>s.initializers.push('shared');export const FX=()=>s.initializers.push('features');export const HX=()=>s.hostId;export const I3=()=>s.jsx;export const __=callback=>callback;export const g_=()=>s.initializers.push('callback-ref');",
  "app-initial": "const s=globalThis.__planTab;export const Dyt='host-id';export const byt=()=>s.initializers.push('host-state');",
  "app-primary": "const s=globalThis.__planTab;export const Ct='data-conversation-id';export const wt=()=>s.initializers.push('conversation-surface');",
  surface: "const s=globalThis.__planTab;export const i=()=>s.initializers.push('markdown-surface');export const r=props=>{s.markdownProps.push(props);return {type:'markdown-surface',props}};",
};
state.jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/plan-tab-content/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, metafile: true, logLevel: "silent", plugins: [{ name: "plan-tab-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["PlanSidePanelTabContent"]);
assert.deepEqual(state.initializers, ["shared", "features", "markdown-surface", "host-state", "callback-ref", "conversation-surface"]);
const source = fs.readFileSync(path.join(ROOT, "src/renderer/plan-tab-content/index.ts"), "utf8");
assert.deepEqual([...new Set([...source.matchAll(/(?:from\s+|import\s+)["']@rchunk\/([^"']+)["']/g)].map((match) => match[1]))], dependencyNames);
assert.deepEqual([...source.matchAll(/import\(["']@rchunk\/([^"']+)["']\)/g)], []);
assert.equal(/import\s+\*\s+as/.test(source), false);

let tabState = { planKey: "plan-a", scrollTop: 42 };
let setterCalls = 0;
function setTabState(next) { setterCalls += 1; tabState = typeof next === "function" ? next(tabState) : next; }
function render(overrides = {}) { return module.PlanSidePanelTabContent({ content: "# Plan", conversationId: "conv-1", cwd: "/repo", hideCodeBlocks: true, planKey: "plan-a", setTabState, tabState, ...overrides }); }

let view = render();
assert.equal(view.type, "div");
assert.equal(view.key, "plan-a");
assert.equal(view.props.className, "h-full min-h-0 overflow-y-auto px-1");
assert.equal(view.props["data-conversation-id"], "conv-1");
assert.equal(view.props.children.type, "markdown-surface");
assert.deepEqual(view.props.children.props, { markdown: "# Plan", conversationId: "conv-1", cwd: "/repo", hideCodeBlocks: true, hostId: "host-7" });
const element = { scrollTop: 0 };
const cleanup = view.props.ref(element);
assert.equal(element.scrollTop, 42);
element.scrollTop = 87;
cleanup();
assert.deepEqual(tabState, { planKey: "plan-a", scrollTop: 87 });
assert.equal(setterCalls, 1);

const previousState = tabState;
view = render();
const unchangedCleanup = view.props.ref({ scrollTop: 87 });
unchangedCleanup();
assert.equal(tabState, previousState);
assert.equal(setterCalls, 2);

tabState = { planKey: "other-plan", scrollTop: 123 };
view = render({ planKey: "plan-b", content: "Body", conversationId: "conv-2", cwd: null, hideCodeBlocks: false });
const nextElement = { scrollTop: 999 };
const nextCleanup = view.props.ref(nextElement);
assert.equal(nextElement.scrollTop, 0);
nextElement.scrollTop = 15;
nextCleanup();
assert.deepEqual(tabState, { planKey: "plan-b", scrollTop: 15 });
assert.equal(view.key, "plan-b");
assert.equal(view.props["data-conversation-id"], "conv-2");
assert.deepEqual(view.props.children.props, { markdown: "Body", conversationId: "conv-2", cwd: null, hideCodeBlocks: false, hostId: "host-7" });

assert.equal(view.props.ref(null), undefined);
const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " plan tab content assertions passed");
