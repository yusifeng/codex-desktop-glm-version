import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "personal-finance-account-detail",
  "appgen-page",
  "environment-setup-review-entry",
  "workspace-agents-page",
  "workspace-agent-landing"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
