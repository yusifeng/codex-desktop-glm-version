import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "learning-model-mean-vs-median",
  "learning-model-type-i-type-ii-power",
  "learning-model-standard-deviation",
  "learning-model-binary-search-tree-insertion",
  "learning-model-human-body-systems-map",
  "learning-model-bar-magnet-field-strength",
  "learning-model-least-squares-regression",
  "learning-model-electromagnetic-spectrum",
  "learning-model-two-sample-t-test",
  "learning-model-scientific-notation"
];

let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} learning model release-owner assertions passed`);
