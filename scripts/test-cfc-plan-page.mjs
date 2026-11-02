import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("cfc-plan-page");
console.log(`${assertions} cfc-plan-page release assertions passed`);
