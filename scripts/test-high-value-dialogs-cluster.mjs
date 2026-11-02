import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("app-connect-modal");
console.log("app-connect-modal release owners: " + assertions + " assertions passed");
