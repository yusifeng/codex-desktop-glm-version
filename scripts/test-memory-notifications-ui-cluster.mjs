import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("about-you-summary");
console.log("about-you-summary release owners: " + assertions + " assertions passed");
