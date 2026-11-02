import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("browser-use-settings", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("browser use settings release-faithful assertions passed (" + assertions + ")");
