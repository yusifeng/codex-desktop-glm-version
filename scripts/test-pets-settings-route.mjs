import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("pets-settings-route");
console.log("pets-settings-route release owners: " + assertions + " assertions passed");
