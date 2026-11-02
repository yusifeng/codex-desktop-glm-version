import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("pull-request-comment");
console.log("pull-request-comment release owners: " + assertions + " assertions passed");
