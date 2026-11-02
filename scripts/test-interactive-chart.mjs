import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("interactive-chart", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log(`interactive-chart release-faithful assertions passed (${assertions})`);
