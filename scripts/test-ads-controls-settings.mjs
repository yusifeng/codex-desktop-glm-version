import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("ads-controls-settings");
console.log(`${assertions} ads controls settings release assertions passed`);
