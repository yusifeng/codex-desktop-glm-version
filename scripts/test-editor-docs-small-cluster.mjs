import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("composer-annotation-editor");
console.log(`composer annotation editor release owner: ${assertions} assertion passed`);
