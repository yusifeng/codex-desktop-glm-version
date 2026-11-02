import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("draw-presence-label");
console.log(`draw-presence-label release owners: ${assertions} assertions passed`);
