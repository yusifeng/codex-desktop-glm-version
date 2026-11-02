import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("checkout-session", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log(`checkout session release-faithful assertions passed (${assertions})`);
