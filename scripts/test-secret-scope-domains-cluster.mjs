import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "validation-message",
  "secret-scope",
  "allowed-domains-input"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
