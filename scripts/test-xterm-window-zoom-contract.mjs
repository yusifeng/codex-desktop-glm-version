import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("xterm-window-zoom", [
  /@rchunk\/theme-font-family/,
  /export \{/,
]);
console.log(`xterm window/zoom release-faithful assertions passed (${assertions})`);
