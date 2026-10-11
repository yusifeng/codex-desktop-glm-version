import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { classifyStableMetadataFailure } = require("../app/.vite/build/worker/git-stable-metadata-failure-policy.js");

assert.deepEqual(classifyStableMetadataFailure({ isPermissionError: false, isProcessTimeout: false, isGitUnavailable: false, generationMatches: true, hasCachedRoot: false }), { accepted: false, refreshHostConfig: false, retry: false, invalidateCachedRoot: false });
assert.deepEqual(classifyStableMetadataFailure({ isPermissionError: false, isProcessTimeout: true, isGitUnavailable: false, generationMatches: true, hasCachedRoot: true }), { accepted: true, refreshHostConfig: false, retry: true, invalidateCachedRoot: false });
assert.deepEqual(classifyStableMetadataFailure({ isPermissionError: false, isProcessTimeout: true, isGitUnavailable: false, generationMatches: true, hasCachedRoot: false }), { accepted: true, refreshHostConfig: false, retry: true, invalidateCachedRoot: true });
assert.deepEqual(classifyStableMetadataFailure({ isPermissionError: false, isProcessTimeout: false, isGitUnavailable: true, generationMatches: false, hasCachedRoot: false }), { accepted: true, refreshHostConfig: false, retry: false, invalidateCachedRoot: false });

console.log("4 worker stable metadata failure policy assertions passed");
