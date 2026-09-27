import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
export interface ComposerTipContext { browserExtensionInstalled?: boolean; capabilities?: Iterable<string>; notificationOnboardingResolved?: boolean; notificationPermissionStatus?: string }
export interface ComposerTip { action: { type: "navigate" | "open-notification-settings"; path?: string }; actionLabel: string; badgeLabel: string; content: string; id: string; isEligible(context: ComposerTipContext): boolean }
const tips: ComposerTip[] = [
  { id: "documents", action: { type: "navigate", path: "/" }, badgeLabel: "TIP", content: "Turn your work into a document you can download and share.", actionLabel: "Create a document", isEligible: () => true },
  { id: "notifications", action: { type: "open-notification-settings" }, badgeLabel: "TIP", content: "Get notified when work is complete.", actionLabel: "Enable notifications", isEligible: context => context.notificationOnboardingResolved === true && context.notificationPermissionStatus === "disabled" },
  { id: "computer-use", action: { type: "navigate", path: "/settings/computer-use" }, badgeLabel: "TIP", content: "Let ChatGPT work with apps on this computer.", actionLabel: "Set up", isEligible: context => new Set(context.capabilities ?? []).has("computer-use") },
  { id: "browser-use", action: { type: "navigate", path: "/settings/computer-use" }, badgeLabel: "TIP", content: "Use the browser extension with ChatGPT.", actionLabel: "Install extension", isEligible: context => context.browserExtensionInstalled === false },
];
function getComposerTipFromCampaign(campaignId: string): ComposerTip | null { if (!campaignId.startsWith("codex_composer_tip_")) return null; const id = campaignId.slice("codex_composer_tip_".length).replaceAll("_", "-"); return tips.find(tip => tip.id === id) ?? null; }
function initializeComposerTipCatalog(): void {}
export { initializeComposerTipCatalog as n, getComposerTipFromCampaign as t };
