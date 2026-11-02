import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("popcorn-electron-surface-style");
console.log("popcorn-electron-surface-style release owners: " + assertions + " assertions passed");
