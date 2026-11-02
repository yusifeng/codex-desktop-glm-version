import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "security-client",
  "security-shared",
  "security-src",
  "security-keys",
  "use-resume-conversation-if-needed"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
