import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("artifact-source-bootstrap", [
  /@rchunk\/artifact-workbook-runtime/,
  /export \{/,
]);
assertions += assertReleaseOwner("panel", [
  /@rchunk\/app-primary/,
  /export \{/,
]);
console.log(`artifact source and panel release-faithful assertions passed (${assertions})`);
