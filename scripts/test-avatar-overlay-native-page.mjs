import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("avatar-overlay-native-page", [
  /@rchunk\/avatar-mascot-button/,
  /@rchunk\/realtime-voice-handoff-target/,
  /avatar-overlay/,
  /export \{ Kf as AvatarOverlayNativePage \}/,
]);

console.log(`${assertions} release-faithful avatar overlay assertions passed`);
