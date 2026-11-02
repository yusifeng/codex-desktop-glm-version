import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("hooks-settings");
console.log("hooks-settings release owners: " + assertions + " assertions passed");
