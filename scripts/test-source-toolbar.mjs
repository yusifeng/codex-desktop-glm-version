import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("source-toolbar");
console.log(`${assertions} source-toolbar release assertions passed`);
