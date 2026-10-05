import assert from "node:assert/strict";
import { buildPullRequestSummaryQuery } from "../app/.vite/build/worker/github-pull-request-summary-policy.js";

const query = buildPullRequestSummaryQuery([
  { pullRequest: { owner: "acme", repository: "repo", number: 7 }, index: 0, cursor: null },
  { pullRequest: { owner: 'a"b', repository: "r\\p", number: 8 }, index: 2, cursor: "cursor-1" },
]);
assert.match(query, /^query \{ viewer \{ login \}/);
assert.match(query, /p0: repository\(owner:"acme",name:"repo"\)/);
assert.match(query, /pullRequest\(number:7\)/);
assert.match(query, /p2: repository\(owner:"a\\\"b",name:"r\\\\p"\)/);
assert.match(query, /contexts\(first:100,after:null\)/);
assert.match(query, /contexts\(first:100,after:"cursor-1"\)/);
assert.match(query, /statusCheckRollup/);
assert.match(query, /pageInfo \{ hasNextPage endCursor \}/);
assert.equal(buildPullRequestSummaryQuery([]), "query { viewer { login }  }");
console.log("github pull-request summary query policy assertions passed (8)");
