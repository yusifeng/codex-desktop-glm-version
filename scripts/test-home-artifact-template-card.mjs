import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("home-artifact-template-card");
console.log(`home artifact template card release owner: ${assertions} assertion passed`);
