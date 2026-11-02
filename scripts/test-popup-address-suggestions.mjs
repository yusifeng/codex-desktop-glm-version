import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("popup");
console.log(`popup release owner: ${assertions} assertion passed`);
