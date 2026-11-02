import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("sidebar-onboarding-checklist");
console.log(`sidebar onboarding checklist release assertions passed (${assertions})`);
