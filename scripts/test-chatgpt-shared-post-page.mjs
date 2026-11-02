import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("chatgpt-shared-post-page");
console.log(`chatgpt-shared-post-page release owner: ${assertions} assertion passed`);
