import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("code-block-execution");
console.log(`code-block-execution release owner: ${assertions} assertion passed`);
