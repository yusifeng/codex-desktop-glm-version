import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("computer-use-settings", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("computer use settings release-faithful assertions passed (" + assertions + ")");
