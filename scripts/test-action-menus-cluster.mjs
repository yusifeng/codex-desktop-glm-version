import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "create-output-menu",
  "add-source-menu",
  "settings-command-menu-section-items",
  "agent-menu",
  "conversation-move-menu-items"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
