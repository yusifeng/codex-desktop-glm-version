import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("appgen-database-page");
console.log(`${assertions} appgen database page release assertions passed`);
