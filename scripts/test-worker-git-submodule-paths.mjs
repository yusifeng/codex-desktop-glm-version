import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getSubmodulePaths } = require(
  "../app/.vite/build/worker/git-submodule-paths.js",
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

function fixture(overrides = {}) {
  const calls = { abortable: [], query: [], run: [], stat: [] };
  const host = {
    id: "local",
    platformPath: async () => ({ join: (...parts) => parts.join("/") }),
    stat: async (...args) => {
      calls.stat.push(args);
      return { size: 10 };
    },
  };
  const repository = {
    root: "/repo",
    host,
    queryClient: {
      fetchQuery: async (options) => {
        calls.query.push(options);
        return options.queryFn();
      },
    },
  };
  const dependencies = {
    awaitAbortable: async (promise, signal) => {
      calls.abortable.push(signal);
      return promise;
    },
    getQueryMeta: () => ({ paths: [".gitmodules"] }),
    isMissingPathError: (error) => error?.code === "ENOENT",
    normalizeGitPath: (path) => path.split(/[/\\]+/).join("/"),
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return {
        success: true,
        stdout: [
          "submodule.alpha.path packages\\alpha",
          "submodule.beta.path packages/beta",
          "submodule.duplicate.path packages\\alpha",
          "",
        ].join("\n"),
      };
    },
    staleTime: Infinity,
    ...overrides,
  };
  return { calls, dependencies, host, repository };
}

const signal = new AbortController().signal;
let state = fixture();
deepEqual(await getSubmodulePaths(state.repository, signal, state.dependencies), [
  "packages/alpha",
  "packages/beta",
]);
deepEqual(state.calls.query[0].queryKey, ["key", "/repo", state.host, "submodule-paths"]);
deepEqual(state.calls.query[0].meta, { paths: [".gitmodules"] });
equal(state.calls.query[0].staleTime, Infinity);
deepEqual(state.calls.stat[0], ["/repo/.gitmodules", { bypassCache: true }]);
equal(state.calls.abortable[0], signal);
deepEqual(state.calls.run[0], [
  "/repo",
  ["config", "--file", ".gitmodules", "--get-regexp", "path"],
  state.host,
  { allowedNonZeroExitCodes: [1], signal },
]);

state = fixture();
await getSubmodulePaths(state.repository, undefined, state.dependencies);
equal(state.calls.abortable.length, 0);

state = fixture();
state.host.stat = async () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); };
deepEqual(await getSubmodulePaths(state.repository, signal, state.dependencies), []);
equal(state.calls.run.length, 0);

state = fixture();
state.host.stat = async () => { throw Object.assign(new Error("permission"), { code: "EACCES" }); };
deepEqual(await getSubmodulePaths(state.repository, signal, state.dependencies), [
  "packages/alpha",
  "packages/beta",
]);
equal(state.calls.run.length, 1);

state = fixture({ runGit: async () => ({ success: false, stdout: "ignored" }) });
deepEqual(await getSubmodulePaths(state.repository, signal, state.dependencies), []);
state = fixture({ runGit: async () => ({ success: true, stdout: "" }) });
deepEqual(await getSubmodulePaths(state.repository, signal, state.dependencies), []);

const aborted = new AbortController();
aborted.abort();
state = fixture();
state.host.stat = async () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); };
await rejects(getSubmodulePaths(state.repository, aborted.signal, state.dependencies), /missing/);

console.log(`${assertions} worker git submodule paths assertions passed`);
