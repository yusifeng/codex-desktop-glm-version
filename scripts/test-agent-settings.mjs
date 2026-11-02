import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("agent-settings", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("agent settings release-faithful assertions passed (" + assertions + ")");
