import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("library-cloud-file-preview");
console.log("library-cloud-file-preview release owners: " + assertions + " assertions passed");
