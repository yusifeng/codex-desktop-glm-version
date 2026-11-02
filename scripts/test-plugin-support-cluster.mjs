import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "plugin-connected-account-links",
  "plugin-disabled-reason",
  "find-plugin-mcp-extension-view",
  "use-plugin-scheduled-tasks",
  "prepare-plugin-creator",
  "plugin-connector-setup"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
