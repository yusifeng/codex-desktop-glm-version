import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  "view-state-persistence-runtime",
  "ads-placement-generated-surface",
  "browser-thread-panel-tab-content",
  "voice-session-composition-root",
  "image-preview-tab-content-generated",
  "hosted-immersive-map",
  "permissions-mode-dropdown-generated",
  "virtual-try-on-action-runtime",
  "data-controls-settings",
  "browser-skills-directory-page",
  "artifact-document-core",
  "delinquent-subscription-upgrade-dialog",
  "voice-dsp-composition-root",
  "codex-first-run-page",
  "gpt-directory-banner-runtime",
  "browser-comment-popup-portal",
  "chatgpt-announcement-candidates-runtime",
  "app-action-registry",
  "skill-details-runtime",
  "trusted-contact-actions",
  "generated-registry-runtime",
  "composer-tip-controller-runtime",
  "dil-react-renderer-bridge",
  "ads-controls-state",
  "product-intervention-runtime",
  "dil-response-runtime",
  "multiplayer-document-runtime",
  "compiled-react-visual-runtime",
];

let assertions = 0;
for (const owner of owners) assertions += assertReleaseOwner(owner);
console.log(`${assertions} preserved application surfaces are now release-faithful source owners`);
