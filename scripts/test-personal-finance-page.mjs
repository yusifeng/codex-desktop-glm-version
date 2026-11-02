import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("personal-finance-page");
console.log("personal-finance-page release owners: " + assertions + " assertions passed");
