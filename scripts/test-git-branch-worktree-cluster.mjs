import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
globalThis.__jsx = jsx;
globalThis.__gitSignals = [];

async function loadModule(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\/(git-action-new-branch-field|git-branch-switcher)$/ }, ({ path: modulePath }) => ({ path: path.join(ROOT, "src/renderer", modulePath.slice(8), "index.ts") }));
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => modulePath === "app-shared" ? {
        loader: "js", contents: `
          export const FX=()=>{},ZI={};
          export const pZ=(_scope,value)=>{const signal={value};globalThis.__gitSignals.push(signal);return signal};
          export const I3=()=>globalThis.__jsx;
        `,
      } : { loader: "js", contents: "export {};" });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const actions = await loadModule("git-action-new-branch-field");
actions.B();
assert.equal(globalThis.__gitSignals.length, 7);
assert.equal(actions.P({ hasSomeUncommittedChanges: false, isChangesLoading: true, isChangesUnavailable: false }), "changes-loading");
assert.equal(actions.P({ hasSomeUncommittedChanges: false, isChangesLoading: false, isChangesUnavailable: true }), "changes-unavailable");
assert.equal(actions.P({ hasSomeUncommittedChanges: false, isChangesLoading: false, isChangesUnavailable: false }), "no-changes");
assert.equal(actions.P({ hasSomeUncommittedChanges: true, isChangesLoading: false, isChangesUnavailable: false }), null);
assert.equal(actions.G({}), "push-status-loading");
assert.equal(actions.G({ pushStatus: { commitsAhead: 1 } }), "branch-missing");
assert.equal(actions.G({ pushStatus: { branch: "feature", commitsAhead: 0 } }), "nothing-to-push");
assert.equal(actions.G({ ignoreNothingToPush: true, pushStatus: { branch: "feature", commitsAhead: 0 } }), null);

const capabilities = actions.H({ commitsAhead: 2, commitBlockedReason: null, createsBranch: false,
  createPullRequestAfterPushBlockedReason: null, createPullRequestBlockedReason: null,
  pushAfterCommitBlockedReason: null, pushBlockedReason: null });
assert.equal(capabilities.canCommitPushAndCreatePullRequest, true);
assert.equal(capabilities.canCreatePullRequest, true);
assert.equal(capabilities.canPushAndCreatePullRequest, true);
assert.equal(actions.X({ ...capabilities, createsBranch: false, includeLocalChanges: true }), "commit-push-and-create-pr");
assert.equal(actions.X({ canCommitPushAndCreatePullRequest: false, canCreatePullRequest: false, canPushAndCreatePullRequest: true, createsBranch: true, includeLocalChanges: true }), "push-and-create-pr");
assert.equal(actions.X({ canCommitPushAndCreatePullRequest: false, canCreatePullRequest: true, canPushAndCreatePullRequest: false, createsBranch: false, includeLocalChanges: true }), "create-pr");
assert.equal(actions.X({ canCommitPushAndCreatePullRequest: true, canCreatePullRequest: true, canPushAndCreatePullRequest: true, createsBranch: true, includeLocalChanges: false }), "push-and-create-pr");
assert.deepEqual(actions.U({ ...capabilities, canCommitPushAndCreatePullRequest: false, commitBlockedReason: "no-changes", nextStep: "commit-push-and-create-pr" }), { kind: "commit", reason: "no-changes" });
assert.deepEqual(actions.U({ ...capabilities, canPushAndCreatePullRequest: false, nextStep: "push-and-create-pr", pushBlockedReason: "nothing-to-push" }), { kind: "push", reason: "nothing-to-push" });
assert.equal(actions.U({ ...capabilities, nextStep: "create-pr" }), null);

const diffResults = [{ type: "success", files: [
  { path: "src/a.ts", additions: 3, deletions: 1 },
  { path: "src/b.ts", previousPath: "src/old.ts", additions: 2, deletions: 4 },
] }, { type: "error", files: [] }];
assert.deepEqual(actions.J(diffResults), { files: [
  { path: "src/a.ts", additions: 3, deletions: 1 }, { path: "src/b.ts", additions: 2, deletions: 4 },
], totalAdditions: 5, totalDeletions: 5 });
assert.deepEqual(actions.q("./a/src/a.ts", diffResults), { linesAdded: 3, linesRemoved: 1 });
assert.deepEqual(actions.q("'src/old.ts'", diffResults), { linesAdded: 2, linesRemoved: 4 });
assert.equal(actions.q("missing.ts", diffResults), null);
const prPrompt = actions.s({ baseBranch: "main", headBranch: "feature", filePaths: ["a.ts", "b.ts"], pullRequestInstructions: "Keep it small", uncommittedDiff: null });
assert.match(prPrompt, /Head: feature/);
assert.match(prPrompt, /Base: main/);
assert.match(prPrompt, /Keep it small/);
assert.match(prPrompt, /- a.ts/);
assert.equal(actions.l("creating-branch"), "Creating branch…");
assert.equal(actions.h({ currentBranch: "feature", storedThreadBranch: "old" }), "feature");
assert.equal(actions.h({ storedThreadBranch: "old" }), "old");
assert.deepEqual(actions.N({ cwd: "/repo", hostId: "local", ignored: true }), { cwd: "/repo", hostId: "local" });
assert.deepEqual(actions.nt({ cwd: "/repo", hostConfig: { id: "local" } }), { cwd: "/repo", hostConfig: { id: "local" }, operationSource: "local_conversation_git_actions" });

