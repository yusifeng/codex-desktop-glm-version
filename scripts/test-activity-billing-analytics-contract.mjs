import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("activity-chart", [/^\/\/ @ts-nocheck/m, /export \{/]);
assertions += assertReleaseOwner("billing-analytics", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log(`activity-chart, billing-analytics release-faithful assertions passed (${assertions})`);
