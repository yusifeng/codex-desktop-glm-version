import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("cloud-environments-settings-page");
console.log("cloud-environments-settings-page release owners: " + assertions + " assertions passed");
