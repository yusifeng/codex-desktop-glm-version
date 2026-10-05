import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const output = execFileSync(process.execPath, ["scripts/audit-renderer-hub-manifest.mjs"], { encoding: "utf8" });
assert.match(output, /app-shared:/);
assert.match(output, /app-initial:/);
assert.match(output, /app-primary:/);
assert.match(output, /UNREVIEWED: \d+/);
console.log("renderer hub manifest: exhaustive category output verified");
