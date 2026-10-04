import assert from "node:assert/strict";
import fs from "node:fs";
import { classifyHub } from "./audit-renderer-hub-classification.mjs";

const results = ["app-shared", "app-initial", "app-primary"].map(classifyHub);
for (const result of results) {
  assert.ok(result.exportCount > 0);
  assert.ok(result.consumedCount > 0);
  assert.ok(result.consumedCount <= result.exportCount);
  assert.ok(result.unconsumed.every((alias) => /^[A-Za-z_$][\w$]*$/.test(alias)));
}
const primary = results[2];
// Cast-narrowed namespace bindings are real consumers too.  Keep a floor for
// each hub so a future audit cannot silently regress to dot-access-only scans.
assert.ok(results[0].consumedCount >= 110, "app-shared cast consumers must be counted");
assert.ok(results[1].consumedCount >= 400, "app-initial cast consumers must be counted");
assert.ok(primary.consumedCount >= 70, "app-primary cast consumers must be counted");
// Namespace imports are frequently narrowed through a destructuring binding
// (`const { Sm: AnnouncementShell } = appPrimaryChunk`).  The audit must count
// the public alias on the left-hand side as a real consumer, not classify it as
// an unreferenced export merely because no `chunk.Sm` member expression exists.
assert.ok(primary.consumedCount >= 10, "namespace destructuring consumers must be counted");
assert.ok(primary.unconsumed.length > 0, "A5 gate must expose the remaining app-primary surface");
assert.equal(primary.reviewedCount, 31, "line-level A5 classifications must be registered");
assert.ok(primary.unconsumed.includes("Ur"), "Ur remains unconsumed until a real named consumer exists");
assert.ok(primary.unconsumed.includes("Zm"), "Zm remains coupled to the adjacent local-action URL projection");
assert.ok(primary.unconsumed.includes("Ag"), "Ag remains coupled to the generated selection overlay renderer");
assert.ok(primary.unconsumed.includes("Eh"), "Eh remains coupled to the generated takeover status projection");
assert.ok(primary.unconsumed.includes("Ef"), "Ef remains coupled to the generated default-branch query runtime");
assert.ok(primary.unconsumed.includes("$g"), "$g remains coupled to generated CSS capability styling");
assert.ok(primary.unconsumed.includes("$a"), "$a remains coupled to the generated slash-command pin surface");
assert.ok(primary.unconsumed.includes("An"), "An remains coupled to generated repository URL projection");
assert.ok(primary.unconsumed.includes("og"), "og remains coupled to generated project-kind projection");
assert.ok(primary.unconsumed.includes("Cl"), "Cl remains coupled to generated thread-key projection");
assert.ok(primary.unconsumed.includes("Dl"), "Dl remains coupled to generated search projection");
assert.ok(primary.unconsumed.includes("$c"), "$c remains coupled to generated annotation geometry");
assert.ok(primary.unconsumed.includes("Cc"), "Cc remains coupled to generated device-state projection");
assert.ok(primary.unconsumed.includes("wc"), "wc remains coupled to generated device-state reset");
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
console.log("20 renderer hub classification assertions passed");
