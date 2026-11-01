import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__gitReviewFoundationsTest = {
  initialized: [],
  liveQueries: [],
  parsedDiff: [],
  scopedSignal: null,
});

globalThis.window = {
  getComputedStyle: () => ({
    getPropertyValue: (name) => (name === "--diffs-gap-block" ? "7px" : ""),
    lineHeight: "21px",
  }),
};

function appInitialMock() {
  return `
    export const XO = () => globalThis.__gitReviewFoundationsTest.parsedDiff;
    export const YO = () => globalThis.__gitReviewFoundationsTest.initialized.push("patch-parser");
    export class hvn {
      constructor() { this.top = 100; globalThis.__gitReviewFoundationsController = this; }
      getLinePosition(line, side) { return line === 7 && side === "right" ? { height: 18, top: 42 } : null; }
      setSelectedLines(selection, options) { globalThis.__gitReviewFoundationsTest.selection = { selection, options }; }
    }
    globalThis.__gitReviewFoundationsController = new hvn();
    export const L_n = () => globalThis.__gitReviewFoundationsTest.initialized.push("virtual-diff");
    export const PSn = ".virtual-diff";
    export const Kan = () => globalThis.__gitReviewFoundationsTest.initialized.push("live-git");
    export const Yan = (...args) => { globalThis.__gitReviewFoundationsTest.liveQueries.push(args); return { args }; };
    export const By = value => ({ identity: value });
    export const Hy = () => globalThis.__gitReviewFoundationsTest.initialized.push("pr-key");
    export const Vy = value => ["pull-request", value];
    export const Cy = { id: "search" }; export const Sy = { id: "media" };
    export const _y = value => ({ detail: value }); export const by = { id: "detail" };
    export const gy = { id: "current-user" }; export const vy = value => ["account", value];
    export const xy = { id: "diff" }; export const yy = () => globalThis.__gitReviewFoundationsTest.initialized.push("pr-queries");
    export const CSt = () => globalThis.__gitReviewFoundationsTest.initialized.push("origins");
    export const SSt = { id: "origins-query" };
    export const $st = "review-file-source";
    export const Qst = value => ({ opened: value }); export const Xst = value => "review:" + value;
    export const Zst = () => globalThis.__gitReviewFoundationsTest.initialized.push("review-tab");
    export const ect = value => ({ toggled: value });
    export const cut = () => globalThis.__gitReviewFoundationsTest.initialized.push("review-tab-sync");
    export const lut = value => ({ synced: value }); export const sut = value => value.cwd;
    export const mnt = () => globalThis.__gitReviewFoundationsTest.initialized.push("app-runtime");
    export const pnt = { github: { available: true } };
    export const z2t = () => ({ default: values => [...new Set(values)] });
  `;
}

