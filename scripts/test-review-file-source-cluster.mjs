import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("review-file-source-breadcrumb");
console.log("review-file-source-breadcrumb release owners: " + assertions + " assertions passed");
