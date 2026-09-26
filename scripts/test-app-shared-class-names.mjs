import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/class-names.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const classNamesModule = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const { classNames } = classNamesModule;

const cases = [
  { values: [], expected: "", label: "empty input" },
  { values: ["button", "active"], expected: "button active", label: "strings" },
  { values: [1, 2], expected: "1 2", label: "numbers" },
  {
    values: ["button", null, false, undefined, 0, "active"],
    expected: "button active",
    label: "top-level falsey values",
  },
  {
    values: [{ active: true, disabled: false, selected: 1 }],
    expected: "active selected",
    label: "object maps",
  },
  {
    values: [["button", ["nested", { active: true }], false]],
    expected: "button nested active",
    label: "nested arrays",
  },
  {
    values: [[1, 0, 2, null]],
    expected: "1 2",
    label: "array falsey values",
  },
  {
    values: [true, 1n, () => "ignored", Symbol("ignored")],
    expected: "",
    label: "unsupported truthy primitives",
  },
];

for (const testCase of cases) {
  assert.equal(
    classNames(...testCase.values),
    testCase.expected,
    testCase.label,
  );
}

const prototype = { inherited: true };
const inheritedMap = Object.assign(Object.create(prototype), { own: true });
assert.equal(
  classNames(inheritedMap),
  "own inherited",
  "preserves the original enumerable for-in behavior",
);
assert.equal(
  classNamesModule.initializeClassNames(),
  undefined,
  "keeps class-name initialization idempotent",
);

console.log(`${cases.length + 2} app-shared classNames assertions passed`);
