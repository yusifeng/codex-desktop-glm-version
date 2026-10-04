import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-git-watch-session-policy-"));
const out = path.join(dir, "policy.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-watch-session-policy.ts")], outfile: out, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const policy = createRequire(import.meta.url)(out);

assert.equal(policy.nextGitWatcherRetryDelay(250, 1000), 500);
assert.equal(policy.nextGitWatcherRetryDelay(800, 1000), 1000);
assert.equal(policy.shouldScheduleGitWatchSessionRetry({ disposed: false, targetRegistered: true, hasRetryTimer: false }), true);
assert.equal(policy.shouldScheduleGitWatchSessionRetry({ disposed: true, targetRegistered: true, hasRetryTimer: false }), false);
assert.deepEqual(policy.getGitWatchSessionClosePolicy({ disposed: false, sessionMatches: true, elapsedMs: 1000, stableThresholdMs: 500 }), { active: true, resetRetryDelay: true });
assert.deepEqual(policy.getGitWatchSessionClosePolicy({ disposed: false, sessionMatches: false, elapsedMs: 0, stableThresholdMs: 500 }), { active: false, resetRetryDelay: false });
assert.equal(policy.shouldRetryGitWatchTargetAfterStart({ recovering: true, disposed: false, generationUnchanged: true, hasSession: false, metadataMissing: false }), true);
assert.equal(policy.shouldRetryGitWatchTargetAfterStart({ recovering: true, disposed: false, generationUnchanged: false, hasSession: false, metadataMissing: false }), false);
console.log("8 worker git watch session policy assertions passed");
