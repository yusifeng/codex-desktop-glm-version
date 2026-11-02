import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("detached-browser-annotation-controls");
console.log(`${assertions} detached browser annotation controls release assertions passed`);
