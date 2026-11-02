import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("workbook-review-utils");
console.log(`${assertions} workbook-review-utils release assertions passed`);
