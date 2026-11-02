import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("library-writing-block-core", [
  /libraryFileId/,
  /isExpanded/,
  /showMagicEditAction/,
  /onPreviewClose/,
  /onFlush/,
  /export \{/,
]);
console.log(`${assertions} library writing block core release assertions passed`);
