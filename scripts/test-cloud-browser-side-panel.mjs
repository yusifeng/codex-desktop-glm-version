import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("cloud-browser-side-panel");
console.log(`${assertions} cloud browser side panel release assertions passed`);
