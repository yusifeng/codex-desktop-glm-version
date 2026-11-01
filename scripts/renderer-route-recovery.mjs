import fs from "node:fs/promises";
import path from "node:path";

export const SETTINGS_ROUTE_ROOTS = [
  "_virtual_settings-search-documents-d81257e4909b.js",
  "about-you-summary-9b607a4e7d80.js",
  "about-you-summary-ee1fdcc83db8.js",
  "agent-settings-27cdda401037.js",
  "analytics-settings-45239c8f89d3.js",
  "appearance-settings-b7026bff7ec6.js",
  "appgen-settings-dialog-22832d8eda26.js",
  "appgen-settings-page-95e95458752b.js",
  "appgen-settings-page-ea4f4a5684c3.js",
  "appshots-settings-69ae88c8d2f5.js",
  "billing-settings-d5b5419393a0.js",
  "chronicle-settings-d16251f05467.js",
  "chronicle-settings-page-e92cf619a884.js",
  "cloud-environments-settings-page-b47c295bea65.js",
  "cloud-preferences-f6d10d95099d.js",
  "cloud-preferences-settings-8a70094282e4.js",
  "code-review-settings-775a291149b5.js",
  "code-review-settings-bdd10a089628.js",
  "codex-micro-settings-cbf47e1d3359.js",
  "computer-use-settings-6786672692bb.js",
  "connector-settings-redirect-c7caf754f50f.js",
  "debug-settings-46e3a410a685.js",
  "general-settings-3d550f75d0eb.js",
  "general-settings-4d0f64b22132.js",
  "git-settings-537e4135cecb.js",
  "gpt-about-dialog-7509f0d1e79e.js",
  "gpt-header-about-dialog-920bca8413c4.js",
  "hooks-settings-copy-54b2f32b2f4c.js",
  "hooks-settings-fde35406d6f4.js",
  "hooks-settings-model-4437e9b84c01.js",
  "hooks-settings-route-b2d75c1a3ccd.js",
  "import-settings-ec2688b74a01.js",
  "import-settings-gate-7fb85d759733.js",
  "keyboard-shortcuts-settings-5511d1126168.js",
  "local-environments-settings-page-6e0104d39e76.js",
  "mcp-settings-46098748ccb7.js",
  "notifications-settings-42b7c5801f48.js",
  "notifications-settings-ebea0dc9da14.js",
  "personalization-settings-c52a4963cfd3.js",
  "pets-settings-route-965aa70e25ab.js",
  "plugin-settings-url-cb4b412ead63.js",
  "plugins-settings-a104e9fe3d0b.js",
  "plugins-settings-a6cc8c327ff7.js",
  "plugins-settings-row-ece92bdc1883.js",
  "preferences-c824e7299e20.js",
  "profile-settings-3687227a4513.js",
  "profile-settings-b8a00212b44b.js",
  "remote-connections-settings-12e860fd2983.js",
  "review-preferences-model-677402e96a42.js",
  "safety-settings-aa3588e3b94c.js",
  "security-settings-2da2a3b205ab.js",
  "settings-a4bad04583e5.js",
  "settings-c9978bb73980.js",
  "settings-command-menu-section-items-478caae57181.js",
  "settings-e03d8d0b0de2.js",
  "settings-external-section-572589552e67.js",
  "settings-host-dropdown-88d53c1b03c2.js",
  "settings-loading-row-bc154f92cd90.js",
  "settings-page-9811299ef92c.js",
  "settings-plugin-selection-e42895d573ba.js",
  "settings-route-state-de5cb00d62ce.js",
  "settings-row-disclosure-49c72ab3c041.js",
  "settings-unsaved-changes-dialog-b754fcf540d8.js",
  "skills-settings-2a3de63b855b.js",
  "storage-settings-5e1f4582b046.js",
  "time-management-settings-9bdd323c658a.js",
  "trusted-contact-settings-b71f926a1121.js",
  "use-visible-settings-sections-5efd0081496f.js",
  "voice-settings-3a0651cd977e.js",
  "worktrees-settings-page-f7e1c38f9bb4.js",
];

