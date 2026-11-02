import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("detached-browser-page");
console.log("detached-browser-page release owners: " + assertions + " assertions passed");
