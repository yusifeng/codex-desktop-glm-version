import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGitManagerGenerationKey, createGitManagerKey, isGitManagerKeyForHost } = require("../app/.vite/build/worker/git-manager-key-policy.js");

assert.equal(createGitManagerKey("local", "/repo"), "local|/repo");
assert.equal(createGitManagerKey("remote-host", ""), "remote-host|");
assert.equal(createGitManagerKey("local", "/repo"), createGitManagerKey("local", "/repo"));
assert.equal(isGitManagerKeyForHost("local|/repo", "local"), true);
assert.equal(isGitManagerKeyForHost("remote|/repo", "local"), false);
assert.equal(createGitManagerGenerationKey("local", "/repo", 3), "local|/repo|3");

console.log("3 worker git manager key assertions passed");
