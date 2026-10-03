import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getGitBlobDiff,
  getUntrackedWorkingTreeDiff,
  readWorkingTreeSymlink,
} = require("../app/.vite/build/worker/git-review-file-diff.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};
const rejects = async (...args) => {
  count++;
  await assert.rejects(...args);
};

function fixture(options = {}) {
  const calls = {
    fetch: [],
    git: [],
    gitDiff: [],
    read: 0,
    runGit: [],
    spawn: [],
    stat: [],
  };
  const host = {
    platformPath: async () => options.pathApi ?? path.posix,
    platformFamily: async () => options.platformFamily ?? "posix",
    spawn: async (config) => {
      calls.spawn.push(config);
      return { process: true };
    },
    stat: async (...args) => {
      calls.stat.push(args);
      return {
        isSymbolicLink: () => options.kind === "symlink",
        isDirectory: () => options.kind === "directory",
      };
    },
  };
  const queryClient = {
    async fetchQuery(config) {
      calls.fetch.push(config);
      return options.returnQueryConfig ? config : config.queryFn();
    },
  };
  const worktreeRepo = { root: options.root ?? "/repo", host, queryClient };
  const reviewSnapshot = {
    worktreeRepo,
    signal: new AbortController().signal,
    queryKey: (...parts) => ["snapshot", ...parts],
    git: async (...args) => {
      calls.git.push(args);
      return options.hashResult ?? { success: true, stdout: "abcdef123456\n" };
    },
    gitDiff: async (...args) => {
      calls.gitDiff.push(args);
      return options.diffResult ?? {
        success: true,
        stdout: "diff output",
        stdoutBytes: 11,
        outputLimitExceeded: false,
      };
    },
    read: async (callback) => {
      calls.read++;
      return callback();
    },
  };
  const dependencies = {
    collectProcessResult: async () =>
      options.processResult ?? { code: 0, stdout: "target\n" },
    getQueryMeta: () => ({ scope: "review" }),
    parseGitError: (result) => ({ type: "parsed", result }),
    quoteGitDiffPath: (value) =>
      value.includes(" ") ? `"${value}"` : value,
    runGit: async (...args) => {
      calls.runGit.push(args);
      return options.runGitResult ?? {
        success: true,
        stdout: "1234567890abcdef\n",
      };
    },
  };
  return { calls, dependencies, host, reviewSnapshot, worktreeRepo };
}

let state = fixture({ returnQueryConfig: true });
let query = await getGitBlobDiff(
  state.reviewSnapshot,
  "old",
  "new",
  { binary: true, hideWhitespace: true },
  state.dependencies,
);
deepEqual(query.queryKey, [
  "snapshot",
  "review-blob-diff",
  "binary",
  ["--ignore-all-space", "--full-index", "old", "new"],
]);
equal(query.gcTime, 250);
equal(query.staleTime, 250);
deepEqual(query.meta, { scope: "review" });
await query.queryFn();
deepEqual(state.calls.gitDiff[0], [
  ["--ignore-all-space", "--full-index", "old", "new"],
  { allowedNonZeroExitCodes: [0, 1], binary: true, trim: false },
]);

state = fixture();
deepEqual(
  await readWorkingTreeSymlink(
    state.reviewSnapshot,
    "link",
    state.dependencies,
  ),
  { oid: "abcdef123456", target: "target" },
);
equal(state.calls.read, 1);
deepEqual(state.calls.spawn[0].args, ["readlink", "/repo/link"]);
equal(state.calls.spawn[0].cwd, "/repo");
equal(state.calls.spawn[0].outputBytesCap, 64000);
equal(state.calls.spawn[0].timeoutMs, 10000);
deepEqual(state.calls.git[0], [["hash-object", "--stdin"], { stdin: "target" }]);

state = fixture({ platformFamily: "windows", pathApi: path.win32 });
await readWorkingTreeSymlink(
  state.reviewSnapshot,
  "link",
  state.dependencies,
);
deepEqual(state.calls.spawn[0].args.slice(0, 4), [
  "powershell.exe",
  "-NoProfile",
  "-NonInteractive",
  "-Command",
]);
equal(state.calls.spawn[0].args.at(-1), "\\repo\\link");
deepEqual(state.calls.git[0][1], { stdin: "target\n" });

state = fixture({ processResult: { code: 1, stdout: "" } });
await rejects(
  readWorkingTreeSymlink(state.reviewSnapshot, "link", state.dependencies),
  /Failed to read working-tree symlink/,
);
state = fixture({ hashResult: { success: false, stdout: "" } });
await rejects(
  readWorkingTreeSymlink(state.reviewSnapshot, "link", state.dependencies),
  /Failed to hash working-tree symlink/,
);

state = fixture({ kind: "symlink" });
let result = await getUntrackedWorkingTreeDiff(
  state.reviewSnapshot,
  "link name",
  {},
  state.dependencies,
);
equal(result.type, "success");
equal(result.unifiedDiff.includes('diff --git "a/link name" "b/link name"'), true);
equal(result.unifiedDiff.includes("new file mode 120000"), true);
equal(result.unifiedDiff.includes("\\ No newline at end of file"), true);
equal(result.unifiedDiffBytes, Buffer.byteLength(result.unifiedDiff, "utf8"));
deepEqual(state.calls.stat[0][1], { bypassCache: true, followSymlinks: false });

state = fixture({ kind: "directory" });
result = await getUntrackedWorkingTreeDiff(
  state.reviewSnapshot,
  "module",
  {},
  state.dependencies,
);
equal(result.type, "success");
equal(result.unifiedDiff.includes("new file mode 160000"), true);
equal(result.unifiedDiff.includes("Subproject commit 1234567890abcdef"), true);
deepEqual(state.calls.runGit[0][1], ["rev-parse", "--verify", "HEAD^{commit}"]);
equal(state.calls.runGit[0][0], "/repo/module");
equal(state.calls.runGit[0][3].signal, state.reviewSnapshot.signal);

state = fixture({
  kind: "directory",
  runGitResult: { success: false, stdout: "" },
});
deepEqual(
  await getUntrackedWorkingTreeDiff(
    state.reviewSnapshot,
    "module",
    {},
    state.dependencies,
  ),
  { type: "error", error: { type: "unknown" } },
);

state = fixture();
deepEqual(
  await getUntrackedWorkingTreeDiff(
    state.reviewSnapshot,
    "file.txt",
    { binary: true },
    state.dependencies,
  ),
  { type: "success", unifiedDiff: "diff output", unifiedDiffBytes: 11 },
);
deepEqual(state.calls.gitDiff[0], [
  ["--no-index", "--", "/dev/null", "file.txt"],
  { allowedNonZeroExitCodes: [0, 1], binary: true, trim: false },
]);

const failedDiff = {
  success: false,
  stdout: "bad",
  stdoutBytes: 3,
  outputLimitExceeded: false,
};
state = fixture({ diffResult: failedDiff });
deepEqual(
  await getUntrackedWorkingTreeDiff(
    state.reviewSnapshot,
    "file.txt",
    {},
    state.dependencies,
  ),
  { type: "error", error: { type: "parsed", result: failedDiff } },
);

console.log(`${count} worker git review file diff assertions passed`);
