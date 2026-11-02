import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "get-plus-header-button",
  "hidden-browser-use-webview-host",
  "host",
  "browser-webview-host",
  "workspace-access-browser",
  "geometry-shapes",
  "gpt-management-access",
  "hidden-background-webview-host",
  "voice-commentary-message",
  "workspace-layout-step-handler",
  "pepper-onboarding-modal",
  "hotkey-window-detail-layout",
  "learning-model-gcf-lcm-shape-renderer"
];
let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);

console.log(`${assertions} release-owner assertions passed`);
