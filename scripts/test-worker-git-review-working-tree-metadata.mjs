import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  ReviewWorkingTreeMetadataBatcher,
  chunkUntrackedMetadataPaths,
  fetchReviewWorkingTreeFileMetadata,
  getReviewWorkingTreeMetadata,
  hashRegularWorkingTreeFiles,
  isUnsupportedBatchedUntrackedDiff,
  parseBatchedUntrackedDiffMetadata,
  parseUntrackedDiffMetadata,
  prepareWorkingTreeMetadataBatch,
  readPreparedWorkingTreeFile,
  readUntrackedDiffMetadata,
  readUntrackedDiffMetadataBatch,
  runMetadataWorkers,
  runNoIndexMetadataWorkers,
} = require("../app/.vite/build/worker/git-review-working-tree-metadata.js");

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

const oid40 = "a".repeat(40);
const oid64 = "b".repeat(64);

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function stat(kind = "file") {
  return {
    isDirectory: () => kind === "directory",
    isSymbolicLink: () => kind === "symlink",
  };
}

function singleDiffOutput(filePath, additions = "1", deletions = "2") {
  return (
    `:000000 100644 ${"0".repeat(40)} ${oid40} A\0${filePath}\0` +
    `${additions}\t${deletions}\t${filePath}\0`
  );
}

function batchedDiffOutput(root, paths) {
  return (
    paths
      .flatMap((filePath, index) => [
        `:000000 10064${index} ${"0".repeat(40)} ${oid40} A`,
        path.posix.join(root, filePath),
        `${index + 1}\t${index + 2}\t`,
        "",
        path.posix.join(root, filePath),
      ])
      .join("\0") + "\0"
  );
}

function fixture(options = {}) {
  const calls = {
    git: [],
    gitDiff: [],
    queries: [],
    remove: [],
    runGit: [],
    stat: [],
    symlink: [],
    temp: [],
  };
  const host = {
    platformPath: async () => options.pathApi ?? path.posix,
    stat: async (...args) => {
      calls.stat.push(args);
      if (options.statError) throw options.statError;
      const relativePath = (options.pathApi ?? path.posix).basename(args[0]);
      return stat(options.kinds?.[relativePath] ?? "file");
    },
    remove: async (...args) => {
      calls.remove.push(args);
    },
  };
  const queryClient = {
    async fetchQuery(config) {
      calls.queries.push(config);
      return options.returnQueryConfig ? config : config.queryFn();
    },
  };
  const worktreeRepo = {
    root: options.root ?? "/repo",
    host,
    queryClient,
    getReviewWorkingTreeFileGeneration: (filePath) =>
      options.generation?.[filePath] ?? 7,
    getReviewWorkingTreeFileReadPaths: (filePath) => [
      filePath,
      `${filePath}.meta`,
    ],
  };
  const reviewSnapshot = {
    worktreeRepo,
    signal: new AbortController().signal,
    read: async (callback) => callback(),
    git: async (...args) => {
      calls.git.push(args);
      return options.gitResult ?? { success: true, stdout: `${oid40}\n` };
    },
    gitDiff: async (...args) => {
      calls.gitDiff.push(args);
      if (options.gitDiff) return options.gitDiff(...args);
      return {
        success: true,
        code: 1,
        stderr: "",
        stdout: singleDiffOutput(args[0].at(-1)),
      };
    },
  };
  const dependencies = {
    byteLength: (value) => Buffer.byteLength(value, "utf8"),
    createDeferred: deferred,
    createTemporaryDirectory: async (...args) => {
      calls.temp.push(args);
      if (options.tempError) throw options.tempError;
      return "/tmp/empty";
    },
    getQueryMeta: () => ({ scope: "review" }),
    normalizePathFromRoot: (_pathApi, root, _targetRoot, value) =>
      value.replace(`${root}/`, "").replaceAll("\\", "/"),
    queryKey: (root, currentHost, type, ...parts) => [
      root,
      currentHost === host ? "host" : "other",
      type,
      ...parts,
    ],
    quoteGitPath: (value) => (value.includes(" ") ? `"${value}"` : value),
    readWorkingTreeSymlink: async (...args) => {
      calls.symlink.push(args);
      return options.symlinkResult ?? { oid: "link-oid", target: "one\ntwo" };
    },
    runGit: async (...args) => {
      calls.runGit.push(args);
      return options.runGitResult ?? { success: true, stdout: "submodule-oid\n" };
    },
    staleTime: Infinity,
  };
  return { calls, dependencies, host, queryClient, reviewSnapshot, worktreeRepo };
}

