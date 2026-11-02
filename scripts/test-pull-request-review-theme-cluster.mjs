import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("pull-request-code-review-core");
console.log("pull-request-code-review-core release owners: " + assertions + " assertions passed");
