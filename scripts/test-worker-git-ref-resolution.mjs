import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isGitObjectId, resolveGitRefSha } = require(
  "../app/.vite/build/worker/git-ref-resolution.js",
);

let assertions = 0;
const equal = (...args) => {
  assertions += 1;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertions += 1;
  assert.deepEqual(...args);
};
const rejects = async (...args) => {
  assertions += 1;
  await assert.rejects(...args);
};

for (const value of ["abcdef0", "A".repeat(40), "0123456789abcdef"]) equal(isGitObjectId(value), true);
for (const value of ["abcdef", "a".repeat(41), "xyzxyzx", "", "abc def0"]) equal(isGitObjectId(value), false);

function fixture(result = { success: true, stdout: "ABCDEF0\n" }) {
  const calls = { fetch: [], invalidate: [], normalize: [], run: [] };
  const host = { id: "local" };
  const repository = {
    root: "/repo",
    host,
    queryClient: {
      invalidateQueries: async (options) => { calls.invalidate.push(options); },
      fetchQuery: async (options) => {
        calls.fetch.push(options);
        return options.queryFn();
      },
    },
  };
  const dependencies = {
    getQueryMeta: () => ({ family: "refs" }),
    normalizeSha: (sha) => {
      calls.normalize.push(sha);
      return `sha:${sha}`;
    },
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return result;
    },
    staleTime: Infinity,
  };
  return { calls, dependencies, host, repository };
}

const signal = new AbortController().signal;
let state = fixture();
equal(
  await resolveGitRefSha(state.repository, "HEAD", signal, {}, state.dependencies),
  "sha:ABCDEF0",
);
equal(state.calls.invalidate.length, 0);
deepEqual(state.calls.fetch[0].queryKey, ["key", "/repo", state.host, "ref-sha", "HEAD"]);
deepEqual(state.calls.fetch[0].meta, { family: "refs" });
equal(state.calls.fetch[0].staleTime, Infinity);
deepEqual(state.calls.run[0], [
  "/repo",
  ["rev-parse", "--verify", "--quiet", "HEAD"],
  state.host,
  { allowedNonZeroExitCodes: [1], signal },
]);
deepEqual(state.calls.normalize, ["ABCDEF0"]);

state = fixture();
await resolveGitRefSha(state.repository, "topic", signal, { fresh: true }, state.dependencies);
deepEqual(state.calls.invalidate, [{
  queryKey: ["key", "/repo", state.host, "ref-sha", "topic"],
  exact: true,
  refetchType: "none",
}]);

state = fixture({ success: true, stdout: "  \n" });
equal(await resolveGitRefSha(state.repository, "missing", signal, {}, state.dependencies), null);
equal(state.calls.normalize.length, 0);

state = fixture({ success: false, stdout: "" });
await rejects(
  resolveGitRefSha(state.repository, "broken", signal, {}, state.dependencies),
  /Git ref lookup failed/,
);
state = fixture({ success: true, stdout: "not-an-object-id" });
await rejects(
  resolveGitRefSha(state.repository, "broken", signal, {}, state.dependencies),
  /invalid object ID/,
);

console.log(`${assertions} worker git ref resolution assertions passed`);