let state = fixture();
deepEqual(chunkUntrackedMetadataPaths([], state.dependencies), []);
let batches = chunkUntrackedMetadataPaths(
  Array.from({ length: 257 }, (_, index) => `file-${index}`),
  state.dependencies,
);
equal(batches.length, 2);
equal(batches[0].length, 256);
equal(batches[1].length, 1);
batches = chunkUntrackedMetadataPaths(["x".repeat(15980), "next"], state.dependencies);
equal(batches.length, 2);
deepEqual(chunkUntrackedMetadataPaths(["你好"], state.dependencies), [["你好"]]);

equal(
  isUnsupportedBatchedUntrackedDiff({
    code: 129,
    stderr: "fatal: Limiting comparison with pathspecs is unsupported",
  }),
  true,
);
equal(
  isUnsupportedBatchedUntrackedDiff({
    code: 129,
    stderr: "usage: git diff --no-index",
  }),
  true,
);
equal(isUnsupportedBatchedUntrackedDiff({ code: 1, stderr: "usage: git diff --no-index" }), false);

deepEqual(parseUntrackedDiffMetadata(singleDiffOutput("a.txt")), {
  additions: 1,
  deletions: 2,
  mode: "100644",
});
deepEqual(parseUntrackedDiffMetadata(singleDiffOutput("binary", "-", "-")), {
  additions: null,
  deletions: null,
  mode: "100644",
});
assert.throws(() => parseUntrackedDiffMetadata("bad\0"), /Failed to parse/);
count++;

state = fixture();
let parsed = parseBatchedUntrackedDiffMetadata(
  batchedDiffOutput("/repo", ["a.txt", "b.txt"]),
  "/repo",
  ["a.txt", "b.txt"],
  path.posix,
  state.dependencies,
);
deepEqual(parsed.get("a.txt"), { additions: 1, deletions: 2, mode: "100640" });
deepEqual(parsed.get("b.txt"), { additions: 2, deletions: 3, mode: "100641" });
assert.throws(
  () =>
    parseBatchedUntrackedDiffMetadata(
      batchedDiffOutput("/repo", ["unexpected.txt"]),
      "/repo",
      ["expected.txt"],
      path.posix,
      state.dependencies,
    ),
  /Unexpected batched untracked Git path/,
);
count++;
assert.throws(
  () =>
    parseBatchedUntrackedDiffMetadata(
      "1\t2\t\0\0",
      "/repo",
      ["a.txt"],
      path.posix,
      state.dependencies,
    ),
  /Failed to parse|Missing batched|Unexpected batched/,
);
count++;

state = fixture({ gitResult: { success: true, stdout: `${oid40}\n${oid64}\n` } });
const prepared = new Map([
  ["a.txt", { stat: stat("file") }],
  ["space name.txt", { stat: stat("file") }],
]);
await hashRegularWorkingTreeFiles(
  state.reviewSnapshot,
  ["a.txt", "space name.txt"],
  prepared,
  state.dependencies,
);
deepEqual(state.calls.git[0], [
  ["hash-object", "--stdin-paths"],
  { stdin: 'a.txt\n"space name.txt"\n' },
]);
equal(prepared.get("a.txt").oid, oid40);
equal(prepared.get("space name.txt").oid, oid64);
state = fixture({ gitResult: { success: false, stdout: "" } });
await rejects(
  hashRegularWorkingTreeFiles(
    state.reviewSnapshot,
    ["a"],
    new Map([["a", { stat: stat() }]]),
    state.dependencies,
  ),
  /Failed to hash/,
);
state = fixture({ gitResult: { success: true, stdout: "BAD\n" } });
await rejects(
  hashRegularWorkingTreeFiles(
    state.reviewSnapshot,
    ["a"],
    new Map([["a", { stat: stat() }]]),
    state.dependencies,
  ),
  /Failed to parse/,
);

let active = 0;
let peak = 0;
await runMetadataWorkers(
  Array.from({ length: 20 }, (_, index) => `${index}`),
  async () => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
  },
);
equal(peak, 8);
await rejects(
  runMetadataWorkers(["a"], async () => {
    throw "failure";
  }),
  /Review metadata worker failed/,
);
active = 0;
peak = 0;
await runNoIndexMetadataWorkers(
  Array.from({ length: 20 }, (_, index) => `${index}`),
  async () => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
  },
);
equal(peak, 8);

state = fixture({ kinds: { dir: "directory", link: "symlink" } });
let metadata = await prepareWorkingTreeMetadataBatch(
  state.reviewSnapshot,
  ["file", "dir", "link"],
  async (filePath, value) => ({ filePath, oid: value.oid ?? null }),
  async (regularFiles) => {
    deepEqual(regularFiles, ["file"]);
  },
  state.dependencies,
);
equal(metadata.get("file").oid, oid40);
equal(metadata.get("dir").oid, null);
equal(metadata.get("link").oid, null);
deepEqual(state.calls.stat[0][1], { bypassCache: true, followSymlinks: false });

