import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("billing-settings");
console.log("billing-settings release owners: " + assertions + " assertions passed");
