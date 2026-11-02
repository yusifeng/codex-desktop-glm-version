import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("subscription-onboarding-content");
console.log("subscription-onboarding-content release owners: " + assertions + " assertions passed");
