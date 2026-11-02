import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("sketch-composer-host-core");
console.log("sketch-composer-host-core release owners: " + assertions + " assertions passed");
