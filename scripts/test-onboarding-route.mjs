import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("onboarding-route", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("onboarding route release-faithful assertions passed (" + assertions + ")");
