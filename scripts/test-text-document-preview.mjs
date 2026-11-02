import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "text-document-preview"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
