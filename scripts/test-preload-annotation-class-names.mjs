import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { annotationClassNames } = require(
  "../app/.vite/build/browser-page-preload/annotation-class-names.js",
);

const cases = [
  { values: [], expected: "", label: "empty input" },
  { values: ["cursor", "active"], expected: "cursor active", label: "strings" },
  { values: [1, 2], expected: "1 2", label: "numbers" },
  {
    values: ["cursor", null, false, undefined, 0, "active"],
    expected: "cursor active",
    label: "top-level falsey values",
  },
  {
    values: [{ active: true, disabled: false, selected: 1 }],
    expected: "active selected",
    label: "object maps",
  },
  {
    values: [["cursor", ["nested", { active: true }], false]],
    expected: "cursor nested active",
    label: "nested arrays",
  },
  { values: [[1, 0, 2, null]], expected: "1 2", label: "array falsey values" },
  {
    values: [true, 1n, () => "ignored", Symbol("ignored")],
    expected: "",
    label: "unsupported truthy primitives",
  },
];

for (const testCase of cases) {
  assert.equal(
    annotationClassNames(...testCase.values),
    testCase.expected,
    testCase.label,
  );
}

const inherited = Object.assign(Object.create({ inherited: true }), { own: true });
assert.equal(annotationClassNames(inherited), "own inherited", "enumerable inherited keys");

console.log(`${cases.length + 1} preload annotation class-name assertions passed`);
