import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("login-route");
console.log(`${assertions} login-route release assertions passed`);
