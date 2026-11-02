import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "learning-model-geothermal-power",
  "learning-model-pedigree",
  "learning-model-digestive-tract-absorption",
  "learning-model-chi-square-independence",
  "learning-model-critical-path-network",
  "learning-model-distillation"
];

let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} learning model release-owner assertions passed`);
