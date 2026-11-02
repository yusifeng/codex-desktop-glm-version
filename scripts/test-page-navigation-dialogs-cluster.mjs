import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "artifact-preview-page-navigation",
  "keyboard-shortcuts-dialog",
  "changelog-modal"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
