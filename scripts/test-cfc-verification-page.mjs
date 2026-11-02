import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("cfc-verification-page");
console.log(`${assertions} CFC verification page release assertions passed`);
