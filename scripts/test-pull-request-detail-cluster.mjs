import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("pull-request-detail-query", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log(`pull-request-detail-query release-faithful assertions passed (${assertions})`);
