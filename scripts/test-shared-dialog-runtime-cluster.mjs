import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("ad-control-dialog-runtime");
assertions += assertReleaseOwner("appgen-share-dialog");
console.log("ad-control-dialog-runtime, appgen-share-dialog release owners: " + assertions + " assertions passed");
