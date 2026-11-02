import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("chatgpt-conversation-page-core", [
  /serverConversationId/,
  /@rchunk\/chatgpt-sources-side-panel-tab/,
  /@rchunk\/right-panel-composer-overlay/,
  /@rchunk\/archived-conversation-preview-footer/,
  /Automatic ChatGPT artifact preview could not open/,
  /export \{[\s\S]*Pp as t,[\s\S]*jp as u/,
]);
assertions += assertReleaseOwner("conversation-header", [
  /Header/,
  /open-recent-tasks-menu/,
  /export \{ ot as Header \}/,
]);

console.log(`${assertions} release-faithful conversation page assertions passed`);
