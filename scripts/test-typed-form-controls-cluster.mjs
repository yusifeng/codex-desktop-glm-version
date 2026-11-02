import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("tax-types");
assertions += assertReleaseOwner("design-editor-state");
console.log(`${assertions} typed form control release assertions passed`);