export const COMPOSER_ROUTE_ROOTS = [
  "above-composer-fixed-content-surface-59cfe2f3858a.js",
  "ambient-suggestion-apps-75842c7ad68b.js",
  "browser-address-suggestion-overlay-59b25209907d.js",
  "browser-composer-disclaimer-6a73b502bd51.js",
  "browser-composer-disclaimer-f364f51499b5.js",
  "codex-micro-mini-game-composer-c7d8a016e5c4.js",
  "codex-home-announcements-327826cf904d.js",
  "codex-home-announcements-a162daf7b1b9.js",
  "codex-home-announcements-cc03f986780c.js",
  "codex-home-announcements-fb04cadd6201.js",
  "composer-ab5081483162.js",
  "composer-action-bar-run-location-dropdown-4c846a804c36.js",
  "composer-announcement-slot-6e5975fb94c1.js",
  "composer-banners-92519a56d6b2.js",
  "composer-host-ac9410930773.js",
  "composer-host-f4bf944e323d.js",
  "composer-overlay-4397ac448ec8.js",
  "composer-project-picker-content-e81ba084d408.js",
  "composer-provider-15ef4a061c57.js",
  "composer-state-422d489ae887.js",
  "composer-state-6ca55b96cbb0.js",
  "composer-state-fe0ac7960e24.js",
  "composer-tip-fda4ea1a2c09.js",
  "composer-utility-bar-a9b94a95b731.js",
  "composer-work-home-plugins-control-8beac401e5e1.js",
  "computer-history-suggestion-prompt-7850c0ed2372.js",
  "computer-history-suggestions-55e8abf166e7.js",
  "first-app-connect-ambient-suggestions-ef1637627fe1.js",
  "followup-suggestions-822629129cd6.js",
  "home-ambient-suggestions-content-a1c4fe488b63.js",
  "home-composer-announcement-candidates-da8179151998.js",
  "home-composer-mode-toggle-ceb4980e314e.js",
  "home-composer-mode-toggle-edaa8aaec97d.js",
  "home-composer-route-a340373310ac.js",
  "home-suggestion-list-1614a03f93b0.js",
  "home-suggestion-staggered-item-832765849b4a.js",
  "home-suggestion-surface-6b043b722abb.js",
  "home-task-suggestions-b757487c0d5e.js",
  "home-task-suggestions-e29a02e9b466.js",
  "new-chat-page-suggestions-eligibility-3faf4b7da2a4.js",
  "new-chat-suggestion-source-debug-state-855bc2eaa826.js",
  "portable-attachment-thumbnail-a0a0861523f3.js",
  "portable-attachment-thumbnail.worker-239d300eaa56.js",
  "primary-composer-at-mention-list-9532ce06fc83.js",
  "right-panel-composer-overlay-alignment-95f87dd3a2a9.js",
  "right-panel-composer-overlay-fdca4b46e82c.js",
  "suggestion-card-f3fce61476bd.js",
  "suggestions-1907f4f59b11.js",
  "suggestions-92e2efd3926f.js",
  "suggestions-c9112ed2bf9b.js",
  "use-chatgpt-composer-controller-d0283af53f81.js",
];

export const HOME_ROUTE_ROOTS = [
  "HomeFill-8908f67aedef.js",
  "access-splash-16051ae6ad8f.js",
  "announcement-1bd76f90c419.js",
  "app-connect-modal-7b842fd077d6.js",
  "app-connect-modal-by-id-df3d2b76a0a1.js",
  "beacon-modal-e9c7a7295a75.js",
  "chatgpt-onboarding-dialog-db3403b0da3f.js",
  "codex-app-home-beacon-announcement-8a3d3ccd4244.js",
  "codex-app-home-beacon-announcement-8c94f69eb080.js",
  "codex-app-home-beacon-connect-modal-f08421bbd090.js",
  "codex-local-access-splash-ff43f5ed08ff.js",
  "codex-micro-onboarding-animation-a027699f788a.js",
  "codex-micro-onboarding-host-85407a96e02a.js",
  "dialog-launcher-3ba4460e21d5.js",
  "dialog-launcher-7402d22a7e21.js",
  "home-announcement-slot-e1c7dd804e24.js",
  "home-announcement-state-a710c9a1705d.js",
  "home-artifact-template-card-b9932e48e350.js",
  "home-artifact-templates-1e0738b7ddeb.js",
  "home-beacon-2564999a4911.js",
  "home-beacon-cc2a431a2f7e.js",
  "home-entry-point-77c102affca7.js",
  "home-prefill-artifact-preview-6c0a2147521a.js",
  "home-starter-prompts-790b30ad6e43.js",
  "onboarding-d0bfce15e4cc.js",
  "onboarding-entrypoint-ca2ef496ead9.js",
  "onboarding-interactive-tools-f11479e8dd9a.js",
  "onboarding-login-content-519045570fa2.js",
  "onboarding-mail-provider-fad35c245d17.js",
  "onboarding-page-905dd8894724.js",
  "pasted-link-connect-modal-730ca5a9f5d7.js",
  "pending-onboarding-9e794fa64b02.js",
  "realtime-voice-launch-surface-20e3f20aea6c.js",
  "realtime-voice-launch-surface-2fa961db54d2.js",
  "subscription-onboarding-bdae6e918350.js",
  "subscription-onboarding-dcd9d9af0fe0.js",
  "wallet-onboarding-announcement-content-28d619ce7d4e.js",
  "wallet-onboarding-announcement-modal-5f24c11f1adc.js",
  "work-mode-access-splash-fa4771fbbc93.js",
  "worktree-onboarding-banner-controller-7e8d2c149cf5.js",
  "worktree-onboarding-state-7d07364a277a.js",
];

