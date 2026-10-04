import assert from "node:assert/strict";
import { createGithubPullRequestRevisionHandlers } from "../src/main/worker/github-pull-request-revision.ts";

const sha = "a".repeat(40);
const head = "b".repeat(40);
const calls = [];
const deps = {
  parseSha: (value) => { if (!/^[a-f\d]{40}$/i.test(value)) throw Error("bad sha"); return value; },
  parsePath: (value) => value == null ? null : value,
  assertAccount: async () => {},
  requestApi: async (_request, _host, path, args) => {
    calls.push([path, args]);
    if (path.startsWith("contents/")) return JSON.stringify({ size: 3, encoding: "base64", content: Buffer.from("abc").toString("base64") });
    return "diff";
  },
};
const handlers = createGithubPullRequestRevisionHandlers(deps);
const request = { comparison: { baseRevision: sha, headRevision: head }, basePath: "x", headPath: "y" };
const host = { id: "host" };
assert.deepEqual(await handlers.diff(request, host), { status: "success", headRevision: head, unifiedDiff: "diff" });
assert.deepEqual(await handlers.file(request, host), { status: "success", baseContent: "abc", headContent: "abc" });
assert.equal(calls.length, 3);
assert.deepEqual(await handlers.file({ ...request, basePath: null, headPath: null }, host), { status: "success", baseContent: "", headContent: "" });
console.log("github pull request revision tests passed (6 assertions)");
