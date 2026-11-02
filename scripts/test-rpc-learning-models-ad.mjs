import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "learning-model-iupac-hydrocarbon-naming",
  "learning-model-law-of-reflection",
  "learning-model-correlation",
  "learning-model-electron-orbital-filling",
  "learning-model-histogram",
  "learning-model-contour-lines-and-relief",
  "learning-model-bootstrap-distribution",
  "learning-model-nitrogen-cycle",
  "learning-model-velocity-as-slope-graph",
  "learning-model-linear-inequality-solution-ray"
];

let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} learning model release-owner assertions passed`);
