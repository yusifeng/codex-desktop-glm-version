import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("symbol-browser", [
  /@rchunk\/color-palette/,
  /emoji/,
  /export \{ rd as SymbolBrowser \}/,
]);

console.log(`${assertions} release-faithful symbol browser assertions passed`);
