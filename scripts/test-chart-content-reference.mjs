import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("chart-content-reference");
assertions += assertReleaseOwner("chart");
console.log(`${assertions} chart content/reference release assertions passed`);
