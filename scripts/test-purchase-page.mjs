import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("purchase-page");
console.log(`${assertions} purchase-page release assertions passed`);
