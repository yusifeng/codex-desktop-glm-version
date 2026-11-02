import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "computer-history-query",
  "chronicle-service-queries",
  "recent-uploads",
  "chatgpt-image-home",
  "virtual-try-on"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
