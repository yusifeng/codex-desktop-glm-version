import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("runtime");
console.log(`${assertions} terminal runtime release assertions passed`);
