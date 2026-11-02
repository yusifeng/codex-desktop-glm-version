import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const assertions = assertReleaseOwner("meetings-page", [
  /@rchunk\/app-connect-modal-by-id/,
  /meeting/,
  /export \{ Tr as MeetingsPage \}/,
]);
console.log(`${assertions} release-faithful meetings page assertions passed`);
