import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("gpt-builder-page");
console.log("gpt-builder-page release owners: " + assertions + " assertions passed");
