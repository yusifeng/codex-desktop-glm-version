import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("review-file-source-breadcrumb");
assertions += assertReleaseOwner("editable-review-file-source-tab-content");
console.log("review file source release owners: " + assertions + " assertions passed");
