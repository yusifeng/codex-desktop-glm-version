import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("onboarding-page", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("onboarding page release-faithful assertions passed (" + assertions + ")");
