import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/app-shared/runtime/error-rate-limit.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

equal(runtime.errorValueToString(new Error("broken")), "broken", "uses Error messages");
equal(runtime.errorValueToString("plain"), "plain", "keeps string values");
equal(
  runtime.errorValueToString({ message: "structured" }),
  "structured",
  "uses a non-empty object message",
);
equal(
  runtime.errorValueToString({ message: "", code: 7 }),
  '{"message":"","code":7}',
  "serializes objects with empty messages",
);
equal(runtime.errorValueToString({ code: 7 }), '{"code":7}', "serializes objects");
equal(runtime.errorValueToString(null), "null", "serializes null");
equal(runtime.errorValueToString(undefined), undefined, "preserves JSON undefined");
equal(runtime.errorValueToString(12n), "12", "falls back when JSON serialization throws");
const cyclic = {};
cyclic.self = cyclic;
equal(runtime.errorValueToString(cyclic), "[object Object]", "falls back for cycles");
equal(runtime.initializeErrorValueToString(), undefined, "initializes error conversion");

const gate = new runtime.MinimumIntervalGate({ minIntervalMs: 100 });
equal(gate.minIntervalMs, 100, "exposes the configured interval");
equal(gate.canPass(1_000), true, "starts ready");
equal(gate.tryPass(1_000), true, "marks the first successful pass");
equal(gate.canPass(1_099), false, "blocks before the interval elapses");
equal(gate.tryPass(1_099), false, "does not mark a blocked attempt");
equal(gate.canPass(1_100), true, "allows the exact interval boundary");
equal(gate.tryPass(1_100), true, "marks a later successful pass");
equal(gate.canPass(1_199), false, "measures from the latest mark");
gate.mark(2_000);
equal(gate.canPass(2_099), false, "supports explicit marks");
equal(gate.canPass(2_100), true, "allows a marked boundary");

const originalNow = Date.now;
Date.now = () => 5_000;
try {
  const defaultClockGate = new runtime.MinimumIntervalGate({ minIntervalMs: 1 });
  equal(defaultClockGate.tryPass(), true, "uses Date.now by default");
  equal(defaultClockGate.tryPass(), false, "blocks repeated default-clock attempts");
} finally {
  Date.now = originalNow;
}

equal(runtime.initializeMinimumIntervalGate(), undefined, "initializes interval gates");

console.log(
  `app-shared error and rate limit behavior: ${assertions}/${assertions} assertions passed`,
);
