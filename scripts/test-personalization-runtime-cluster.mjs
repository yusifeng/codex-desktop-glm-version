import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("avatar-mascot-button") +
  assertReleaseOwner("voice-configuration-manager");

console.log(`${assertions} personalization release-owner assertions passed`);
