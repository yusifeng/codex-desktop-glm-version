import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("image-markup-editor");
console.log(`image-markup-editor release owner: ${assertions} assertion passed`);
