import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("pull-request-route");
console.log("pull-request-route release owners: " + assertions + " assertions passed");
