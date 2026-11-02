import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("trusted-contact-settings");
console.log(`trusted contact settings release assertions passed (${assertions})`);
