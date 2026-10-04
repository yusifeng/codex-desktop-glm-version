import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES,
  assertRepositorySize,
  formatByteSize,
  parseCountObjects,
  readRawRootCountObjects,
  readRepositoryCountObjects,
  runGitChecked,
} = require("../app/.vite/build/worker/git-repository-size.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };
const throws = (...args) => { assertions += 1; assert.throws(...args); };

equal(MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES, 209_715_200);
equal(formatByteSize(0), "0 B");
equal(formatByteSize(1023), "1023 B");
equal(formatByteSize(1024), "1.0 KB");
equal(formatByteSize(1024 * 1024), "1.0 MB");
equal(formatByteSize(1536), "1.5 KB");
equal(formatByteSize(1024 ** 4), "1.0 TB");

deepEqual([...parseCountObjects("count: 3\nsize: 12\r\nsize-pack: 7\ngarbage\nprune-packable: nope\n")], [
  ["count", 3],
  ["size", 12],
  ["size-pack", 7],
]);
equal(parseCountObjects("size: 1\nsize: 2\n").get("size"), 2);
equal(parseCountObjects("size: 4:ignored\n").get("size"), 4);

const host = { id: "local" };
let calls = [];
const dependencies = {
  getQueryMeta: () => ({ scope: "test" }),
  queryKey: (...args) => ["key", ...args],
  runGit: async (...args) => { calls.push(args); return { success: true, stdout: "size: 1\nsize-pack: 2\n" }; },
};

equal(
  await runGitChecked("/repo", ["count-objects", "-v"], host, dependencies),
  "size: 1\nsize-pack: 2\n",
);
deepEqual(calls[0], ["/repo", ["count-objects", "-v"], host]);

await rejects(
  runGitChecked("/repo", ["status"], host, {
    runGit: async () => ({ success: false, stderr: "bad", stdout: "fallback" }),
  }),
  /git status failed: bad/,
);
await rejects(
  runGitChecked("/repo", ["status"], host, {
    runGit: async () => ({ success: false, stderr: "", stdout: "fallback" }),
  }),
  /git status failed: fallback/,
);

calls = [];
equal(await readRawRootCountObjects("/repo", host, dependencies), "size: 1\nsize-pack: 2\n");
throws(() => readRawRootCountObjects("/repo", null, dependencies), /host is required/);

let queryOptions;
const repository = {
  root: "/repo",
  host,
  queryClient: {
    fetchQuery(options) {
      queryOptions = options;
      return "cached";
    },
  },
};
equal(readRepositoryCountObjects(repository, dependencies), "cached");
deepEqual(queryOptions.queryKey, ["key", "/repo", host, "count-objects"]);
equal(queryOptions.gcTime, 250);
equal(queryOptions.staleTime, 250);
deepEqual(queryOptions.meta, { scope: "test" });
equal(await queryOptions.queryFn(), "size: 1\nsize-pack: 2\n");

dependencies.runGit = async () => ({ success: false, stderr: "count failed", stdout: "" });
await rejects(queryOptions.queryFn(), /git count-objects -v failed: count failed/);

const directDependencies = {
  ...dependencies,
  runGit: async () => ({ success: true, stdout: "size: 10\nsize-pack: 5\n" }),
};
await assertRepositorySize("/repo", 15 * 1024, host, directDependencies);
await rejects(
  assertRepositorySize("/repo", 14 * 1024, host, directDependencies),
  /Repository is too large \(15\.0 KB\)\. Maximum allowed size is 14\.0 KB\./,
);

let repositoryQueryCalls = 0;
const sizeRepository = {
  root: "/repo",
  host,
  queryClient: {
    async fetchQuery(options) {
      repositoryQueryCalls += 1;
      return options.queryFn();
    },
  },
};
await assertRepositorySize(sizeRepository, 16 * 1024, undefined, directDependencies);
equal(repositoryQueryCalls, 1);

console.log(`${assertions} worker git repository size assertions passed`);
