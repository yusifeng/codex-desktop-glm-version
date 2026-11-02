import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("right-panel-composer-overlay");
console.log(`right-panel-composer-overlay release owner: ${assertions} assertion passed`);
