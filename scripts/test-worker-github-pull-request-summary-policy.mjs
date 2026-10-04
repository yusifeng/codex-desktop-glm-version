import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getActivePullRequestReaders,
  getPullRequestSummaryKey,
  getPullRequestSummaryState,
  hasPendingPullRequestChecks,
} = require("../app/.vite/build/worker/github-pull-request-summary-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

equal(getPullRequestSummaryKey({ owner: "Acme", repository: "Widget", number: 7 }), '["acme","widget",7]');
equal(getPullRequestSummaryState("OPEN"), "open");
equal(getPullRequestSummaryState("MERGED"), "merged");
equal(getPullRequestSummaryState("CLOSED"), "closed");
equal(getPullRequestSummaryState("UNKNOWN"), undefined);

const controller = new AbortController();
controller.abort();
const active = getActivePullRequestReaders([
  { host: "live" },
  { host: "aborted", signal: controller.signal },
]);
deepEqual(active, [{ host: "live" }]);

equal(hasPendingPullRequestChecks({ ciStatus: "pending", checks: [] }), true);
equal(hasPendingPullRequestChecks({ ciStatus: "success", checks: [{ status: "pending" }] }), true);
equal(hasPendingPullRequestChecks({ ciStatus: "success", checks: [{ status: "success" }] }), false);

console.log(`${assertions} github pull request summary policy assertions passed`);
