import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/worker/git-stable-metadata-retry-controller.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { GitStableMetadataRetryController } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const throwsSame = (operation, expected) => {
  try {
    operation();
    assert.fail("expected operation to throw");
  } catch (error) {
    equal(error, expected);
  }
};

let now = 100;
const timeout = new Error("timeout");
timeout.kind = "timeout";
const unavailable = new Error("unavailable");
unavailable.kind = "unavailable";
const permission = new Error("permission");
permission.kind = "permission";
const classifyFailure = (input) => {
  const accepted = input.isPermissionError || input.isProcessTimeout || input.isGitUnavailable;
  return {
    accepted,
    refreshHostConfig: accepted && input.generationMatches && input.isGitUnavailable,
    retry: accepted && input.generationMatches,
    invalidateCachedRoot: accepted && input.generationMatches && (!input.isProcessTimeout || !input.hasCachedRoot),
  };
};
const controller = new GitStableMetadataRetryController({
  classifyFailure,
  isGitUnavailable: (error) => error?.kind === "unavailable",
  isPermissionError: (error) => error?.kind === "permission",
  isProcessTimeout: (error) => error?.kind === "timeout",
  now: () => now,
  retryDelayMs: 50,
});

const calls = [];
const handle = (key, error, overrides = {}) => () => controller.handleFailure({
  error,
  generationMatches: true,
  hasCachedRoot: false,
  invalidateCachedRoot: () => calls.push(`${key}:root`),
  invalidateMetadata: () => calls.push(`${key}:metadata`),
  key,
  refreshHostConfig: () => calls.push(`${key}:host`),
  ...overrides,
});

throwsSame(handle("timeout-cached", timeout, { hasCachedRoot: true }), timeout);
equal(controller.size, 1);
equal(controller.hasProcessTimeoutRetry("timeout-cached"), true);
equal(calls.join(","), "timeout-cached:metadata");
throwsSame(() => controller.throwIfBlocked("timeout-cached"), timeout);
now = 150;
controller.throwIfBlocked("timeout-cached");
equal(controller.size, 0);
equal(controller.hasProcessTimeoutRetry("timeout-cached"), false);

now = 200;
throwsSame(handle("unavailable", unavailable), unavailable);
equal(controller.size, 1);
equal(controller.hasProcessTimeoutRetry("unavailable"), false);
equal(calls.includes("unavailable:host"), true);
equal(calls.includes("unavailable:root"), true);
equal(calls.includes("unavailable:metadata"), true);
controller.delete("unavailable");
equal(controller.size, 0);

throwsSame(handle("permission", permission), permission);
equal(controller.size, 1);
equal(calls.includes("permission:root"), true);
equal(calls.includes("permission:metadata"), true);

throwsSame(handle("stale", timeout, { generationMatches: false }), timeout);
equal(controller.size, 1);
equal(calls.includes("stale:root"), false);
equal(calls.includes("stale:metadata"), false);

const unknown = { code: "unknown" };
throwsSame(handle("unknown", unknown), unknown);
equal(controller.size, 1);

const stringError = "unavailable string";
let normalized;
try {
  handle("normalized", stringError, {
    error: { kind: "unavailable", toString: () => stringError },
  })();
} catch (error) {
  normalized = error;
}
equal(normalized instanceof Error, true);
equal(normalized.message, stringError);
equal(controller.size, 2);

controller.clear();
equal(controller.size, 0);
controller.throwIfBlocked("missing");
equal(controller.hasProcessTimeoutRetry("missing"), false);

console.log(`${assertions} worker stable metadata retry controller lifecycle assertions passed`);
