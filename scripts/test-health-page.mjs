import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("health-page");
assertions += assertReleaseOwner("environment-configuration-fields");
console.log("health and environment configuration release owners: " + assertions + " assertions passed");
