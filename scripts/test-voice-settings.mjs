import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("voice-settings", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("voice settings release-faithful assertions passed (" + assertions + ")");