function mockChunk(name) {
  if (name === "app-shared")
    return `
      export const $3 = () => {};
      export const FX = () => globalThis.__gitReviewFoundationsTest.initialized.push("signals");
      export const QI = () => globalThis.__gitReviewFoundationsTest.initialized.push("scope");
      export const ZI = { id: "app-scope" };
      export const sZ = (scope, factory) => {
        const signal = { scope, factory };
        globalThis.__gitReviewFoundationsTest.scopedSignal = signal;
        return signal;
      };
    `;
  if (name === "app-initial") return appInitialMock();
  if (name === "pull-request-code-review-navigation-core")
    return `
      export const n = () => globalThis.__gitReviewFoundationsTest.initialized.push("navigation");
      export const r = value => ({ requested: value });
      export const t = value => "file:" + value;
    `;
  if (name === "pull-request-revision-queries-core")
    return `
      export const a = { id: "revision-diff" }; export const i = { id: "capability" };
      export const n = () => globalThis.__gitReviewFoundationsTest.initialized.push("revision-queries");
      export const r = { id: "snapshot" }; export const t = value => ({ loader: value });
    `;
  return "export const sideEffect = true;";
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({ contents: mockChunk(importPath), loader: "js" }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const summary = await bundle("diff-summary");
assert.deepEqual(summary.t([]), { fileCount: 0, hasChanges: false, linesAdded: 0, linesDeleted: 0 });
assert.deepEqual(summary.t([{ additions: 3, deletions: 2 }, { additions: 0, deletions: 4 }]), {
  fileCount: 2,
  hasChanges: true,
  linesAdded: 3,
  linesDeleted: 6,
});

const reviewState = await bundle("git-action-review-state");
assert.deepEqual(reviewState.t({ currentBranch: " main ", storedThreadBranch: "main" }), {
  currentBranchName: "main",
  hasThreadBranchMismatch: false,
  storedThreadBranchName: "main",
});
assert.equal(reviewState.t({ currentBranch: "feature", storedThreadBranch: "main" }).hasThreadBranchMismatch, true);
assert.equal(reviewState.t({ currentBranch: "feature", storedThreadBranch: " " }).hasThreadBranchMismatch, false);

const patchStats = await bundle("patch-diff-stats");
patchStats.n();
assert.equal(state.initialized.includes("patch-parser"), true);
state.parsedDiff = [{ additions: 5, deletions: 2, firstAdditionLine: 9 }];
assert.deepEqual(patchStats.t("@@\n+line\n-line", "src/a.ts"), {
  added: 5,
  deleted: 2,
  openLocation: { line: 9, path: "src/a.ts" },
});
state.parsedDiff = [];
assert.deepEqual(patchStats.t("--- a\n+++ b\n+one\n-two", "src/b.ts"), {
  added: 1,
  deleted: 1,
  openLocation: { line: 1, path: "src/b.ts" },
});
assert.equal(patchStats.t("context", "src/c.ts"), null);
assert.equal(patchStats.t(null, "src/c.ts"), null);

const metrics = await bundle("review-diff-virtualizer-metrics");
assert.equal(metrics.r(10).lineHeight, 18);
assert.equal(metrics.r(12).hunkLineCount, 32);
assert.deepEqual(metrics.n({}), { ...metrics.r(12), lineHeight: 21, spacing: 7 });
assert.equal(metrics.t(metrics.r(12), { ...metrics.r(12) }), true);
assert.equal(metrics.t(metrics.r(12), { ...metrics.r(12), spacing: 1 }), false);

const linePosition = await bundle("virtualized-file-diff-line-position");
linePosition.n();
assert.equal(state.initialized.includes("virtual-diff"), true);
const virtualElement = {};
const root = { querySelector: (selector) => selector === ".virtual-diff" ? virtualElement : null };
linePosition.r(virtualElement, globalThis.__gitReviewFoundationsController);
assert.deepEqual(linePosition.t(root, 7, "right"), { height: 18, top: 142 });
assert.equal(linePosition.t(root, 8, "right"), undefined);
linePosition.i(root, { start: 1, end: 2 });
assert.deepEqual(state.selection, { selection: { start: 1, end: 2 }, options: { notify: true } });

const detail = await bundle("pull-request-detail-model");
detail.s();
const items = [
  { id: 1, reviewThreadId: "thread-1", url: "https://one" },
  { id: 2, reviewThreadId: "thread-1", url: "https://two" },
];
const lookup = detail.t(items);
assert.equal(lookup.byReviewThreadId.get("thread-1").id, 1);
assert.equal(detail.n({ reviewThreadId: "thread-1" }, lookup).id, 1);
assert.equal(detail.n({ url: "https://two" }, lookup).id, 2);
assert.equal(detail.n({ url: "https://missing" }, lookup), null);
assert.deepEqual(detail.r([{ type: "event" }, { type: "comment", id: 1 }, { type: "commit_group" }]), [{ type: "comment", id: 1 }]);
assert.equal(detail.i({ path: null }, null), null);
assert.deepEqual(detail.i({ line: 5, path: "a.ts", side: "RIGHT", startLine: 3 }, null), {
  line: 5,
  path: "a.ts",
  side: "RIGHT",
  start_line: 3,
  start_side: undefined,
});
assert.deepEqual(detail.i({}, { position: { line: 2, path: "b.ts", side: "LEFT" } }), { line: 2, path: "b.ts", side: "LEFT" });
assert.equal(detail.o("open", "closed", false), "close");
assert.equal(detail.o("open", "draft", false), "mark-draft");
assert.equal(detail.o("closed", "open", false), "reopen");
assert.equal(detail.o("closed", "open", true), "reopen-ready");
assert.equal(detail.o("draft", "open", false), "mark-ready");
const reviewers = detail.a({
  requested: ["alice", "team-x"], requestedTeams: ["team-x"], approved: ["bob", "alice"],
  changesRequested: ["carol"], commented: ["bob"], avatarUrlsByLogin: { alice: "a.png" },
});
assert.deepEqual(reviewers.map(({ label }) => label), ["alice", "team-x", "bob", "carol"]);
assert.deepEqual(reviewers.find(({ label }) => label === "alice"), { avatarUrl: "a.png", kind: "user", label: "alice", status: "approved" });
assert.equal(reviewers.find(({ label }) => label === "team-x").kind, "team");
assert.equal(reviewers.find(({ label }) => label === "carol").status, "changes_requested");
detail.c();
assert.equal(state.scopedSignal.scope.id, "app-scope");
assert.equal(state.scopedSignal.factory(), true);

const recentBranches = await bundle("use-git-recent-branches");
recentBranches.r();
recentBranches.t();
assert.equal(state.initialized.filter((value) => value === "live-git").length, 2);
recentBranches.i("host", [{ root: "/repo" }], "review", { enabled: true });
let call = state.liveQueries.at(-1);
assert.equal(call[2], "base-branch");
assert.deepEqual(call[3]({ root: "/repo" }), { operationSource: "review", root: "/repo" });
assert.deepEqual(call[5].liveQuery({ root: "/repo", operationSource: "review" }), { method: "base-branch", params: { root: "/repo", operationSource: "review" } });
recentBranches.n("host", [{ root: "/repo" }], "composer", { limit: 12 });
call = state.liveQueries.at(-1);
assert.equal(call[2], "recent-branches");
assert.deepEqual(call[3]({ root: "/repo" }), { limit: 12, operationSource: "composer", root: "/repo" });
assert.deepEqual(call[5].select({ branches: ["main", "dev"] }), ["main", "dev"]);

const origins = await bundle("git-origins-query");
assert.equal(origins.gitOriginsQuery$.id, "origins-query");
assert.equal(state.initialized.includes("origins"), true);
const queryKey = await bundle("pull-request-query-key");
assert.deepEqual(queryKey.getPullRequestQueryIdentity("pr-1"), { identity: "pr-1" });
assert.deepEqual(queryKey.getPullRequestQueryKey("pr-1"), ["pull-request", "pr-1"]);
assert.equal(state.initialized.includes("pr-key"), true);
const queries = await bundle("pull-request-queries");
assert.equal(queries.currentGitHubUserQuery$.id, "current-user");
assert.deepEqual(queries.fetchPullRequestDetail("pr-2"), { detail: "pr-2" });
assert.deepEqual(queries.getPullRequestSearchAccountQueryPrefix("acct"), ["account", "acct"]);
assert.equal(queries.pullRequestDiffQuery$.id, "diff");
assert.equal(state.initialized.includes("pr-queries"), true);

const reviewTab = await bundle("review-file-source-tab");
assert.equal(reviewTab.reviewFileSourceTabType, "review-file-source");
assert.equal(reviewTab.getReviewFileSourceTabId("a.ts"), "review:a.ts");
assert.deepEqual(reviewTab.openReviewFileSourceTab("a.ts"), { opened: "a.ts" });
assert.deepEqual(reviewTab.toggleReviewFileSourceTab("a.ts"), { toggled: "a.ts" });
assert.equal(state.initialized.includes("review-tab"), true);
const reviewTabSync = await bundle("review-file-source-tab-sync");
assert.equal(reviewTabSync.getFileTabCwd({ cwd: "/repo" }), "/repo");
assert.deepEqual(reviewTabSync.syncOpenWorkspaceFileSidePanelTabs("tab-1"), { synced: "tab-1" });
assert.equal(state.initialized.includes("review-tab-sync"), true);

const navigation = await bundle("pull-request-code-review-navigation");
assert.equal(navigation.getPullRequestCodeFileId("a.ts"), "file:a.ts");
assert.deepEqual(navigation.requestPullRequestCodeLocation({ line: 9 }), { requested: { line: 9 } });
assert.equal(state.initialized.includes("navigation"), true);
const revisions = await bundle("pull-request-revision-queries");
assert.equal(revisions.pullRequestRevisionCapability$.id, "capability");
assert.equal(revisions.pullRequestReviewSnapshotQuery$.id, "snapshot");
assert.equal(revisions.pullRequestRevisionDiffQuery$.id, "revision-diff");
assert.deepEqual(revisions.createPullRequestRevisionFileLoader("a.ts"), { loader: "a.ts" });
assert.equal(state.initialized.includes("revision-queries"), true);

console.log("git review foundations assertions passed");
