import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("chatgpt-gizmo-header");
console.log(`${assertions} ChatGPT conversation header release assertions passed`);
