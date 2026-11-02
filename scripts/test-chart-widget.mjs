import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions =
  assertReleaseOwner("chart") +
  assertReleaseOwner("PieChart");

console.log(`chart release owners: ${assertions} assertions passed`);
