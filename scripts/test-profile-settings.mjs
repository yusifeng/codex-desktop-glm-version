import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("profile-settings");
console.log(`profile settings release owner: ${assertions} assertion passed`);
