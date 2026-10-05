import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { hasPartialCloneConfiguration, parseGitConfigEntries } =
  require("../app/.vite/build/worker/git-clone-state-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };

const entries = parseGitConfigEntries(
  "extensions.partialclone origin\nremote.origin.promisor true\nkey value with spaces\nempty",
);
equal(entries.get("extensions.partialclone"), "origin");
equal(entries.get("remote.origin.promisor"), "true");
equal(entries.get("key"), "value with spaces");
equal(entries.get("empty"), "");

for (const value of ["", "1", "on", "TRUE", "yes"])
  equal(hasPartialCloneConfiguration(new Map([["remote.origin.promisor", value]])), true);
for (const value of ["0", "off", "false", "no", "arbitrary"])
  equal(hasPartialCloneConfiguration(new Map([["remote.origin.promisor", value]])), false);
equal(hasPartialCloneConfiguration(new Map([["extensions.partialclone", ""]])), true);
equal(hasPartialCloneConfiguration(new Map([["remote.upstream.partialclonefilter", "blob:none"]])), true);
equal(hasPartialCloneConfiguration(new Map([["remote.origin.url", "partialclone"]])), false);

console.log(`${assertions} worker git clone state policy assertions passed`);
