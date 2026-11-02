import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("conversation-followup-shelf");
console.log(`${assertions} conversation-followup-shelf release assertions passed`);
