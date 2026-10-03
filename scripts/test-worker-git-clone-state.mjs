import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getGitCloneState,
  hasPartialCloneConfiguration,
  noLazyFetchEnvironment,
  parseGitConfigEntries,
  partialCloneConfigPattern,
} = require("../app/.vite/build/worker/git-clone-state.js");

let count = 0;
const equal = (...args) => { count += 1; assert.equal(...args); };
const deepEqual = (...args) => { count += 1; assert.deepEqual(...args); };

deepEqual(noLazyFetchEnvironment, { GIT_NO_LAZY_FETCH: "1" });
equal(
  partialCloneConfigPattern,
  "^(extensions\\.partialclone|remote\\..*\\.(promisor|partialclonefilter))$",
);

const entries = parseGitConfigEntries(
  "extensions.partialclone origin\nremote.origin.promisor true\nremote.origin.partialclonefilter blob:none\nkey value with spaces\nempty",
);
equal(entries.get("extensions.partialclone"), "origin");
equal(entries.get("remote.origin.promisor"), "true");
equal(entries.get("remote.origin.partialclonefilter"), "blob:none");
equal(entries.get("key"), "value with spaces");
equal(entries.get("empty"), "");

for (const value of ["", "1", "on", "ON", "true", "TRUE", "yes", "YES"])
  equal(hasPartialCloneConfiguration(new Map([["remote.origin.promisor", value]])), true);
for (const value of ["0", "off", "false", "no", "arbitrary"])
  equal(hasPartialCloneConfiguration(new Map([["remote.origin.promisor", value]])), false);
equal(hasPartialCloneConfiguration(new Map([["extensions.partialclone", ""]])), true);
equal(hasPartialCloneConfiguration(new Map([["remote.upstream.partialclonefilter", ""]])), true);
equal(hasPartialCloneConfiguration(new Map([["remote.origin.url", "partialclone"]])), false);

const host = { id: "local" };
const signal = new AbortController().signal;
const calls = [];
let releaseShallow;
let releaseConfig;
const shallowGate = new Promise((resolve) => { releaseShallow = resolve; });
const configGate = new Promise((resolve) => { releaseConfig = resolve; });
const pending = getGitCloneState("/repo", host, signal, {
  runGit: async (...args) => {
    calls.push(args);
    if (args[1][0] === "rev-parse") {
      await shallowGate;
      return { success: true, stdout: "true" };
    }
    await configGate;
    return { success: true, stdout: "remote.origin.promisor yes" };
  },
});
await new Promise((resolve) => setImmediate(resolve));
equal(calls.length, 2);
deepEqual(calls[0], [
  "/repo",
  ["rev-parse", "--is-shallow-repository"],
  host,
  { env: noLazyFetchEnvironment, signal },
]);
deepEqual(calls[1], [
  "/repo",
  ["config", "--get-regexp", partialCloneConfigPattern],
  host,
  { allowedNonZeroExitCodes: [1], env: noLazyFetchEnvironment, signal },
]);
releaseShallow();
releaseConfig();
deepEqual(await pending, { isPartialClone: true, isShallow: true });

deepEqual(
  await getGitCloneState("/repo", host, signal, {
    runGit: async (_root, args) =>
      args[0] === "rev-parse"
        ? { success: false, stdout: "true" }
        : { success: false, stdout: "extensions.partialclone origin" },
  }),
  { isPartialClone: false, isShallow: false },
);
deepEqual(
  await getGitCloneState("/repo", host, signal, {
    runGit: async (_root, args) =>
      args[0] === "rev-parse"
        ? { success: true, stdout: "false" }
        : { success: true, stdout: "remote.origin.promisor false" },
  }),
  { isPartialClone: false, isShallow: false },
);

console.log(`${count} worker git clone state assertions passed`);
