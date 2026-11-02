import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("thread-goal-side-panel-content");
console.log(`thread-goal-side-panel-content release owner: ${assertions} assertion passed`);
