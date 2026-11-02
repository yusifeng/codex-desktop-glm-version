import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("codex-home-announcements");
console.log(`${assertions} codex-home-announcements release assertions passed`);
