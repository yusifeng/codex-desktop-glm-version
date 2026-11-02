import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("editable-writing-block", [
  /externalContentUpdate/,
  /proseMirrorStore/,
  /toneSections/,
  /emailMetadata/,
  /persistsUntilEdit/,
  /dismiss\(`copy`\)/,
  /receivedMarkdown\.length > 2e4/,
  /export \{ Sn as a, Cn as i, sr as n, xn as r, ir as t \}/,
]);
assertions += assertReleaseOwner("writing-block-app-capabilities", [
  /onBeforeDocumentExport/,
  /librarySaveControls/,
  /suggestedFollowupIneligibilityReason/,
  /userEditedWritingBlock/,
  /writingBlockIndex/,
  /slides-outline-template-picker/,
  /previewEngine/,
  /export \{ Zi as n, Wi as t \}/,
]);
console.log(`${assertions} editable writing block app release assertions passed`);
