import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("local-conversation-side-chat");
console.log(`${assertions} local conversation side-chat release assertions passed`);
