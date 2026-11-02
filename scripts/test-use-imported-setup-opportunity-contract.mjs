import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("use-imported-setup-opportunity", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log(`use-imported-setup-opportunity release-faithful assertions passed (${assertions})`);
