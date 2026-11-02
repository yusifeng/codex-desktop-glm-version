import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("library-page", [
  /@rchunk\/library-item-actions/,
  /@rchunk\/library-file-preview-kind/,
  /@rchunk\/library-empty-trash-dialog/,
  /export \{ Gg as LibraryPage \}/,
]);

console.log(`${assertions} release-faithful library page assertions passed`);
