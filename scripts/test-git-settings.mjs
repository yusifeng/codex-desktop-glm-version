import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("git-settings");
console.log(`git-settings release owners: ${assertions} assertions passed`);
