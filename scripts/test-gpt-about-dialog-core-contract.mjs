import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("gpt-about-dialog-core");
console.log(`GPT about dialog core release assertions passed (${assertions})`);
