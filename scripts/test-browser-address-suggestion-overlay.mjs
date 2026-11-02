import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("browser-address-suggestion-overlay");
console.log(`${assertions} browser address suggestion overlay release assertions passed`);
