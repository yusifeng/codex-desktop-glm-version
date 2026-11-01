import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__gitThreadRuntime = { effects: [], stateValues: [] };
state.jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.react = {
  useEffect(effect) { state.effects.push(effect); effect(); },
  useState(initial) {
    const value = state.stateValues.length ? state.stateValues.shift() : (typeof initial === "function" ? initial() : initial);
    return [value, next => { state.lastState = typeof next === "function" ? next(value) : next; }];
  },
};

async function load(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "git-thread-runtime-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => {
        if (moduleName === "app-shared") return { loader: "js", contents: "export const I3=()=>globalThis.__gitThreadRuntime.jsx;export const e6=globalThis.__gitThreadRuntime.react;" };
        if (moduleName === "app-initial") return { loader: "js", contents: "export const cJt=()=>{globalThis.__gitThreadRuntime.apiInitialized=true};" };
        if (moduleName === "git-branch-switcher") return { loader: "js", contents: "export const n=()=>{};export const p=props=>({type:'CommitModal',props});" };
        if (moduleName === "create-pull-request-modal-content") return { loader: "js", contents: "export const n=()=>{};export const t=props=>({type:'PullRequestModal',props});" };
        return { loader: "js", contents: "export {};" };
      });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Date.now()}`);
}

function find(node, predicate) {
  if (node == null || typeof node !== "object") return undefined;
  if (predicate(node)) return node;
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const match = find(child, predicate); if (match != null) return match;
  }
  return undefined;
}
function button(node, text) { return find(node, item => item.type === "button" && item.props?.children === text); }

const branches = await load("git-branch-switcher");
assert.deepEqual(Object.keys(branches).sort(), ["a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
branches.n();
assert.equal(branches.h({ cwd: "/repo/project/", hostConfig: { id: "local" } }), "project");
assert.equal(branches.c("/repo", { id: "local" }, "composer").liveQuery.params.includeUntrackedFiles, true);
assert.equal(branches.u("/repo", { id: "local" }, "composer").params.limit, 100);
assert.equal(branches.a({ showSetPrefix: true }).props.children[1].props.children, "Set prefix");
const list = branches.r({ branches: ["main", "feature"], repositoryName: "project", selectedBranch: "main" });
assert.equal(list.props.children[0].props["aria-label"], "Search project branches");
assert.equal(list.props.children[1].props.children.length, 2);
const modal = branches.p({ open: true, target: { cwd: "/repo", hostConfig: { id: "local" } }, onOpenChange() {} });
assert.equal(modal.type, "dialog");
assert.equal(modal.props["aria-label"], "Commit");
assert.equal(button(modal, "Commit").props.disabled, true);
const switcher = branches.t({ cwd: "/repo/project", gitRoot: "/repo/project", hostConfig: { id: "local" }, open: false });
assert.equal(switcher.props.children[0].props.children, "project");
assert.equal(branches.t({ cwd: "/repo", hostConfig: { id: "local" }, shouldShow: false }), null);

const actions = await load("local-conversation-git-actions");
assert.deepEqual(Object.keys(actions).sort(), ["i", "n", "r", "t"]);
actions.n();
assert.equal(actions.r({ phase: "create-draft-pr" }).props.children, "Create draft pull request");
let createPrReady = false;
let menuOpened = false;
const actionTree = actions.t({ conversationId: "thread-1", codexWorktree: true, surface: "summary-panel", target: { cwd: "/repo", hostId: "local" },
  onCreatePullRequestActionReady(action) { createPrReady = typeof action === "function"; }, onMenuOpenChange(open) { menuOpened = open; } });
assert.equal(createPrReady, true);
assert.equal(actionTree.props["data-host-id"], "local");
const menu = actionTree.props.children[0];
assert.equal(menu.props.role, "menu");
assert.equal(menu.props.children.length, 5);
button(menu, "Create pull request").props.onClick();
assert.equal(menuOpened, true);
assert.equal(actions.t({ surface: "composer", target: { hostId: "local" } }).props.children[0], null);

const handoff = await load("thread-handoff-modal");
handoff.n();
assert.equal(state.apiInitialized, true);
let payload;
let closed = false;
const handoffTree = handoff.t({ conversationId: "thread-1", gitRoot: "/repo", onClose() { closed = true; },
  threadHandoff: { conversationTitle: "Fix branch bug", cwd: "/repo", direction: "to-worktree", async perform(input) { payload = input; } } });
assert.equal(handoffTree.props["data-handoff-direction"], "to-worktree");
assert.equal(find(handoffTree, node => node.type === "input").props.value, "codex/fix-branch-bug");
await button(handoffTree, "Move thread").props.onClick();
assert.equal(payload.direction, "to-worktree");
assert.equal(payload.branch, "codex/fix-branch-bug");
assert.equal(closed, true);
state.stateValues = ["bad/", false, null, "/repo", "", [], false];
const invalid = handoff.t({ conversationId: "thread-2", gitRoot: "/repo", onClose() {}, threadHandoff: { direction: "to-local" } });
assert.equal(find(invalid, node => node.props?.role === "alert").props.children, "Branch name cannot end with “/”");
assert.equal(button(invalid, "Move thread").props.disabled, true);

console.log("git/thread handoff runtime: 30 assertions passed");
