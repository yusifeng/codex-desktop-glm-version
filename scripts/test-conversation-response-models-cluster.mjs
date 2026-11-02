import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "workbook-from-csv",
  "respond",
  "turn-bibliography",
  "summary",
  "payload",
  "image-validation-session"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
