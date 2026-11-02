import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("home-ambient-suggestions-content");
assertions += assertReleaseOwner("work-onboarding-suggestions");
console.log("home-ambient-suggestions-content, work-onboarding-suggestions release owners: " + assertions + " assertions passed");
