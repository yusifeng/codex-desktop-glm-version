import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("plugin-installation-content", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log(`plugin installation content release-faithful assertions passed (${assertions})`);
