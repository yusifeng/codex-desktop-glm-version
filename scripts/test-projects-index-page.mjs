import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("projects-index-page");
assertions += assertReleaseOwner("local-environments-settings-page");
console.log("projects and local environments release owners: " + assertions + " assertions passed");
