import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("site-preview");
console.log(`site preview release assertions passed (${assertions})`);
