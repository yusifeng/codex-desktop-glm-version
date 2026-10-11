import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { finalizeGitRequest } = require("../app/.vite/build/worker/git-request-finalization-controller.js");
const calls = []; await finalizeGitRequest({ request: { id: "r1", method: "commit" }, tracked: true, host: { id: "local" }, refreshRoot: "/repo", resolveInvalidationTarget: () => ({ type: "exact", cwd: "/repo" }), invalidateUntrackedPaths: async (cwd) => calls.push(["exact", cwd]), invalidateUntrackedHost: () => {}, isMutation: () => true, resolveMutationRoot: () => "/repo", invalidateMutationCaches: async (root) => calls.push(["mutation", root]), getStableMetadata: async () => ({ root: "/repo" }), invalidateRepositoryCaches: () => calls.push("repo-cache"), refreshRepository: async () => calls.push("refresh"), getRepository: () => ({}), finishRequest: (id, tracked) => calls.push(["finish", id, tracked]) }); assert.deepEqual(calls, [["exact", "/repo"], ["mutation", "/repo"], "repo-cache", "refresh", ["finish", "r1", true]]);
console.log("5 worker Git request-finalization controller assertions passed");