actions.n();
let changed = "";
const branchField = actions.t({ branchAlreadyExists: true, placeholder: "codex/feature", value: "feature", onChange: (value) => { changed = value; } });
assert.equal(branchField.type, "div");
assert.equal(branchField.props.children[0].type, "input");
assert.equal(branchField.props.children[1].props.children, "Branch already exists");
branchField.props.children[0].props.onChange({ target: { value: "next" } });
assert.equal(changed, "next");
let stopped = false;
branchField.props.children[0].props.onKeyDown({ key: "Enter", metaKey: false, ctrlKey: false, stopPropagation: () => { stopped = true; } });
assert.equal(stopped, true);
assert.equal(actions.Q({ reason: "no-changes" }).props.children, "No changes to commit");
assert.equal(actions.et({ reason: "nothing-to-push" }).props.children, "No new commits to push");
assert.equal(actions.$({ blockedStep: null }), null);

const branches = await loadModule("git-branch-switcher");
branches.n();
const hostConfig = { id: "local" };
assert.equal(branches.h({ cwd: "/workspace/my-repo/", hostConfig }), "my-repo");
assert.equal(branches.h({ cwd: "/workspace/repo", repo: "org/repo", hostConfig }), "org/repo");
assert.deepEqual(branches.u("/repo", hostConfig, "composer"), { method: "recent-branches", params: { root: "/repo", operationSource: "composer", limit: 100 }, hostConfig });
const statusQuery = branches.c("/repo", hostConfig, "composer");
assert.equal(statusQuery.method, "status-summary");
assert.equal(statusQuery.params.includeUntrackedFiles, false);
assert.equal(statusQuery.liveQuery.params.includeUntrackedFiles, true);
assert.match(branches.s({ cwd: "/repo", enabled: true, hostConfig, operationSource: "composer", query: "feat" }), /"query":"feat"/);
const checkout = branches.f({ cwd: "/repo", hostConfig, hostId: "local" }, "composer");
assert.deepEqual(checkout.mutationKey, ["vscode", "git-checkout-branch", "/repo", "local"]);
assert.equal((await checkout.mutationFn({ branch: "feature" })).status, "success");
const create = branches.r({ cwd: "/repo", hostConfig, hostId: "local" }, "composer");
assert.equal((await create.mutationFn({ branch: "new", mode: "worktree" })).params.branch, "new");
const header = branches.a({ showSetPrefix: true });
assert.equal(header.props.children[0].props.children, "Branch name");
assert.equal(header.props.children[1].props.children, "Set prefix");
assert.equal(branches.p({ id: "git-dialog" }).props.role, "dialog");
let opened = false;
const switcher = branches.t({ cwd: "/repo", gitRoot: "/repo", hostConfig, open: false, onOpenChange: (value) => { opened = value; } });
assert.equal(switcher.props.children[0].props.children, "repo");
switcher.props.children[0].props.onClick();
assert.equal(opened, true);
assert.equal(branches.t({ cwd: "/repo", hostConfig, shouldShow: false }), null);

const environments = await loadModule("worktree-environment-dropdown");
environments.n();
let startingState;
const starting = environments.s({ gitRootOverride: "/repo", hostConfig, startingState: { type: "branch", branchName: "main" }, setStartingState: (value) => { startingState = value; } });
assert.equal(starting.type.name, "BranchSwitcher");
starting.props.onSelectBranch("refs/remotes/origin/feature");
assert.deepEqual(startingState, { type: "branch", branchName: "origin/feature", remoteRef: "refs/remotes/origin/feature" });
assert.equal(environments.a({ value: "Node 22" }).props.children, "Node 22");
assert.equal(environments.r({ cwd: "/repo", hostConfig }).type.name, "BranchSwitcher");
let selected = "unset";
const environmentDropdown = environments.t({ environments: [{ configPath: ".codex/dev.toml", name: "Development" }], selectedConfigPath: ".codex/dev.toml", workspaceRoot: "/repo", onSelectConfigPath: (value) => { selected = value; } });
assert.equal(environmentDropdown.props.children[0].props.children, "Development");
assert.equal(environmentDropdown.props.children[1], null);
assert.equal(environmentDropdown.props.children[2].props.children.length, 2);
environmentDropdown.props.children[2].props.children[0].props.onClick();
assert.equal(selected, null);
environmentDropdown.props.children[2].props.children[1].props.onClick();
assert.equal(selected, ".codex/dev.toml");
const loadingEnvironment = environments.t({ environments: [], isLoading: true, workspaceRoot: "/repo" });
assert.equal(loadingEnvironment.props.children[0].props.children, "Loading environments…");

console.log("git branch and worktree cluster: 66 assertions");
