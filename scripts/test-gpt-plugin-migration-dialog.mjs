import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("gpt-plugin-migration-dialog");
console.log(`gpt-plugin-migration-dialog release owner: ${assertions} assertion passed`);
