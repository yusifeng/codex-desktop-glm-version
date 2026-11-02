import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions =
  assertReleaseOwner("mark-session-create") +
  assertReleaseOwner("realtime-voice-controls-surface");

console.log(`realtime voice release owners: ${assertions} assertions passed`);
