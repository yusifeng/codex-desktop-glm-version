#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const observer = fs.readFileSync(new URL("../src/renderer/parental-control-notifications-observer/index.ts", import.meta.url), "utf8");
const preflight = fs.readFileSync(new URL("../src/renderer/personal-secrets-preflight/index.ts", import.meta.url), "utf8");

for (const [source, release, exported] of [
  [observer, "notifications-3700d6e3cd47.js", "observeParentalControlNotifications"],
  [preflight, "preflight-4a4cc944d9a1.js", "preparePersonalSecrets"],
]) {
  assert.match(source, new RegExp(release.replaceAll(".", "\\.")));
  assert.match(source, new RegExp(`export \{ ${exported} \}`));
  assert.equal(/@ts-(?:expect-error|nocheck)|\bas any\b|:\s*any\b|<any>/u.test(source), false);
}
assert.match(observer, /import\("@rchunk\/parental-control-notifications-runtime"\)/u);
assert.match(observer, /chatgpt_family_notifications_initialization_failed/u);
assert.match(observer, /cancelled = true/u);
assert.match(preflight, /PersonalSecretsDialog/u);
assert.match(preflight, /A Cloud task is already awaiting personal secrets/u);
assert.match(preflight, /Personal secrets prompt was interrupted/u);
assert.match(preflight, /finally/u);

console.log("misc-ui-utils NN: 12 assertions passed across 2 runtime gates");
