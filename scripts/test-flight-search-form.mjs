import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions =
  assertReleaseOwner("flight-search-form") +
  assertReleaseOwner("platform-ui-kit-provider");
console.log(`flight search and platform provider release assertions passed (${assertions})`);
