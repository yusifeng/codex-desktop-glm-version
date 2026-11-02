import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("pull-request-fix-workflow");
console.log(`pull request fix workflow release assertions passed (${assertions})`);
