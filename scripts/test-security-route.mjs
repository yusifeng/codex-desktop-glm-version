import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("security-route", [
  /@rchunk\/settings-host-dropdown/,
  /codex-security/,
  /export \{ Ql as SecurityRoute \}/,
]);

console.log(`${assertions} release-faithful security route assertions passed`);
