import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("sketch", [
  /@rchunk\/app-initial/,
  /export \{/,
]);
console.log(`sketch release-faithful assertions passed (${assertions})`);
