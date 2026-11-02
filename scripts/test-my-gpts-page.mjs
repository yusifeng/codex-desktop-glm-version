import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("my-gpts-page");
console.log(`${assertions} my-gpts-page release assertions passed`);
