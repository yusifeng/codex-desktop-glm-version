import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/dom-style.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const styles = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const values = new Map([
  ["--unchanged", "8px"],
  ["--updated", "red"],
  ["--removed", "blue"],
]);
const operations = [];
const element = {
  style: {
    getPropertyValue(name) {
      operations.push(["get", name]);
      return values.get(name) ?? "";
    },
    removeProperty(name) {
      operations.push(["remove", name]);
      const previous = values.get(name) ?? "";
      values.delete(name);
      return previous;
    },
    setProperty(name, value) {
      operations.push(["set", name, value]);
      values.set(name, value);
    },
  },
};

equal(
  styles.syncStyleProperties(element, {
    "--unchanged": "8px",
    "--updated": "green",
    "--removed": null,
    "--already-empty": undefined,
    "--created": "12px",
  }),
  undefined,
  "returns no value",
);
equal(values.get("--unchanged"), "8px", "preserves matching properties");
equal(values.get("--updated"), "green", "updates changed properties");
equal(values.has("--removed"), false, "removes populated null properties");
equal(
  values.has("--already-empty"),
  false,
  "does not create undefined properties",
);
equal(values.get("--created"), "12px", "creates missing properties");
equal(
  operations.filter(([operation]) => operation === "set"),
  [
    ["set", "--updated", "green"],
    ["set", "--created", "12px"],
  ],
  "writes only changed non-null values",
);
equal(
  operations.filter(([operation]) => operation === "remove"),
  [["remove", "--removed"]],
  "removes only populated null values",
);
equal(
  styles.initializeStylePropertySync(),
  undefined,
  "keeps sync initialization idempotent",
);
equal(
  styles.initializeStylePropertyRuntime(),
  undefined,
  "keeps runtime initialization idempotent",
);

console.log(
  `app-shared DOM style behavior: ${assertions}/${assertions} assertions passed`,
);
