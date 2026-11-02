import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("open-conversation-files");
console.log(`${assertions} open-conversation-files release assertions passed`);
