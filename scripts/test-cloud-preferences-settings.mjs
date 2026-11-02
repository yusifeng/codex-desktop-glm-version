import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("cloud-preferences-settings");
console.log(`${assertions} cloud preferences settings release assertions passed`);