// Semantic drafts that still expose structural `{ kind, props }` view models
// where the application expects real React components. Keep their complete
// implementations in the recovered source graph until those drafts reproduce
// the original component contracts. This list is intentionally exhaustive and
// guarded by test-renderer-recovered-route-source-build.mjs.
export const STRUCTURAL_COMPONENT_ROOTS = [
  "content-bd6ed75ea274.js",
  "equation-44cf0b1d4b75.js",
  "hover-card-data-95a14e835743.js",
  "library-cloud-file-preview-b3ddfaa823c0.js",
  "open-a618d40921b2.js",
  "page-268e2fb6d880.js",
  "registered-259e95b201a1.js",
  "workbook-review-utils-3e78f7501b68.js",
  "workspace-agent-detail-query-3cb2bb771d2e.js",
];

export const CONVERSATION_ROUTE_ROOTS = [
  "local-conversation-page-bcc7eca0b3ab.js",
  "local-conversation-thread-c6e40fdd6d59.js",
  "local-conversation-turn-14bf296d5217.js",
  "conversation-blocks-3f59e850f9fb.js",
  "agent-activity-item-792873f87aad.js",
  "agent-activity-units-9397783428a4.js",
  "user-message-e36f9e2dfe24.js",
  // Settings route registration is indirect, so include every classified
  // settings entry as a root instead of relying only on static imports from
  // settings-page. Several readable reconstructions still return structural
  // `{ kind }` placeholders and are not safe React components yet.
  ...SETTINGS_ROUTE_ROOTS,
  // Composer controls are similarly reached through runtime registries. Keep
  // the whole classified surface exact so a single reconstructed placeholder
  // cannot break home or conversation rendering.
  ...COMPOSER_ROUTE_ROOTS,
  ...HOME_ROUTE_ROOTS,
  ...STRUCTURAL_COMPONENT_ROOTS,
];

export const RECONSTRUCTED_ROUTE_CORE = new Set([
  "app-initial-51da50e6c6e3.js",
  "app-primary-d66705000d76.js",
  "app-shared-7b9edc1bfb7f.js",
  "rolldown-runtime-2d059c5e81f4.js",
]);

// Route modules whose readable TypeScript implementations have been checked
// against the release import/export contract.  They deliberately break out of
// the compatibility closure: importers keep the same hashed filename, while
// build-renderer emits that filename from src/renderer/<semantic-name>.
export const SEMANTIC_ROUTE_OVERRIDES = new Set([
  "about-you-summary-9b607a4e7d80.js",
  "appgen-settings-page-ea4f4a5684c3.js",
  "array-15adaa1bc228.js",
  "assert-never-a6e685100dc6.js",
  "browser-composer-disclaimer-f364f51499b5.js",
  "codex-app-home-beacon-announcement-8a3d3ccd4244.js",
  "command-execution-command-615dea847916.js",
  "composer-host-f4bf944e323d.js",
  "composer-state-fe0ac7960e24.js",
  "country-codes-1c845666fc28.js",
  "dialog-launcher-7402d22a7e21.js",
  "diff-summary-f7ac0660791a.js",
  "format-bytes-9f828acaa58f.js",
  "general-settings-4d0f64b22132.js",
  "git-action-review-state-3172c139d671.js",
  "home-composer-mode-toggle-edaa8aaec97d.js",
  "home-composer-route-a340373310ac.js",
  "home-task-suggestions-b757487c0d5e.js",
  "import-settings-gate-7fb85d759733.js",
  "memory-manager-gate-c50f1c5729d4.js",
  "noop-4d1a48b9db0c.js",
  "notifications-settings-ebea0dc9da14.js",
  "onboarding-interactive-tools-f11479e8dd9a.js",
  "plan-implementation-request-0cd55f1ae7b1.js",
  "plugins-settings-a6cc8c327ff7.js",
  "realtime-voice-launch-surface-2fa961db54d2.js",
  "suggestions-c9112ed2bf9b.js",
  "tiny-invariant-b34bc475860a.js",
  "turn-preview-body-items-84e9457d1850.js",
  "usd-5d2c7710cf01.js",
]);

// Follow eager imports only. Backtick imports in the release graph are lazy
// product-wide route registries; recursively activating those exact chunks can
// overwrite unrelated semantic routes and mix incompatible graph segments.
// Lazy route entries are covered explicitly by the classified roots above.
const STATIC_IMPORT_RE = /(?:from\s*|import\s*)(?:\(\s*)?["']\.\/([^"']+\.js)["']/g;

export async function collectConversationRouteClosure(assetDirectory) {
  const recovered = new Set();
  const pending = [...CONVERSATION_ROUTE_ROOTS];
  while (pending.length > 0) {
    const name = pending.pop();
    if (
      recovered.has(name) ||
      RECONSTRUCTED_ROUTE_CORE.has(name) ||
      SEMANTIC_ROUTE_OVERRIDES.has(name)
    ) continue;
    const code = await fs.readFile(path.join(assetDirectory, name), "utf8");
    recovered.add(name);
    for (const match of code.matchAll(STATIC_IMPORT_RE)) pending.push(match[1]);
  }
  return recovered;
}
