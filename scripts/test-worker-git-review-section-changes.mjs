import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  applyReviewPatch,
  applyReviewSectionChanges,
  extractGitlinkSha,
  findCleanGitlinkPaths,
  resolveReviewActionPath,
  reviewSectionChangeError,
} = require("../app/.vite/build/worker/git-review-section-changes.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

const signal = new AbortController().signal;
const successResult = {
  status: "success",
  appliedPaths: ["file"],
  skippedPaths: [],
  conflictedPaths: [],
};

function fixture(options = {}) {
  const calls = {
    apply: [],
    clear: 0,
    diff: [],
    files: [],
    invalidate: [],
    normalize: [],
    remove: [],
    repository: [],
    runGit: [],
  };
  const repository = {
    root: "/repo",
    reviewSnapshot: { generation: 2 },
    clearShortLivedGitReadCaches: () => calls.clear++,
  };
  const host = {
    platformPath: async () => path.posix,
    remove: async (...args) => {
      calls.remove.push(args);
      if (options.removeError) throw Error("remove failed");
    },
  };
  const gitManager = {
    getWorktreeRepository: async (...args) => {
      calls.repository.push(args);
      return options.repository === undefined ? repository : options.repository;
    },
  };
  const files = options.inputFiles ?? [
    {
      changeKind: "modified",
      path: "file",
      previousPath: null,
      revision: "revision",
    },
  ];
  const dependencies = {
    applyPatch: async (...args) => {
      calls.apply.push(args);
      const index = calls.apply.length - 1;
      return options.applyResults?.[index] ?? successResult;
    },
    getReviewDiff: async (...args) => {
      calls.diff.push(args);
      if (options.diffError) throw Error("diff failed");
      return options.reviewDiff ?? {
        diffs: Object.fromEntries(
          files.map((file) => [
            file.path.startsWith(".") ? `normalized:${file.path}` : `normalized:${file.path}`,
            { type: "success", diff: "diff-content\n" },
          ]),
        ),
      };
    },
    getReviewFiles: async (params) => {
      calls.files.push(params);
      return options.reviewFiles ?? {
        type: "success",
        files: files.map((file) => ({
          path: `normalized:${file.path}`,
          revision: file.revision,
        })),
      };
    },
    invalidateUntrackedPathsCache: (value) => calls.invalidate.push(value),
    normalizeCwd: (cwd) => `cwd:${cwd}`,
    normalizePathFromRoot: (...args) => {
      calls.normalize.push(args);
      return `normalized:${args[3]}`;
    },
    runGit: async (...args) => {
      calls.runGit.push(args);
      const command = args[1][0];
      const outcome = options.gitOutcomes?.[command];
      if (outcome) return outcome;
      return command === "rev-parse"
        ? { success: true, stdout: options.gitlinkSha ?? "a".repeat(40) }
        : { success: true, stdout: "" };
    },
  };
  return { calls, dependencies, files, gitManager, host, repository };
}

deepEqual(reviewSectionChangeError(), {
  status: "error",
  appliedPaths: [],
  skippedPaths: [],
  conflictedPaths: [],
});
equal(reviewSectionChangeError("not-git-repo").errorCode, "not-git-repo");
equal(extractGitlinkSha("new file mode 100644\n+Subproject commit " + "a".repeat(40)), null);
equal(extractGitlinkSha("new file mode 160000\n+Subproject commit " + "b".repeat(40)), "b".repeat(40));
equal(extractGitlinkSha("new file mode 160000\n+Subproject commit short"), null);

let state = fixture();
equal(
  resolveReviewActionPath(path.posix, "/repo", "/repo/sub", "./file", state.dependencies),
  "normalized:./file",
);
deepEqual(state.calls.normalize[0].slice(1, 3), ["/repo", "/repo/sub"]);
equal(
  resolveReviewActionPath(path.posix, "/repo", "/repo/sub", "file", state.dependencies),
  "normalized:file",
);
deepEqual(state.calls.normalize[1].slice(1, 3), ["/repo", "/repo"]);

state = fixture();
deepEqual(
  await findCleanGitlinkPaths(
    { gitlinks: [], host: state.host, path: path.posix, repoRoot: "/repo", signal },
    state.dependencies,
  ),
  [],
);
equal(state.calls.runGit.length, 0);
deepEqual(
  await findCleanGitlinkPaths(
    {
      gitlinks: [{ path: "sub", sha: "a".repeat(40) }],
      host: state.host,
      path: path.posix,
      repoRoot: "/repo",
      signal,
    },
    state.dependencies,
  ),
  ["/repo/sub"],
);
deepEqual(state.calls.runGit[0], ["/repo/sub", ["rev-parse", "HEAD"], state.host, { signal }]);
deepEqual(state.calls.runGit[1][1], [
  "status",
  "--porcelain=v1",
  "--untracked-files=all",
  "--ignored=matching",
]);

for (const gitOutcomes of [
  { "rev-parse": { success: false, stdout: "" } },
  { status: { success: false, stdout: "" } },
  { "rev-parse": { success: true, stdout: "wrong" } },
  { status: { success: true, stdout: " M dirty" } },
]) {
  state = fixture({ gitOutcomes });
  equal(
    await findCleanGitlinkPaths(
      {
        gitlinks: [{ path: "sub", sha: "a".repeat(40) }],
        host: state.host,
        path: path.posix,
        repoRoot: "/repo",
        signal,
      },
      state.dependencies,
    ),
    null,
  );
}

state = fixture();
await applyReviewPatch(
  {
    host: state.host,
    diff: "patch",
    gitManager: state.gitManager,
    repoRoot: "/repo",
    revert: true,
    signal,
    target: "staged",
  },
  state.dependencies,
);
deepEqual(state.calls.apply[0], [
  {
    allowBinary: true,
    atomic: true,
    cwd: "/repo",
    diff: "patch",
    revert: true,
    target: "staged",
  },
  state.gitManager,
  state.host,
  { signal },
]);

state = fixture({ repository: null });
let result = await applyReviewSectionChanges(
  { action: "stage", cwd: "/missing", files: [], gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(result.errorCode, "not-git-repo");
deepEqual(state.calls.repository[0], ["cwd:/missing", state.host]);

state = fixture({ inputFiles: [] });
result = await applyReviewSectionChanges(
  { action: "stage", cwd: "/repo", files: [], gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(result.status, "error");
equal(state.calls.invalidate.length, 0);

state = fixture();
result = await applyReviewSectionChanges(
  {
    action: "stage",
    cwd: "/repo",
    files: state.files,
    gitManager: state.gitManager,
    host: state.host,
    signal,
    source: "unstaged",
  },
  state.dependencies,
);
equal(result.status, "success");
equal(state.calls.invalidate.length, 1);
equal(state.calls.clear, 2);
equal(state.calls.diff[0][0], state.repository.reviewSnapshot);
equal(state.calls.diff[0][1], "unstaged");
equal(state.calls.diff[0][2][0].path, "normalized:file");
deepEqual(state.calls.diff[0][3], { binary: true });
deepEqual(state.calls.files[0].paths, ["normalized:file"]);
equal(state.calls.apply[0][0].target, "staged");
equal(state.calls.apply[0][0].revert, undefined);

state = fixture({ diffError: true });
result = await applyReviewSectionChanges(
  { action: "stage", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(result.status, "error");
equal(state.calls.files.length, 0);

state = fixture({ reviewFiles: { type: "error" } });
result = await applyReviewSectionChanges(
  { action: "stage", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(result.status, "error");
equal(state.calls.apply.length, 0);

state = fixture({
  reviewFiles: { type: "success", files: [{ path: "normalized:file", revision: "stale" }] },
});
result = await applyReviewSectionChanges(
  { action: "stage", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(result.status, "error");

state = fixture({ reviewDiff: { diffs: {} } });
result = await applyReviewSectionChanges(
  { action: "stage", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(result.status, "error");
equal(state.calls.apply.length, 0);

state = fixture({ reviewDiff: { diffs: { "normalized:file": { type: "success", diff: "   " } } } });
result = await applyReviewSectionChanges(
  { action: "stage", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(result.status, "error");

state = fixture();
await applyReviewSectionChanges(
  { action: "unstage", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal },
  state.dependencies,
);
equal(state.calls.apply[0][0].target, "staged");
equal(state.calls.apply[0][0].revert, true);

const failedPatch = { status: "error", appliedPaths: [], skippedPaths: ["failed"], conflictedPaths: [] };
state = fixture({ applyResults: [failedPatch] });
result = await applyReviewSectionChanges(
  { action: "revert", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal, source: "staged" },
  state.dependencies,
);
equal(result, failedPatch);
equal(state.calls.apply.length, 1);

state = fixture({ applyResults: [successResult, failedPatch] });
result = await applyReviewSectionChanges(
  { action: "revert", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal, source: "staged" },
  state.dependencies,
);
equal(result.status, "partial-success");
deepEqual(state.calls.apply.map((call) => call[0].target), ["staged", "unstaged"]);

state = fixture({ applyResults: [successResult, successResult] });
result = await applyReviewSectionChanges(
  { action: "revert", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal, source: "staged" },
  state.dependencies,
);
equal(result.status, "success");

const sha = "c".repeat(40);
const gitlinkDiff = `new file mode 160000\n+Subproject commit ${sha}\n`;
const gitlinkFile = { changeKind: "untracked", path: "sub", previousPath: null, revision: "gitlink-revision" };
state = fixture({
  gitlinkSha: sha,
  inputFiles: [gitlinkFile],
  reviewDiff: { diffs: { "normalized:sub": { type: "success", diff: gitlinkDiff } } },
});
result = await applyReviewSectionChanges(
  { action: "revert", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal, source: "unstaged" },
  state.dependencies,
);
equal(result.status, "success");
deepEqual(state.calls.remove[0], ["/repo/normalized:sub", { recursive: true, force: true }]);
equal(state.calls.invalidate.length, 2);

state = fixture({
  gitOutcomes: { status: { success: true, stdout: "dirty" } },
  gitlinkSha: sha,
  inputFiles: [gitlinkFile],
  reviewDiff: { diffs: { "normalized:sub": { type: "success", diff: gitlinkDiff } } },
});
result = await applyReviewSectionChanges(
  { action: "revert", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal, source: "unstaged" },
  state.dependencies,
);
equal(result.status, "error");
deepEqual(result.skippedPaths, ["normalized:sub"]);
equal(state.calls.apply.length, 0);

state = fixture({
  gitlinkSha: sha,
  inputFiles: [gitlinkFile],
  removeError: true,
  reviewDiff: { diffs: { "normalized:sub": { type: "success", diff: gitlinkDiff } } },
});
result = await applyReviewSectionChanges(
  { action: "revert", cwd: "/repo", files: state.files, gitManager: state.gitManager, host: state.host, signal, source: "unstaged" },
  state.dependencies,
);
equal(result.status, "partial-success");
deepEqual(result.skippedPaths, ["normalized:sub"]);

console.log(`worker git review section changes tests passed (${count} assertions)`);
