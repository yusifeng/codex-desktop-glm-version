import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/atom-signal.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react"],
  write: false,
  logLevel: "silent",
});
const signals = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const root = signals.createScope("RootScope");
check(root.__scopeBrand === "RootScope", "preserves the scope debug name");
check(typeof root.id === "symbol", "allocates a symbol identity");
check(root.parent === undefined, "leaves a root scope parent unset");
check(root.retain === undefined, "does not synthesize a retain policy");

const retain = { autoDispose: 250, max: 3 };
const child = signals.createScope("ChildScope", {
  key: (value) => value.id,
  parent: root,
  retain,
});
check(child.parent === root, "links a child to its parent scope");
check(
  child.getKey({ id: "conversation-1" }) === "conversation-1",
  "uses the configured scope key",
);
check(child.retain === retain, "preserves the complete retain policy");
check(child.id !== root.id, "allocates unique scope identities");

check(
  signals.normalizeAutoDispose(false) === Infinity,
  "normalizes disabled auto disposal",
);
check(
  signals.normalizeAutoDispose(true) === 0,
  "normalizes immediate auto disposal",
);
check(
  signals.normalizeAutoDispose(125) === 125,
  "preserves finite disposal delays",
);
assert.throws(
  () => signals.createScope("InvalidScope", { retain: { autoDispose: -1 } }),
  /finite, nonnegative delay/,
);
assertions += 1;
assert.throws(
  () =>
    signals.createScope("InvalidScope", { retain: { autoDispose: Infinity } }),
  /finite, nonnegative delay/,
);
assertions += 1;

check(
  signals.AppScope.__scopeBrand === "AppScope",
  "exposes the application root scope",
);
check(signals.AppScope.parent === undefined, "keeps AppScope at the root");
check(
  signals.initializeMaitaiRuntime() === undefined,
  "initializes the runtime idempotently",
);
check(
  signals.initializeMaitaiRuntime() === undefined,
  "allows repeated initialization",
);

console.log(`${assertions} app-shared scope assertions passed`);
