import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  applyPatch,
  parseApplyPatchResult,
  parsePatchPaths,
  pathExists,
  stageExistingPatchPaths,
} = require("../app/.vite/build/worker/git-apply-patch.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

const emptyParsed = {
  appliedPaths: [],
  skippedPaths: [],
  conflictedPaths: [],
};

deepEqual(parseApplyPatchResult("", ""), emptyParsed);
deepEqual(
  parseApplyPatchResult(
    [
      "Applied patch alpha.txt cleanly.",
      "Applied patch to 'space name.txt' cleanly",
      "Applied patch zeta.txt cleanly.",
    ].join("\n"),
    "",
  ),
  {
    appliedPaths: ["alpha.txt", "space name.txt", "zeta.txt"],
    skippedPaths: [],
    conflictedPaths: [],
  },
);
deepEqual(
  parseApplyPatchResult(
    [
      'Applied patch to "conflict one.txt" with conflicts.',
      "Applying patch conflict-two.txt with 2 rejects...",
      "U conflict-three.txt",
      "warning: Cannot merge binary files: image.bin (ours vs. theirs)",
    ].join("\n"),
    "",
  ),
  {
    appliedPaths: [],
    skippedPaths: [],
    conflictedPaths: ["conflict one.txt", "conflict-three.txt", "conflict-two.txt", "image.bin"],
  },
);
deepEqual(
  parseApplyPatchResult(
    "error: patch failed: one.txt:42\nerror: two.txt: patch does not apply",
    [
      "error: three.txt: does not match index",
      "error: four.txt: does not exist in index",
      "error: five.txt already exists in the working directory",
      "error: patch failed: six.txt File exists",
      "error: path seven.txt has been renamed/deleted",
      "Skipped patch 'eight.txt'.",
    ].join("\n"),
  ),
  {
    appliedPaths: [],
    skippedPaths: ["eight.txt", "five.txt", "four.txt", "one.txt", "seven.txt", "six.txt", "three.txt", "two.txt"],
    conflictedPaths: [],
  },
);
deepEqual(
  parseApplyPatchResult(
    [
      "error: cannot apply binary patch to 'a.bin' without full index line",
      'error: binary patch does not apply to "b.bin"',
      "error: binary patch to 'c.bin' creates incorrect result hash",
      "error: cannot read the current contents of 'd.bin'",
    ].join("\n"),
    "",
  ),
  {
    appliedPaths: [],
    skippedPaths: ["a.bin", "b.bin", "c.bin", "d.bin"],
    conflictedPaths: [],
  },
);
deepEqual(
  parseApplyPatchResult(
    [
      "Checking patch fallback.txt...",
      "Performing three-way merge...",
      "Failed to perform three-way merge...",
      "Checking patch blob.txt...",
      "Falling back to direct application...",
      "repository lacks the necessary blob to perform 3-way merge.",
    ].join("\n"),
    "",
  ),
  { appliedPaths: [], skippedPaths: ["blob.txt", "fallback.txt"], conflictedPaths: [] },
);
deepEqual(
  parseApplyPatchResult(
    "Applied patch same.txt cleanly.\nerror: same.txt: patch does not apply\nApplied patch same.txt with conflicts.",
    "Applied patch same.txt cleanly.",
  ),
  { appliedPaths: ["same.txt"], skippedPaths: [], conflictedPaths: [] },
);

const sampleDiff = [
  "diff --git a/old.txt b/new.txt",
  "diff --git a/shared.txt b/shared.txt",
  "diff --git a/old.txt b/new.txt",
  "diff --git a//dev/null b/created.txt",
  "diff --git a/deleted.txt b//dev/null",
].join("\n");
deepEqual(parsePatchPaths(sampleDiff), ["old.txt", "new.txt", "shared.txt", "created.txt", "deleted.txt"]);
deepEqual(parsePatchPaths("not a patch"), []);

{
  const controller = new AbortController();
  const statCalls = [];
  const host = { stat: async (value) => { statCalls.push(value); } };
  equal(await pathExists("/repo/file", host, controller.signal), true);
  deepEqual(statCalls, ["/repo/file"]);
  equal(await pathExists("/repo/missing", { stat: async () => { throw Error("ENOENT"); } }), false);
  controller.abort();
  await rejects(() => pathExists("/repo/file", host, controller.signal), /aborted/i);
  equal(statCalls.length, 1);
}

function createFixture(options = {}) {
  const calls = {
    copyIndex: [],
    debug: [],
    getIndex: [],
    git: [],
    invalidate: 0,
    normalize: [],
    remove: [],
    repository: [],
    stat: [],
    temporaryDirectory: [],
    warning: [],
    write: [],
  };
  const host = {
    platformPath: async () => options.pathApi ?? path.posix,
    stat: async (value) => {
      calls.stat.push(value);
      if (options.statDelays?.[value]) await options.statDelays[value]();
      if (options.missingPaths?.includes(value)) throw Error("ENOENT");
      return {};
    },
    writeFile: async (...args) => {
      calls.write.push(args);
      if (options.writeError) throw options.writeError;
    },
    remove: async (...args) => {
      calls.remove.push(args);
      if (options.removeError) throw options.removeError;
    },
  };
  let repositoryReads = 0;
  const repository = options.repository ?? { root: "/repo", host };
  const gitManager = {
    getWorktreeRepository: async (...args) => {
      calls.repository.push(args);
      repositoryReads += 1;
      if (options.repositorySequence) return options.repositorySequence[repositoryReads - 1] ?? null;
      return repository;
    },
    invalidateStableMetadata: () => { calls.invalidate += 1; },
  };
  const dependencies = {
    copyIndexToTemporaryDirectory: async (...args) => {
      calls.copyIndex.push(args);
      return options.temporaryIndex ?? "/tmp/codex-apply/index";
    },
    createLogger: (tag) => ({
      debug: (...args) => calls.debug.push([tag, ...args]),
      warning: (...args) => calls.warning.push([tag, ...args]),
    }),
    createTemporaryDirectory: async (...args) => {
      calls.temporaryDirectory.push(args);
      return "/tmp/codex-apply";
    },
    formatExecOutput: (value) => ({ formatted: value }),
    getIndexContext: async (...args) => {
      calls.getIndex.push(args);
      if (options.indexError) throw options.indexError;
      return options.indexContext === undefined ? { indexPath: "/repo/.git/index" } : options.indexContext;
    },
    normalizeCwd: (cwd) => {
      calls.normalize.push(cwd);
      return `normalized:${cwd}`;
    },
    normalizePatchPath: (pathApi, root, base, value) => {
      if (options.normalizePatchPath) return options.normalizePatchPath(pathApi, root, base, value);
      return value.replaceAll("\\", "/");
    },
    runGit: async (...args) => {
      calls.git.push(args);
      if (options.onRunGit) return options.onRunGit(...args);
      if (options.gitError) throw options.gitError;
      if (args[1][0] === "add") return options.addResult ?? { success: true, code: 0, stdout: "", stderr: "" };
      return options.applyResult ?? {
        success: true,
        code: 0,
        stdout: "Applied patch a.txt cleanly.",
        stderr: "",
      };
    },
  };
  return { calls, dependencies, gitManager, host, repository };
}

const twoPathDiff = "diff --git a/a.txt b/a.txt\ndiff --git a/missing.txt b/missing.txt";

{
  const state = createFixture({ missingPaths: ["/repo/missing.txt"] });
  await stageExistingPatchPaths(
    "/repo",
    twoPathDiff,
    state.host,
    { env: { X: "1" }, gitConfigOverrides: ["safe.directory=/repo"] },
    state.dependencies,
  );
  deepEqual(state.calls.stat, ["/repo/a.txt", "/repo/missing.txt"]);
  deepEqual(state.calls.git[0].slice(0, 3), ["/repo", ["add", "--", "a.txt"], state.host]);
  deepEqual(state.calls.git[0][3], {
    configOverrides: ["safe.directory=/repo"],
    env: { X: "1" },
    signal: undefined,
  });
}

{
  let releaseSlow;
  const slow = new Promise((resolve) => { releaseSlow = resolve; });
  const state = createFixture({
    statDelays: { "/repo/a.txt": async () => slow },
  });
  const pending = stageExistingPatchPaths(
    "/repo",
    twoPathDiff,
    state.host,
    {},
    state.dependencies,
  );
  await new Promise((resolve) => setImmediate(resolve));
  releaseSlow();
  await pending;
  deepEqual(state.calls.git[0][1], ["add", "--", "missing.txt", "a.txt"]);
}

{
  const state = createFixture({ missingPaths: ["/repo/a.txt", "/repo/missing.txt"] });
  await stageExistingPatchPaths("/repo", twoPathDiff, state.host, {}, state.dependencies);
  equal(state.calls.git.length, 0);
  const noPaths = createFixture();
  await stageExistingPatchPaths("/repo", "", noPaths.host, {}, noPaths.dependencies);
  equal(noPaths.calls.stat.length, 0);
  equal(noPaths.calls.git.length, 0);
}

{
  const controller = new AbortController();
  const state = createFixture({
    onRunGit: async () => ({ success: false, code: 128, stdout: "", stderr: "add failed" }),
  });
  await stageExistingPatchPaths("/repo", twoPathDiff, state.host, { signal: controller.signal }, state.dependencies);
  equal(state.calls.git.length, 1);

  const canceled = createFixture({
    statDelays: {
      "/repo/a.txt": async () => controller.abort(),
    },
  });
  await rejects(
    () => stageExistingPatchPaths("/repo", twoPathDiff, canceled.host, { signal: controller.signal }, canceled.dependencies),
    /aborted|canceled/i,
  );
  equal(canceled.calls.git.length, 0);
}

{
  const state = createFixture({ repositorySequence: [null, null] });
  deepEqual(
    await applyPatch({ cwd: "/cwd", diff: "patch" }, state.gitManager, state.host, {}, state.dependencies),
    { ...emptyParsed, status: "error", errorCode: "not-git-repo" },
  );
  deepEqual(state.calls.normalize, ["/cwd"]);
  equal(state.calls.repository.length, 2);
  equal(state.calls.invalidate, 1);
  equal(state.calls.temporaryDirectory.length, 0);
}

{
  const controller = new AbortController();
  controller.abort();
  const state = createFixture();
  deepEqual(
    await applyPatch({ cwd: "/cwd", diff: "patch" }, state.gitManager, state.host, { signal: controller.signal }, state.dependencies),
    { ...emptyParsed, status: "error" },
  );
  equal(state.calls.temporaryDirectory.length, 0);
}

{
  const signal = new AbortController().signal;
  const state = createFixture({ missingPaths: ["/repo/missing.txt"] });
  const result = await applyPatch(
    { cwd: "/cwd", diff: twoPathDiff, env: { BASE: "yes" }, allowBinary: true, revert: true },
    state.gitManager,
    state.host,
    { gitConfigOverrides: ["x=y"], signal },
    state.dependencies,
  );
  equal(result.status, "success");
  deepEqual(result.appliedPaths, ["a.txt"]);
  deepEqual(state.calls.temporaryDirectory[0], [state.host, "codex-apply-", signal]);
  deepEqual(state.calls.write[0], ["/tmp/codex-apply/patch.diff", twoPathDiff, { signal }]);
  deepEqual(state.calls.copyIndex[0], ["/tmp/codex-apply", { indexPath: "/repo/.git/index" }, state.host]);
  deepEqual(state.calls.git[0][1], ["add", "--", "a.txt"]);
  deepEqual(state.calls.git[1][1], ["apply", "-R", "--binary", "--3way", "/tmp/codex-apply/patch.diff"]);
  deepEqual(state.calls.git[1][3], {
    allowedNonZeroExitCodes: [1],
    configOverrides: ["x=y"],
    env: { BASE: "yes", GIT_INDEX_FILE: "/tmp/codex-apply/index" },
    signal,
  });
  deepEqual(state.calls.remove, [["/tmp/codex-apply", { recursive: true, force: true }]]);
  equal(state.calls.debug.length, 1);
  deepEqual(state.calls.debug[0][2].safe, {
    revert: true,
    target: "unstaged",
    code: 0,
    stdoutLength: 28,
    stderrLength: 0,
    appliedCount: 1,
    skippedCount: 0,
    conflictedCount: 0,
  });
  deepEqual(result.execOutput, {
    formatted: {
      command: "apply -R --binary --3way /tmp/codex-apply/patch.diff",
      stdout: "Applied patch a.txt cleanly.",
      stderr: "",
    },
  });
}

{
  const state = createFixture({ indexContext: null, applyResult: { code: 1, stdout: "", stderr: "error: x.txt: patch does not apply" } });
  const result = await applyPatch(
    { cwd: "/cwd", diff: "patch" },
    state.gitManager,
    state.host,
    {},
    state.dependencies,
  );
  equal(result.status, "partial-success");
  deepEqual(result.skippedPaths, ["x.txt"]);
  equal(state.calls.warning.length, 1);
  equal(state.calls.git.length, 1);
  deepEqual(state.calls.git[0][1], ["apply", "--3way", "/tmp/codex-apply/patch.diff"]);
}

for (const [target, expectedFlag] of [["staged", "--cached"], ["staged-and-unstaged", "--index"]]) {
  const state = createFixture();
  await applyPatch(
    { cwd: "/cwd", diff: "patch", target },
    state.gitManager,
    state.host,
    {},
    state.dependencies,
  );
  equal(state.calls.getIndex.length, 0);
  equal(state.calls.git.length, 1);
  deepEqual(state.calls.git[0][1], ["apply", "--3way", expectedFlag, "/tmp/codex-apply/patch.diff"]);
}

{
  const state = createFixture({ applyResult: { code: 1, stdout: "", stderr: "" } });
  const result = await applyPatch(
    { cwd: "/cwd", diff: "patch", atomic: true },
    state.gitManager,
    state.host,
    {},
    state.dependencies,
  );
  equal(result.status, "error");
  equal(state.calls.getIndex.length, 0);
  deepEqual(state.calls.git[0][1], ["apply", "/tmp/codex-apply/patch.diff"]);
}

{
  const state = createFixture({ applyResult: { code: null, stdout: "", stderr: "" } });
  equal(
    (await applyPatch({ cwd: "/cwd", diff: "patch" }, state.gitManager, state.host, {}, state.dependencies)).status,
    "error",
  );
}

{
  const controller = new AbortController();
  const state = createFixture({
    onRunGit: async (root, args) => {
      if (args[0] === "add") return { success: true, code: 0, stdout: "", stderr: "" };
      controller.abort();
      return { code: 0, stdout: "", stderr: "" };
    },
  });
  const result = await applyPatch(
    { cwd: "/cwd", diff: twoPathDiff },
    state.gitManager,
    state.host,
    { signal: controller.signal },
    state.dependencies,
  );
  equal(result.status, "error");
  equal(state.calls.remove.length, 1);
}

{
  const failure = Error("index failed");
  const state = createFixture({ indexError: failure });
  await rejects(
    () => applyPatch({ cwd: "/cwd", diff: "patch" }, state.gitManager, state.host, {}, state.dependencies),
    failure,
  );
  deepEqual(state.calls.remove, [["/tmp/codex-apply", { recursive: true, force: true }]]);
}

console.log(`git apply patch tests passed (${assertions} assertions)`);
