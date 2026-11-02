import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("select-workspace-page");
console.log(`${assertions} select-workspace-page release assertions passed`);
