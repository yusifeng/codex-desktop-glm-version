import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("onboarding", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("extension onboarding release-faithful assertions passed (" + assertions + ")");
