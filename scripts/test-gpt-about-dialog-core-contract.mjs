import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__gptAboutCoreContract = {
  initialized: 0,
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/gpt-about-dialog-core/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "gpt-about-core-contract-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({
        contents: moduleName === "app-shared"
          ? "export const I3=()=>globalThis.__gptAboutCoreContract.jsx;"
          : moduleName === "app-initial"
            ? "export const cJt=()=>{globalThis.__gptAboutCoreContract.initialized+=1};"
            : "export {};",
        loader: "js",
      }));
    },
  }],
});
const about = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(about).sort(), ["a", "c", "i", "n", "o", "r", "s", "t"]);
assert.deepEqual(about.i("account-1"), ["chatgpt-gizmos", "account-1", "discovery"]);
assert.deepEqual(about.r("account-1", "writing", "cursor-1"), ["chatgpt-gizmos", "account-1", "discovery-cut", "writing", "cursor-1"]);
assert.deepEqual(about.a("account-1", "research", "cursor-2"), ["chatgpt-gizmos", "account-1", "search", "research", "cursor-2"]);
assert.equal(about.s(["workspace_disabled"], false), "workspace_disabled");
assert.equal(about.s(["workspace_disabled"], true), null);
assert.equal(about.s(["fedramp_incompatible", "interactions_disabled"], true), "interactions_disabled");
about.n();
assert.equal(state.initialized, 1);

function nodes(root) {
  const output = [];
  const visit = value => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}
const byText = (tree, text) => nodes(tree).find(node => node.props?.children === text);
const loading = about.t({ accountId: "account-1", gizmo: "gpt-1", onClose() {} });
assert.equal(byText(loading, "Loading GPT details").type, "h2");
assert.equal(byText(loading, "Loading information about this GPT").props.role, "status");
let retried = 0;
const error = about.t({ accountId: "account-1", gizmo: "gpt-1", isError: true, onClose() {}, onRefetch() { retried += 1; } });
byText(error, "Try again").props.onClick();
assert.equal(retried, 1);

const resource = {
  gizmo: {
    id: "gpt-1",
    author: { display_name: "Ada" },
    display: { name: "  Analyst  ", description: "Find patterns", profile_picture_url: "https://example.com/avatar.png" },
    tags: [],
  },
  tools: [{ type: "browser" }, { type: "memory" }, { type: "browser" }, { type: "retrieval" }],
};
const relatedAllowed = { gizmo: { id: "gpt-2", display: { name: "Writer" }, tags: [] } };
const relatedBlocked = { gizmo: { id: "gpt-3", display: { name: "Blocked" }, tags: ["workspace_disabled"] } };
let started = null;
let closed = 0;
const tree = about.t({ accountId: "account-1", gizmo: resource, onClose() { closed += 1; }, onStartChat(value) { started = value; }, relatedGpts: [relatedAllowed, relatedBlocked] });
assert.equal(tree.props["aria-label"], "Analyst");
assert.equal(byText(tree, "By Ada").type, "p");
assert.equal(byText(tree, "Capabilities").type, "h2");
assert.equal(nodes(tree).filter(node => node.type === "li").length, 2);
const relatedCards = nodes(tree).filter(node => typeof node.type === "function" && node.type.name === "GptCard");
assert.equal(relatedCards.length, 1);
assert.equal(relatedCards[0].props.resource, relatedAllowed);
byText(tree, "Start chat").props.onClick();
assert.equal(started, resource);
nodes(tree).find(node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(closed, 1);

const blocked = about.t({ accountId: "account-1", gizmo: { ...resource, gizmo: { ...resource.gizmo, tags: ["workspace_disabled"] } }, onClose() {} });
assert.equal(blocked.props["data-blocked-reason"], "workspace_disabled");
assert.equal(byText(blocked, "Start chat"), undefined);
assert.equal(nodes(blocked).find(node => node.props?.role === "alert").props.children, "workspace disabled");
console.log("24 GPT about dialog core contract assertions passed");
