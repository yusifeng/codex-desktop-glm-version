import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("artifact-session-tab-content");
console.log("artifact-session-tab-content release owners: " + assertions + " assertions passed");
