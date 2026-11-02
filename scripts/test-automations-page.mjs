import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("automations-page");
assertions += assertReleaseOwner("automation-editor-dialog");
assertions += assertReleaseOwner("appgen-settings-page");
console.log("automations release owners: " + assertions + " assertions passed");
