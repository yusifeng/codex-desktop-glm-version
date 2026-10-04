import assert from "node:assert/strict";
import { classifyHub } from "./audit-renderer-hub-classification.mjs";

const results = ["app-shared", "app-initial", "app-primary"].map(classifyHub);
for (const result of results) {
  assert.ok(result.exportCount > 0);
  assert.ok(result.consumedCount > 0);
  assert.ok(result.consumedCount <= result.exportCount);
  assert.ok(result.unconsumed.every((alias) => /^[A-Za-z_$][\w$]*$/.test(alias)));
}
const primary = results[2];
assert.ok(primary.unconsumed.length > 0, "A5 gate must expose the remaining app-primary surface");
console.log("9 renderer hub classification assertions passed");