state = fixture({ returnQueryConfig: true });
const fakeBatcher = { read: (filePath) => Promise.resolve({ filePath }) };
let query = await fetchReviewWorkingTreeFileMetadata(
  state.reviewSnapshot,
  "a.txt",
  true,
  fakeBatcher,
  state.dependencies,
);
deepEqual(query.queryKey, [
  "/repo",
  "host",
  "review-working-tree-file-metadata",
  "with-diff",
  "a.txt",
  "7",
]);
deepEqual(query.meta, {
  scope: "review",
  gitReadPaths: ["a.txt", "a.txt.meta"],
});
equal(query.staleTime, Infinity);
deepEqual(await query.queryFn(), { filePath: "a.txt" });

state = fixture();
deepEqual(
  await readPreparedWorkingTreeFile(
    state.reviewSnapshot,
    "file",
    { stat: stat(), oid: "file-oid" },
    false,
    null,
    state.dependencies,
  ),
  { additions: null, deletions: null, mode: null, oid: "file-oid" },
);
deepEqual(
  await readPreparedWorkingTreeFile(
    state.reviewSnapshot,
    "file",
    { stat: stat(), oid: "file-oid" },
    true,
    { additions: 3, deletions: 4, mode: "100644" },
    state.dependencies,
  ),
  { additions: 3, deletions: 4, mode: "100644", oid: "file-oid" },
);
await rejects(
  readPreparedWorkingTreeFile(
    state.reviewSnapshot,
    "file",
    { stat: stat(), oid: "file-oid" },
    true,
    null,
    state.dependencies,
  ),
  /Missing working-tree diff metadata/,
);
deepEqual(
  await readPreparedWorkingTreeFile(
    state.reviewSnapshot,
    "module",
    { stat: stat("directory") },
    false,
    null,
    state.dependencies,
  ),
  { additions: 1, deletions: 0, mode: "160000", oid: "submodule-oid" },
);
deepEqual(state.calls.runGit[0][1], ["rev-parse", "--verify", "HEAD^{commit}"]);
deepEqual(
  await readPreparedWorkingTreeFile(
    state.reviewSnapshot,
    "link",
    { stat: stat("symlink") },
    false,
    null,
    state.dependencies,
  ),
  { additions: 2, deletions: 0, mode: "120000", oid: "link-oid" },
);

state = fixture();
metadata = await getReviewWorkingTreeMetadata(
  state.reviewSnapshot,
  ["a.txt", "a.txt"],
  {},
  state.dependencies,
);
equal(metadata.size, 1);
equal(metadata.get("a.txt").oid, oid40);
equal(state.calls.stat.length, 1);
equal(state.calls.queries.length, 2);

state = fixture({ statError: Error("stat failed") });
equal(
  await getReviewWorkingTreeMetadata(
    state.reviewSnapshot,
    ["a.txt"],
    {},
    state.dependencies,
  ),
  null,
);

state = fixture();
metadata = await readUntrackedDiffMetadata(
  state.reviewSnapshot,
  "a.txt",
);
deepEqual(metadata, { additions: 1, deletions: 2, mode: "100644" });
deepEqual(state.calls.gitDiff[0], [
  ["--no-index", "--raw", "--numstat", "-z", "--", "/dev/null", "a.txt"],
  { allowedNonZeroExitCodes: [0, 1], trim: false },
]);

state = fixture({
  gitDiff: async (args) => ({
    success: true,
    code: 1,
    stderr: "",
    stdout: batchedDiffOutput("/repo", args.slice(7).map((value) => value.slice(10))),
  }),
});
metadata = await readUntrackedDiffMetadataBatch(
  state.reviewSnapshot,
  ["a.txt", "b.txt"],
  state.dependencies,
);
equal(metadata.size, 2);
equal(state.calls.temp.length, 1);
deepEqual(state.calls.remove[0], ["/tmp/empty", { recursive: true, force: true }]);
deepEqual(state.calls.gitDiff[0][0].slice(0, 8), [
  "--no-index",
  "--raw",
  "--numstat",
  "-z",
  "--",
  "/tmp/empty",
  "/repo",
  ":(literal)a.txt",
]);

state = fixture();
metadata = await readUntrackedDiffMetadataBatch(
  state.reviewSnapshot,
  ["only.txt"],
  state.dependencies,
);
equal(metadata.size, 1);
equal(state.calls.temp.length, 0);
equal(state.calls.gitDiff[0][0].includes("/dev/null"), true);

const batchState = fixture();
const batcher = new ReviewWorkingTreeMetadataBatcher(
  batchState.reviewSnapshot,
  async (filePath, value) => ({ filePath, oid: value.oid }),
  undefined,
  batchState.dependencies,
);
const first = batcher.read("a.txt");
const duplicate = batcher.read("a.txt");
equal(first, duplicate);
batcher.start();
deepEqual(await first, { filePath: "a.txt", oid: oid40 });

console.log(`${count} worker git review working-tree metadata assertions passed`);
