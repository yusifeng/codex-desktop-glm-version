import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("create-workspace-page");
console.log(`${assertions} create workspace page release assertions passed`);
