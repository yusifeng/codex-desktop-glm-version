import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("checkout-error") +
  assertReleaseOwner("checkout-confirm-latency");
console.log(`${assertions} checkout helper release assertions passed`);
