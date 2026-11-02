import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const assertions = assertReleaseOwner("sites-default-thumbnail");
console.log(`sites default thumbnail release owner: ${assertions} assertion passed`);
