import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("chatgpt-code-block-editor");
console.log(`${assertions} chatgpt-code-block-editor release assertions passed`);
