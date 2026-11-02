import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "learning-model-t-distribution",
  "learning-model-paired-t-test",
  "learning-model-co2-and-temperature-time-series",
  "learning-model-phase-change-cycle",
  "learning-model-simpsons-rule",
  "learning-model-trapezoidal-rule",
  "learning-model-food-chain",
  "learning-model-reflection-transformation-coordinate-plane",
  "learning-model-joint-marginal-conditional-table",
  "learning-model-lewis-structure-builder",
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);
console.log(`${assertions} learning model release-owner assertions passed`);
