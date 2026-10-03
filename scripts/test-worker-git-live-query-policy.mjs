import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  appendTraceLink,
  isSampledTrace,
  mergeLiveQueryTrace,
  shouldRefreshLiveQuery,
} = require("../app/.vite/build/worker/git-live-query-policy.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};
const trace = (suffix) => ({ traceparent: `00-trace-span-${suffix}` });

equal(isSampledTrace(trace("01")), true);
equal(isSampledTrace(trace("02")), false);
equal(isSampledTrace(trace("zz")), false);

const links = [trace("00")];
appendTraceLink(links, trace("00"));
appendTraceLink(links, trace("01"));
appendTraceLink(links, trace("02"));
appendTraceLink(links, trace("03"));
appendTraceLink(links, trace("04"));
deepEqual(links.map(({ traceparent }) => traceparent), [
  trace("00").traceparent,
  trace("01").traceparent,
  trace("02").traceparent,
  trace("03").traceparent,
]);

let state = { trace: undefined, traceLinks: [] };
mergeLiveQueryTrace(state, trace("02"));
equal(state.trace.traceparent, trace("02").traceparent);
mergeLiveQueryTrace(state, trace("02"));
deepEqual(state.traceLinks, []);
mergeLiveQueryTrace(state, trace("04"));
equal(state.traceLinks[0].traceparent, trace("04").traceparent);
mergeLiveQueryTrace(state, trace("01"));
equal(state.trace.traceparent, trace("01").traceparent);
equal(state.traceLinks[1].traceparent, trace("02").traceparent);
mergeLiveQueryTrace(state, trace("03"));
equal(state.trace.traceparent, trace("01").traceparent);
equal(state.traceLinks[2].traceparent, trace("03").traceparent);

const changeTypes = [
  "config",
  "head",
  "index",
  "local-refs",
  "remote-refs",
  "synced-branch",
  "working-tree",
  "worktree-topology",
];
const expected = {
  "status-summary": ["config", "head", "index", "working-tree"],
  "review-summary": ["config", "head", "index", "remote-refs", "working-tree"],
  "branch-diff-stats": ["config", "head", "index", "remote-refs", "working-tree"],
  "recent-branches": ["config", "head", "local-refs", "remote-refs"],
  "current-branch": ["head"],
  "upstream-branch": ["config", "head"],
  "branch-ahead-count": ["config", "head", "remote-refs"],
  "branch-commits": ["config", "head", "remote-refs"],
  "default-branch": ["config", "head", "remote-refs"],
  "base-branch": ["config", "head", "remote-refs"],
  "list-worktrees": ["head", "worktree-topology"],
};
for (const [method, refreshingChanges] of Object.entries(expected)) {
  for (const changeType of changeTypes)
    equal(
      shouldRefreshLiveQuery({ method }, changeType),
      refreshingChanges.includes(changeType),
      `${method} / ${changeType}`,
    );
}
equal(shouldRefreshLiveQuery({ method: "unknown" }, "head"), undefined);
equal(shouldRefreshLiveQuery({ method: "status-summary" }, "unknown"), undefined);

console.log(`${count} worker git live-query policy assertions passed`);
