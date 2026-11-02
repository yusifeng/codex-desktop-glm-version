import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("pull-request-actions");
console.log(`${assertions} pull-request-actions release assertions passed`);
