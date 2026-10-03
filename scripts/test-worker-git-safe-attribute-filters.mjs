import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  baseAttributeOverrides,
  createSafeAttributeFilterOverrides,
  filterConfigPattern,
  getSafeAttributeFilterOverrides,
  parseFilterDriverName,
} = require("../app/.vite/build/worker/git-safe-attribute-filters.js");

let count = 0;
const equal = (...args) => { count += 1; assert.equal(...args); };
const deepEqual = (...args) => { count += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { count += 1; await assert.rejects(...args); };

deepEqual(baseAttributeOverrides, ["-c", "attr.tree=", "-c", "core.attributesFile="]);
equal(filterConfigPattern, "^filter\\..*\\.(clean|smudge|process|required)$");
equal(parseFilterDriverName("filter.lfs.clean"), "lfs");
equal(parseFilterDriverName("filter.name.with.dots.process"), "name.with.dots");
equal(parseFilterDriverName("filter.lfs.unknown"), null);
equal(parseFilterDriverName("other.lfs.clean"), null);
deepEqual(
  createSafeAttributeFilterOverrides(
    "filter.lfs.clean\r\nfilter.lfs.smudge\n filter.custom.process \ninvalid",
  ),
  [
    "-c", "attr.tree=", "-c", "core.attributesFile=",
    "-c", "filter.lfs.clean=", "-c", "filter.lfs.smudge=",
    "-c", "filter.lfs.process=", "-c", "filter.lfs.required=false",
    "-c", "filter.custom.clean=", "-c", "filter.custom.smudge=",
    "-c", "filter.custom.process=", "-c", "filter.custom.required=false",
  ],
);

function fixture({ mutateGeneration = false, result } = {}) {
  const calls = { fetch: [], invalidate: [], run: [] };
  const querySignal = new AbortController().signal;
  const repository = {
    root: "/repo",
    host: { id: "host" },
    gitConfigReadGeneration: 4,
    queryClient: {
      invalidateQueries: (options) => calls.invalidate.push(options),
    },
  };
  let fetchCount = 0;
  const dependencies = {
    fetchQueryWithSignal: async (client, options, signal) => {
      calls.fetch.push([client, options, signal]);
      fetchCount += 1;
      const value = await options.queryFn(querySignal);
      if (mutateGeneration && fetchCount === 1) repository.gitConfigReadGeneration += 1;
      return value;
    },
    getQueryMeta: () => ({ invalidation: "git-config" }),
    queryKey: (...parts) => ["query", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return result ?? { success: true, stdout: "filter.lfs.clean" };
    },
    staleTime: Infinity,
  };
  return { calls, dependencies, querySignal, repository };
}

const signal = new AbortController().signal;
let state = fixture();
deepEqual(
  await getSafeAttributeFilterOverrides(state.repository, signal, state.dependencies),
  createSafeAttributeFilterOverrides("filter.lfs.clean"),
);
equal(state.calls.fetch.length, 1);
deepEqual(state.calls.fetch[0][1].queryKey, [
  "query", "/repo", state.repository.host, "safe-attribute-filter-overrides",
]);
deepEqual(state.calls.fetch[0][1].meta, { invalidation: "git-config" });
equal(state.calls.fetch[0][1].staleTime, Infinity);
equal(state.calls.fetch[0][2], signal);
deepEqual(state.calls.run[0], [
  "/repo",
  ["config", "--name-only", "--get-regexp", filterConfigPattern],
  state.repository.host,
  { allowedNonZeroExitCodes: [1], signal: state.querySignal },
]);

state = fixture();
await getSafeAttributeFilterOverrides(state.repository, undefined, state.dependencies);
equal(state.calls.run[0][3].signal, undefined);

state = fixture({ mutateGeneration: true });
await getSafeAttributeFilterOverrides(state.repository, signal, state.dependencies);
equal(state.calls.fetch.length, 2);
deepEqual(state.calls.invalidate, [{
  queryKey: ["query", "/repo", state.repository.host, "safe-attribute-filter-overrides"],
  exact: true,
  refetchType: "none",
}]);

state = fixture({ result: { success: false, stderr: "bad config", stdout: "" } });
await rejects(
  getSafeAttributeFilterOverrides(state.repository, signal, state.dependencies),
  /git config filter discovery failed: bad config/,
);

console.log(`${count} worker git safe attribute filter assertions passed`);
