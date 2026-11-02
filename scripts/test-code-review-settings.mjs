import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("code-review-settings");
console.log(`${assertions} code review settings release assertions passed`);
