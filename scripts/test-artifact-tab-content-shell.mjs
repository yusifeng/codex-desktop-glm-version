import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("artifact-tab-content-shell");
console.log(`artifact-tab-content-shell release owner: ${assertions} assertion passed`);
