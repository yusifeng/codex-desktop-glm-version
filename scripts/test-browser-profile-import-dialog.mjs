import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("browser-profile-import-dialog");
console.log(`${assertions} browser profile import dialog release assertions passed`);
