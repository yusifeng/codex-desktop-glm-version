import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  formatConfigScopeError,
  getConfigScopeFlag,
  isMissingConfigValue,
} = require("../app/.vite/build/worker/git-config-scope-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };

equal(getConfigScopeFlag("local"), "--local");
equal(getConfigScopeFlag("worktree"), "--worktree");
equal(isMissingConfigValue({ code: 1, stderr: "" }, "local"), true);
equal(isMissingConfigValue({ code: 128, stderr: "fatal: WORKTREECONFIG is disabled" }, "worktree"), true);
equal(isMissingConfigValue({ code: 128, stderr: "fatal: WORKTREECONFIG is disabled" }, "local"), false);
equal(formatConfigScopeError("worktree", "user.name", { code: 2, stderr: "denied" }),
  "git config --worktree --get user.name failed: denied");

console.log(`${assertions} worker git config scope policy assertions passed`);
