import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  DEFAULT_REMOTE,
  fetchRemoteDefaultBranch,
  getConventionalDefaultBranch,
  getDefaultBranchForRemote,
  getDefaultRemoteBranch,
  getLocallyKnownDefaultBranch,
  getOrderedRemotes,
  getUpstreamRef,
  hasRemoteTrackingBranch,
  selectDefaultRemoteBranch,
} = require("../app/.vite/build/worker/git-remote-branches.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

function fixture(results = []) {
  const calls = { fetch: [], run: [] };
  const queue = [...results];
  const repository = {
    root: "/repo",
    host: { id: "local" },
    queryClient: {
      fetchQuery: async (options) => {
        calls.fetch.push(options);
        return options.queryFn();
      },
    },
  };
  const dependencies = {
    getConfigQueryMeta: () => ({ family: "config" }),
    getRemoteRefsQueryMeta: () => ({ family: "remote-refs" }),
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return queue.shift() ?? { success: false, stdout: "", code: 1 };
    },
    staleTime: Infinity,
  };
  return { calls, dependencies, repository };
}

equal(DEFAULT_REMOTE, "origin");
let state = fixture([{ success: true, stdout: "refs/remotes/origin/main" }]);
equal(await getLocallyKnownDefaultBranch(state.repository, undefined, state.dependencies), "main");
deepEqual(state.calls.run[0], [
  "/repo", ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"], state.repository.host,
  { allowedNonZeroExitCodes: [1] },
]);
deepEqual(state.calls.fetch[0].queryKey, [
  "key", "/repo", state.repository.host, "locally-known-default-branch", "origin",
]);
deepEqual(state.calls.fetch[0].meta, { family: "remote-refs" });
equal(state.calls.fetch[0].staleTime, Infinity);

state = fixture([{ success: true, stdout: "refs/remotes/upstream/main" }]);
equal(await getLocallyKnownDefaultBranch(state.repository, "origin", state.dependencies), null);
state = fixture([{ success: false, stdout: "refs/remotes/origin/main" }]);
equal(await getLocallyKnownDefaultBranch(state.repository, "origin", state.dependencies), null);

state = fixture([{ success: true, stdout: "Fetch URL: x\n  HEAD branch:  trunk  \n" }]);
equal(await fetchRemoteDefaultBranch(state.repository, "upstream", state.dependencies), "trunk");
deepEqual(state.calls.run[0], [
  "/repo", ["remote", "show", "upstream"], state.repository.host, { timeoutMs: 10_000 },
]);
deepEqual(state.calls.fetch[0].queryKey, [
  "key", "/repo", state.repository.host, "remote-default-branch", "upstream",
]);
state = fixture([{ success: true, stdout: "HEAD branch: (unknown)" }]);
equal(await fetchRemoteDefaultBranch(state.repository, "origin", state.dependencies), null);
state = fixture([{ success: false, stdout: "HEAD branch: main" }]);
equal(await fetchRemoteDefaultBranch(state.repository, "origin", state.dependencies), null);

state = fixture([{ success: true, stdout: "refs/remotes/origin/main" }]);
equal(await getDefaultBranchForRemote(state.repository, undefined, state.dependencies), "main");
equal(state.calls.run.length, 1);
state = fixture([
  { success: false, stdout: "" },
  { success: true, stdout: "HEAD branch: develop" },
]);
equal(await getDefaultBranchForRemote(state.repository, "origin", state.dependencies), "develop");
equal(state.calls.run.length, 2);

state = fixture([{ success: true, stdout: " upstream \norigin\nbackup\n\n" }]);
deepEqual(await getOrderedRemotes(state.repository, state.dependencies), ["origin", "upstream", "backup"]);
deepEqual(state.calls.run[0], ["/repo", ["remote"], state.repository.host]);
deepEqual(state.calls.fetch[0].meta, { family: "config" });
deepEqual(state.calls.fetch[0].queryKey, ["key", "/repo", state.repository.host, "ordered-remotes"]);
state = fixture([{ success: true, stdout: "upstream\n" }]);
deepEqual(await getOrderedRemotes(state.repository, state.dependencies), ["upstream"]);
state = fixture([{ success: false, stdout: "origin" }]);
deepEqual(await getOrderedRemotes(state.repository, state.dependencies), []);

const signal = new AbortController().signal;
state = fixture([{ success: true, stdout: "origin/main" }]);
equal(await getUpstreamRef(state.repository, "main", signal, state.dependencies), "origin/main");
deepEqual(state.calls.run[0], [
  "/repo", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "main@{u}"],
  state.repository.host, { allowedNonZeroExitCodes: [128, 1], signal },
]);
deepEqual(state.calls.fetch[0].meta, { family: "config" });
state = fixture([{ success: false, stdout: "origin/main" }]);
equal(await getUpstreamRef(state.repository, "main", signal, state.dependencies), null);

state = fixture([{ success: false, stdout: "", code: 0 }]);
equal(await hasRemoteTrackingBranch(state.repository, "origin", "main", state.dependencies), true);
deepEqual(state.calls.run[0][1], [
  "show-ref", "--verify", "--quiet", "refs/remotes/origin/main",
]);
deepEqual(state.calls.run[0][3], { allowedNonZeroExitCodes: [1] });
state = fixture([{ success: true, stdout: "", code: 1 }]);
equal(await hasRemoteTrackingBranch(state.repository, "origin", "main", state.dependencies), false);

state = fixture([{ code: 0 }]);
equal(await getConventionalDefaultBranch(state.repository, "origin", state.dependencies), "main");
equal(state.calls.run.length, 1);
state = fixture([{ code: 1 }, { code: 0 }]);
equal(await getConventionalDefaultBranch(state.repository, "origin", state.dependencies), "master");
equal(state.calls.run.length, 2);
state = fixture([{ code: 1 }, { code: 1 }]);
equal(await getConventionalDefaultBranch(state.repository, "origin", state.dependencies), null);

state = fixture([]);
equal(await selectDefaultRemoteBranch(state.repository, [], state.dependencies), null);
equal(state.calls.run.length, 0);
state = fixture([{ success: true, stdout: "refs/remotes/origin/trunk" }]);
deepEqual(
  await selectDefaultRemoteBranch(state.repository, ["origin", "upstream"], state.dependencies),
  { remote: "origin", branch: "trunk" },
);
equal(state.calls.run.length, 1);
state = fixture([
  { success: false, stdout: "" }, { success: false, stdout: "" },
  { code: 1 }, { code: 1 },
  { success: true, stdout: "refs/remotes/upstream/main" },
]);
deepEqual(
  await selectDefaultRemoteBranch(state.repository, ["origin", "upstream"], state.dependencies),
  { remote: "upstream", branch: "main" },
);
equal(state.calls.run.length, 5);

state = fixture([
  { success: true, stdout: "upstream\norigin\n" },
  { success: true, stdout: "refs/remotes/origin/main" },
]);
deepEqual(await getDefaultRemoteBranch(state.repository, state.dependencies), {
  remote: "origin", branch: "main",
});
deepEqual(state.calls.run.map((call) => call[1]), [
  ["remote"],
  ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"],
]);

console.log(`${assertions} worker git remote branches assertions passed`);
