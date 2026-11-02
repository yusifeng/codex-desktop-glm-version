import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("options-menu-view", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("options menu view release-faithful assertions passed (" + assertions + ")");
