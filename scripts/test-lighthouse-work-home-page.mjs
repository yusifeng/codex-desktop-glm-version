import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("lighthouse-work-home-page");
console.log(`lighthouse-work-home-page release owners: ${assertions} assertions passed`);
