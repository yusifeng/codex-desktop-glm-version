import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "saved-entities-data",
  "file-preview-version-history",
  "cloud-file-preview",
  "reset-image-library-state",
  "app-main",
  "index-entry",
  "artifact-entry",
  "portable-pdfjs-runtime"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
