import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { admitGitRequest } = require("../app/.vite/build/worker/git-request-admission-controller.js");
const calls = []; const base = { requestId: "r1", tracked: true, signal: { aborted: true }, beginRequest: () => "started", emitCancellation: () => calls.push("cancel"), cancellationInput: {}, operation: null, recordOutcome: (value) => calls.push(["outcome", value]) };
assert.equal(admitGitRequest(base), true); assert.deepEqual(calls, []); calls.length = 0; assert.equal(admitGitRequest({ ...base, beginRequest: () => "canceled" }), false); assert.deepEqual(calls, ["cancel", ["outcome", "canceled"]]); console.log("5 worker Git request-admission controller assertions passed");
