import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("artifact-feedback-dialog");
console.log(`${assertions} artifact-feedback-dialog release assertions passed`);
