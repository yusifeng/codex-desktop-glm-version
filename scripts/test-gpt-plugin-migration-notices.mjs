import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("gpt-plugin-migration-notices");
console.log(`gpt plugin migration notices release owner: ${assertions} assertion passed`);
