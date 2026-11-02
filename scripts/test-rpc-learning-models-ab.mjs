import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "learning-model-correlation-matrix",
  "learning-model-meiosis-nondisjunction",
  "learning-model-adsr-envelope",
  "learning-model-carbon-cycle",
  "learning-model-distance-traveled-vs-displacement",
  "learning-model-polynomial-multiplicity-intercepts",
  "learning-model-bubble-sort",
  "learning-model-net-ionic-equations",
  "learning-model-vector-dot-product",
  "learning-model-t-statistic-p-value"
];

let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} learning model release-owner assertions passed`);
