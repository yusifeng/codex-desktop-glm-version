import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("browser-skill-editor");
console.log(`browser skill editor release assertions passed (${assertions})`);
