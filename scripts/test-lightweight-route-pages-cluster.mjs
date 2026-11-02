import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "profile-page",
  "browser-plugin-share-page",
  "codex-mobile-page",
  "plan-summary-page",
  "gpt-chat-page",
  "open-source-licenses-page",
  "plugin-mcp-app-deep-link-page",
  "asb-conversation-page",
  "hotkey-window-thread-page",
  "workspace-agent-detail-page"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
