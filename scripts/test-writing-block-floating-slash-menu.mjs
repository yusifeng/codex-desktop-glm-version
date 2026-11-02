import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("writing-block-floating-slash-menu", [
  /slashMenuState/,
  /writingBlockAssistantRevision/,
  /isSlashMenuAvailable: !0/,
  /selectionSummary/,
  /docChangeCount/,
  /length-dependent/,
  /export \{/,
]);
console.log(`${assertions} writing block floating slash menu release assertions passed`);
