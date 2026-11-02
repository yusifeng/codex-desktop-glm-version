import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("import-settings", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("import settings release-faithful assertions passed (" + assertions + ")");
