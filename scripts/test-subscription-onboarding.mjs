import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("subscription-onboarding");
console.log(`${assertions} subscription onboarding release assertions passed`);
