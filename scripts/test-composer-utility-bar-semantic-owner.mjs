import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__composerUtilityTest = { calls: [], scope: { value: {} } };
globalThis.__composerUtilityJsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/composer-utility-bar/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "composer-utility-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({
        loader: "js",
        contents: moduleName === "app-shared"
          ? "export const I3=()=>globalThis.__composerUtilityJsx;export const LX=()=>globalThis.__composerUtilityTest.scope;"
          : moduleName === "app-initial"
            ? "export const $en=Symbol('route');export const F3=(scope,key,value)=>globalThis.__composerUtilityTest.calls.push(['set',scope,key,value]);"
            : moduleName === "worktree-environment-dropdown"
              ? "export const n=()=>globalThis.__composerUtilityTest.calls.push('init-worktree');export function s(){}"
              : "export {};",
      }));
    },
  }],
});
const composer = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
function walk(root) {
  const nodes = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) nodes.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return nodes;
}
const base = {
  asyncThreadStartingState: { type: "working-tree" },
  composerMode: "local",
  isResponseInProgress: false,
  remoteConfig: { getProjectPathForHostId: (hostId) => `/remote/${hostId}` },
  setComposerMode: (mode) => state.calls.push(["mode", mode]),
  variant: "default",
  worktreeEnvironmentWorkspaceRoot: "/workspace",
};

const localTree = composer.ComposerUtilityBar({ ...base, isWorktreeAvailable: true });
assert.equal(localTree.type, "footer");
assert.equal(localTree.props["data-composer-footer-layout"], "inline");
assert.equal(localTree.kind, undefined, "semantic owner must return React nodes, not a structural view model");
const localNodes = walk(localTree);
const modeButtons = localNodes.filter((node) => node.props?.["aria-pressed"] != null);
assert.equal(modeButtons.length, 3);
modeButtons.find((node) => node.props.children === "Worktree").props.onClick();
assert.deepEqual(state.calls.at(-1), ["mode", "worktree"]);

const homeTree = composer.ComposerUtilityBar({ ...base, variant: "home", isHidden: true, homeAuxiliaryControl: "aux" });
assert.equal(homeTree.type, "div");
assert.equal(homeTree.props.hidden, true);
assert.equal(homeTree.props["data-composer-footer-layout"], "floating");
assert(walk(homeTree).some((node) => node.props?.["aria-label"] === "Choose project"));

const workspaceTree = composer.ComposerUtilityBar({
  ...base,
  codexHome: "/Users/david/.codex",
  existingWorkspace: { isWorktree: true, sourceConversationTitle: "Source", workspaceRoot: "/Users/david/.codex/worktrees/large-batch/repo" },
});
const workspace = walk(workspaceTree).find((node) => node.props?.className === "composer-utility-bar__workspace");
assert.equal(workspace.props.children, "Large batch");
assert.match(workspace.props.title, /Source/);

const remoteTree = composer.ComposerUtilityBar({
  ...base,
  localRemoteExecutionTarget: { hostConfig: { id: "remote-1" }, hostId: "remote-1" },
  showRuntimeControls: true,
});
assert(walk(remoteTree).some((node) => node.props?.className === "composer-utility-bar__remote-host"));
assert(walk(remoteTree).some((node) => node.props?.["data-runtime-controls"] === true));

const worktreeTree = composer.ComposerUtilityBar({
  ...base,
  composerMode: "worktree",
  isWorktreeAvailable: true,
  localRemoteExecutionTarget: { hostConfig: { id: "local" }, hostId: "local" },
});
const startingState = walk(worktreeTree).find((node) => typeof node.type === "function" && node.props?.startingState != null);
assert(startingState, "worktree mode renders the real starting-state control");
startingState.props.setStartingState({ type: "branch", branchName: "main" });
assert.deepEqual(state.calls.at(-1).slice(0, 3), ["set", state.scope, "asyncThreadStartingState"]);

console.log("composer utility bar semantic owner assertions passed");
