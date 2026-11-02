import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("automation-editor-dialog");
console.log("automation editor release owner: " + assertions + " assertions passed");
