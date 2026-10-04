import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  LIST_LIMIT,
  SUMMARY_FIELDS,
  STATUS_FIELDS,
  buildPullRequestListArgs,
  resolveRepositoryCandidates,
  getBoardState,
} = require("../app/.vite/build/worker/github-pull-request-board-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

equal(LIST_LIMIT, 10);
equal(SUMMARY_FIELDS.includes("number"), true);
equal(STATUS_FIELDS.includes("mergeable"), true);
deepEqual(buildPullRequestListArgs({ searchQuery: null }), ["pr", "list", "--state", "all", "--limit", "10", "--json", [...SUMMARY_FIELDS, ...STATUS_FIELDS].join(","), "--author", "@me"]);
deepEqual(buildPullRequestListArgs({ searchQuery: "  fix bug  ", repoArg: "acme/widget", state: "open" }), ["pr", "list", "--state", "open", "--limit", "10", "--json", [...SUMMARY_FIELDS, ...STATUS_FIELDS].join(","), "--search", "fix bug", "--repo", "acme/widget"]);
deepEqual(buildPullRequestListArgs({ searchQuery: "", includePullRequestStatusFields: false }), ["pr", "list", "--state", "all", "--limit", "10", "--json", SUMMARY_FIELDS.join(",")]);

const parseRemoteUrl = (url) => url.includes("github.com") ? { host: "github.com", owner: "Acme", repo: "Widget" } : { host: "git.example", owner: "Team", repo: "Repo" };
deepEqual(resolveRepositoryCandidates({ upstreamUrl: "https://git.example/Team/Repo", originUrl: "https://github.com/Acme/Widget", parseRemoteUrl }), ["git.example/Team/Repo", "Acme/Widget"]);
deepEqual(resolveRepositoryCandidates({ upstreamUrl: "https://github.com/Acme/Widget", originUrl: "ssh://github.com/Acme/Widget", parseRemoteUrl }), ["Acme/Widget"]);
equal(getBoardState({ isDraft: true, canMerge: true, ciStatus: "passing" }), "draft");
equal(getBoardState({ isDraft: false, canMerge: true, ciStatus: "failing" }), "failing");
equal(getBoardState({ isDraft: false, canMerge: true, ciStatus: "pending" }), "ready");
equal(getBoardState({ isDraft: false, canMerge: false, ciStatus: "passing" }), "in_progress");
equal(getBoardState({ isDraft: false, canMerge: true, ciStatus: "unknown" }), "in_progress");

console.log(`${assertions} github pull request board policy assertions passed`);
