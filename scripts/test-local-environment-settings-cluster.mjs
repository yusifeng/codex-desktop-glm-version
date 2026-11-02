import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("local-environment-editor");
console.log(`local-environment-editor release owner: ${assertions} assertion passed`);
