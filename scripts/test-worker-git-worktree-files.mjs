import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  batchGitLiteralPathspecs,
  listGitWorktreeFiles,
  readGitIndexFingerprint,
  readGitUntrackedFiles,
  readGitWorktreeFilesFallback,
  readGitWorktreeFilesWithStatus,
  readStableGitWorktreeFiles,
  resolveGitIndexPath,
  splitNullSeparatedPaths,
} = require("../app/.vite/build/worker/git-worktree-files.js");

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

deepEqual(splitNullSeparatedPaths("a\0\0b\0"), ["a", "b"]);
deepEqual(batchGitLiteralPathspecs([], Buffer.byteLength), []);
deepEqual(batchGitLiteralPathspecs(["dir/"], Buffer.byteLength), [[":(literal)dir/"]]);
deepEqual(
  batchGitLiteralPathspecs(["a".repeat(7988), "b"], Buffer.byteLength),
  [[`:(literal)${"a".repeat(7988)}`], [":(literal)b"]],
);

const baseHost = {
  platformPath: async () => path.posix,
  stat: async () => ({ size: 3, mtimeMs: 4, ctimeMs: 5, ino: 6 }),
};
const callLog = [];
const dependencyWith = (runGit) => ({
  getQueryMeta: () => ({ scope: "test" }),
  queryKey: (root, host, type) => [root, host, type],
  runGit: async (...args) => {
    callLog.push(args);
    return runGit(...args);
  },
  utf8ByteLength: Buffer.byteLength,
});

equal(await readGitIndexFingerprint("/repo/.git/index", baseHost), "3:4:5:6");
equal(
  await readGitIndexFingerprint("/repo/.git/index", {
    stat: async () => {
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
  }),
  "missing",
);
equal(
  await readGitIndexFingerprint("/repo/.git/index", {
    stat: async () => {
      throw new Error("offline");
    },
  }),
  null,
);

callLog.length = 0;
let dependencies = dependencyWith(async () => ({ success: true, stdout: ".git/index" }));
equal(await resolveGitIndexPath("/repo", baseHost, dependencies), "/repo/.git/index");
deepEqual(callLog[0][1], ["rev-parse", "--git-path", "index"]);

dependencies = dependencyWith(async () => ({ success: true, stdout: "/index" }));
equal(await resolveGitIndexPath("/repo", baseHost, dependencies), "/index");
dependencies = dependencyWith(async () => ({ success: false, stdout: "" }));
equal(await resolveGitIndexPath("/repo", baseHost, dependencies), null);

dependencies = dependencyWith(async () => ({ success: true, stdout: "a\0b\0" }));
deepEqual(await readGitWorktreeFilesFallback("/repo", baseHost, dependencies), ["a", "b"]);
dependencies = dependencyWith(async () => ({ success: false, stdout: "", stderr: "bad" }));
await rejects(
  readGitWorktreeFilesFallback("/repo", baseHost, dependencies),
  /git ls-files failed: bad/,
);

callLog.length = 0;
dependencies = dependencyWith(async (_root, args) => {
  if (args[0] === "status")
    return { success: true, stdout: " M tracked\0?? loose.txt\0?? cache/\0!! ignored\0" };
  return { success: true, stdout: "cache/a.txt\0cache/b.txt\0" };
});
deepEqual(await readGitUntrackedFiles("/repo", baseHost, dependencies), [
  "loose.txt",
  "cache/a.txt",
  "cache/b.txt",
]);
equal(callLog.length, 2);
deepEqual(callLog[1][1], [
  "ls-files",
  "--others",
  "--exclude-standard",
  "-z",
  "--",
  ":(literal)cache/",
]);
equal(callLog[0][3].timeoutMs, null);
equal(callLog[1][3].timeoutMs, null);

dependencies = dependencyWith(async () => ({ success: false, stdout: "status output", stderr: "" }));
await rejects(readGitUntrackedFiles("/repo", baseHost, dependencies), /git status failed: status output/);

dependencies = dependencyWith(async (_root, args) =>
  args[0] === "status"
    ? { success: true, stdout: "?? cache/\0" }
    : { success: false, stdout: "", stderr: "expand failed" },
);
await rejects(readGitUntrackedFiles("/repo", baseHost, dependencies), /git ls-files failed: expand failed/);

dependencies = dependencyWith(async (_root, args) =>
  args[0] === "status"
    ? { success: true, stdout: "?? loose.txt\0" }
    : { success: true, stdout: "tracked.txt\0" },
);
deepEqual(await readGitWorktreeFilesWithStatus("/repo", baseHost, dependencies), [
  "tracked.txt",
  "loose.txt",
]);

dependencies = dependencyWith(async (_root, args) =>
  args[0] === "status"
    ? { success: true, stdout: "" }
    : { success: false, stdout: "tracked failed", stderr: "" },
);
await rejects(
  readGitWorktreeFilesWithStatus("/repo", baseHost, dependencies),
  /git ls-files failed: tracked failed/,
);

let statValues = [
  { size: 1, mtimeMs: 2, ctimeMs: 3, ino: 4 },
  { size: 1, mtimeMs: 2, ctimeMs: 3, ino: 4 },
];
const stableHost = {
  platformPath: async () => path.posix,
  stat: async () => statValues.shift(),
};
dependencies = dependencyWith(async (_root, args) => {
  if (args[0] === "rev-parse") return { success: true, stdout: ".git/index" };
  if (args[0] === "status") return { success: true, stdout: "?? loose\0" };
  return { success: true, stdout: "tracked\0" };
});
deepEqual(await readStableGitWorktreeFiles("/repo", stableHost, dependencies), [
  "tracked",
  "loose",
]);

let statCounter = 0;
const changingHost = {
  platformPath: async () => path.posix,
  stat: async () => ({ size: ++statCounter, mtimeMs: 0, ctimeMs: 0, ino: 0 }),
};
let fallbackCalls = 0;
dependencies = dependencyWith(async (_root, args) => {
  if (args[0] === "rev-parse") return { success: true, stdout: ".git/index" };
  if (args[0] === "status") return { success: true, stdout: "" };
  if (args.includes("--cached") && args.includes("--others")) {
    fallbackCalls++;
    return { success: true, stdout: "fallback\0" };
  }
  return { success: true, stdout: "unstable\0" };
});
deepEqual(await readStableGitWorktreeFiles("/repo", changingHost, dependencies), ["fallback"]);
equal(fallbackCalls, 1);
equal(statCounter, 4);

const queryCalls = [];
const repository = {
  root: "/repo",
  host: baseHost,
  queryClient: {
    fetchQuery(options) {
      queryCalls.push(options);
      return "query-result";
    },
  },
};
dependencies = dependencyWith(async () => ({ success: false, stdout: "" }));
equal(listGitWorktreeFiles(repository, dependencies), "query-result");
deepEqual(queryCalls[0].queryKey, ["/repo", baseHost, "worktree-files"]);
equal(queryCalls[0].gcTime, 250);
equal(queryCalls[0].staleTime, 250);
deepEqual(queryCalls[0].meta, { scope: "test" });
equal(typeof queryCalls[0].queryFn, "function");

console.log(`${count} worker git worktree files assertions passed`);
