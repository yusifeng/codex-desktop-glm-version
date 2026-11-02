import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("writing-block-copy-button", [
  /onCopy/,
  /iconOnly: !0/,
  /variant: `toolbar`/,
  /export \{ d as n, c as t \}/,
]);
assertions += assertReleaseOwner("chatgpt-writing-block-ai-tools", [
  /e\.TOOLBAR = `toolbar`/,
  /e\.FULLSCREEN_COMPOSER = `fullscreen-composer`/,
  /e\.HEADER_COMPOSER = `header-composer`/,
  /\/conversation\/message\/writing-blocks\/magic-edit/,
  /createWritingBlockMagicEditPlugin/,
  /magicEditId/,
  /acceptedSegmentIndices/,
  /AbortController/,
  /selectionClassName/,
  /export \{ Ke as i, Bn as n, Ue as r, Kn as t \}/,
]);
console.log(`${assertions} writing block action control release assertions passed`);
