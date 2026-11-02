import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("appshots-settings");
console.log(`${assertions} appshots-settings release assertions passed`);
