import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("visualization-annotation-editor");
console.log(`${assertions} visualization-annotation-editor release assertions passed`);
