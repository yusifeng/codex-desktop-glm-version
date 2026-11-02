import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("keyboard-shortcuts-settings");
console.log(`${assertions} keyboard-shortcuts-settings release assertions passed`);
