import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("appgen-analytics-page");
console.log(`appgen analytics page release assertions passed (${assertions})`);
