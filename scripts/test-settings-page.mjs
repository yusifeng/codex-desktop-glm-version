import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("settings-page", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("settings page release-faithful assertions passed (" + assertions + ")");
