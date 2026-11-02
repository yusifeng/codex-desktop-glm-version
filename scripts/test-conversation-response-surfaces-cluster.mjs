import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("request-panel");
assertions += assertReleaseOwner("pull-request-tab-content");
console.log("request-panel, pull-request-tab-content release owners: " + assertions + " assertions passed");
