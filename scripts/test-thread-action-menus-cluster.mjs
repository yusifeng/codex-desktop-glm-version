import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("share-menu-item", [
  /plugin-share-dialog-entry/,
  /plugin-connected-account-links/,
  /plugin-disabled-reason/,
  /export \{[\s\S]*Ft as _,[\s\S]*Ct as y/,
]);

console.log(`${assertions} release-faithful share menu assertions passed`);
