import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const assertions = assertReleaseOwner("usage-settings-page", [
  /@rchunk\/command-menu-queries/,
  /@rchunk\/usd-currency-formatter/,
  /export \{ Qo as UsageSettingsPage \}/,
]);
console.log(`${assertions} release-faithful usage settings assertions passed`);
