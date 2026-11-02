import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("chronicle-settings-page");
console.log("chronicle-settings-page release owners: " + assertions + " assertions passed");
