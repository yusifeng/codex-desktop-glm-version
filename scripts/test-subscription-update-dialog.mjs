import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const assertions = assertReleaseOwner("subscription-update-dialog");
console.log(`subscription update dialog release owner: ${assertions} assertion passed`);
