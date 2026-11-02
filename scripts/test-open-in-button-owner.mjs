import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("open-in-button");
console.log(`open-in-button release owner: ${assertions} assertion passed`);
