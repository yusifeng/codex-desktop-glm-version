import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions =
  assertReleaseOwner("google-logo") +
  assertReleaseOwner("animated-icon") +
  assertReleaseOwner("color-icon");

console.log(`brand visual release owners: ${assertions} assertions passed`);
