import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("safety-settings");
console.log(`safety-settings release owner: ${assertions} assertion passed`);
