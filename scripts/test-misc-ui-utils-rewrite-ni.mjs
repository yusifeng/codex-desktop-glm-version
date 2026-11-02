import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "image-markup-export",
  "business-agent-draft-state",
  "deferred-clinician-verification-banner"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
