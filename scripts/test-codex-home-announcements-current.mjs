import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("codex-home-announcements-current");
assertions += assertReleaseOwner("announcement-entry-points");
console.log(`${assertions} codex-home-announcements-current, announcement-entry-points release assertions passed`);
