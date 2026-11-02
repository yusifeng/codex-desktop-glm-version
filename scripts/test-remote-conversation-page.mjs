import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("remote-conversation-page", [
  /@rchunk\/right-panel-composer-overlay/,
  /@rchunk\/thread-app-shell-chrome/,
  /@rchunk\/use-hotkey-window-detail-layout/,
  /isArchivedPreview/,
  /composerLayoutMode: `auto-single-line`/,
  /export \{ Io as RemoteConversationPage \}/,
]);

console.log(`${assertions} release-faithful remote conversation page assertions passed`);
