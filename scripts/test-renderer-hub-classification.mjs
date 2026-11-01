import assert from "node:assert/strict";
import fs from "node:fs";
import { classifyHub } from "./audit-renderer-hub-classification.mjs";

const results = ["app-shared", "app-initial", "app-primary"].map(classifyHub);
for (const result of results) {
  assert.ok(result.exportCount > 0);
  assert.ok(result.consumedCount > 0);
  assert.ok(result.consumedCount <= result.exportCount);
  assert.ok(result.unconsumed.every((alias) => /^[A-Za-z_$][\w$]*$/.test(alias)));
  assert.deepEqual(result.unreviewed, [], `${result.hub} must not contain unknown exports`);
}
const primary = results[2];
// Cast-narrowed namespace bindings are real consumers too.  Keep a floor for
// each hub so a future audit cannot silently regress to dot-access-only scans.
assert.ok(results[0].consumedCount >= 430, "app-shared named/cast consumers must be counted");
assert.ok(results[1].consumedCount >= 1600, "app-initial named/cast consumers must be counted");
assert.ok(results[1].consumedAliases.includes("ggt"), "multi-character named imports must be counted");
assert.ok(primary.consumedCount >= 210, "app-primary named/cast consumers must be counted");
// Namespace imports are frequently narrowed through a destructuring binding
// (`const { Sm: AnnouncementShell } = appPrimaryChunk`).  The audit must count
// the public alias on the left-hand side as a real consumer, not classify it as
// an unreferenced export merely because no `chunk.Sm` member expression exists.
assert.ok(primary.consumedCount >= 10, "namespace destructuring consumers must be counted");
assert.ok(primary.unconsumed.length > 0, "A5 gate must expose the remaining app-primary surface");
assert.ok(primary.reviewedCount >= 225, "line-level A5 classifications must be registered");
const audit = fs.readFileSync(new URL("../docs/renderer-tail-audit.md", import.meta.url), "utf8");
assert.match(audit, /`rA`\/`nA`[\s\S]*URL predicate/);
assert.match(audit, /aggregation-runtime/);
assert.match(audit, /没有对应的\n?named consumer/);
assert.match(audit, /公开别名 `Ur`/);
assert.match(audit, /公开别名 `Ad`\/`YMe`/);
assert.match(audit, /公开别名 `Zm`/);
assert.match(audit, /公开别名 `Ag`/);
assert.match(audit, /公开别名 `Eh`/);
assert.match(audit, /公开别名 `Ef`/);
assert.match(audit, /公开别名 `\$g`/);
assert.match(audit, /公开别名 `\$a`/);
assert.match(audit, /公开别名 `An`/);
assert.match(audit, /公开别名[\s\S]*`og`/);
console.log("renderer hub classification invariants passed");
