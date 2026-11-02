import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("open-in-google-drive-menu-item");
console.log(`${assertions} open in Google Drive release assertions passed`);
