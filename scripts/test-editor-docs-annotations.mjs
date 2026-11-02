import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions =
  assertReleaseOwner("selected-text-annotation-editor") +
  assertReleaseOwner("detached-browser-annotation-host");

console.log(`editor annotation release owners: ${assertions} assertions passed`);
