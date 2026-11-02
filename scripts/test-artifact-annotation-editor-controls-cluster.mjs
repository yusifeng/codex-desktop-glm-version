import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "presentation-annotation-coachmark",
  "artifact-annotation-comment",
  "popcorn-manual-edit-header-controls",
  "binary-preview-source",
  "editor-header",
  "presentation-annotation-cursor-coachmark",
  "drawing-size-slider"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
