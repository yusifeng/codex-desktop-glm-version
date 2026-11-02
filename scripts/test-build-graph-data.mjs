import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("build-graph-data");
console.log(`${assertions} build graph data release assertions passed`);
