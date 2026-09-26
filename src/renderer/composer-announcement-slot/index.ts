// composer-announcement-slot —— Composer 公告候选的跨区域优先级仲裁。
// 原版：app/webview/assets/composer-announcement-slot-6e5975fb94c1.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export type ComposerAnnouncementArea = "home" | "task" | "chat" | "work";

export interface ComposerAnnouncementCandidate<T = unknown> {
  id: string;
  isEligible: boolean;
  isLoading: boolean;
  content: T | null;
  pageContextClaim?: unknown;
  trackVisibility?: boolean;
}

const announcementPriorities: ReadonlyArray<{
  id: string;
  areas: readonly ComposerAnnouncementArea[];
}> = [
  { id: "debug-forced-beacon", areas: ["home", "chat", "work"] },
  { id: "windows-sandbox", areas: ["home", "task"] },
  { id: "wsl-migration", areas: ["home", "task"] },
  { id: "full-access", areas: ["home", "task"] },
  { id: "workspace-renewal-payment", areas: ["home", "task", "chat", "work"] },
  { id: "git-checkout-warning", areas: ["home"] },
  { id: "safety-access", areas: ["chat", "work"] },
  { id: "cyber-safety", areas: ["home", "task"] },
  { id: "chatgpt-rate-limit", areas: ["chat"] },
  { id: "work-luna-reserve", areas: ["work"] },
  { id: "model-upgrade", areas: ["task"] },
  { id: "codex-usage", areas: ["home", "task"] },
  { id: "ultra-usage", areas: ["home", "task"] },
  { id: "file-upload-limit", areas: ["chat", "work"] },
  { id: "misalignment-policy", areas: ["home", "task"] },
  { id: "safety-buffering", areas: ["home", "task"] },
  { id: "voice-reasoning", areas: ["task"] },
  { id: "rate-limit-reset", areas: ["home"] },
  { id: "conversation-beacon", areas: ["chat", "work"] },
  { id: "library-pasted-link-connect", areas: ["chat", "work"] },
  { id: "composer-tip", areas: ["chat", "work"] },
  { id: "subscription-onboarding", areas: ["home", "chat", "work"] },
  { id: "home-beacon", areas: ["home", "chat", "work"] },
  { id: "gift-credits", areas: ["home", "chat", "work"] },
  { id: "realtime-voice", areas: ["home", "chat", "work"] },
  { id: "external-agent-import", areas: ["home", "chat", "work"] },
  { id: "worktree-onboarding", areas: ["home", "chat", "work"] },
  { id: "computer-history", areas: ["home", "chat", "work"] },
  { id: "codex-replay", areas: ["home", "chat", "work"] },
  { id: "app-upsell", areas: ["home"] },
  { id: "multi-agent", areas: ["home"] },
  { id: "fast-mode", areas: ["home"] },
  { id: "browser-preview", areas: ["home", "chat", "work"] },
  { id: "dictation-first-use", areas: ["home", "task", "chat", "work"] },
];

function selectComposerAnnouncement<T>(
  candidates: readonly ComposerAnnouncementCandidate<T>[],
  area: ComposerAnnouncementArea,
): ComposerAnnouncementCandidate<T> | null | undefined {
  for (const priority of announcementPriorities) {
    if (!priority.areas.includes(area)) continue;
    const candidate = candidates.find((item) => item.id === priority.id);
    if (candidate?.isEligible) return candidate;
    if (candidate?.isLoading) return undefined;
  }
  return null;
}

function createComposerAnnouncementCandidate<T>(
  id: string,
  content: T | boolean | null | undefined,
): ComposerAnnouncementCandidate<T> {
  return {
    id,
    isEligible: content != null && typeof content !== "boolean",
    isLoading: false,
    content: typeof content === "boolean" ? null : content ?? null,
  };
}

function ComposerAnnouncementSlot<T>(input: {
  area: ComposerAnnouncementArea;
  candidates: readonly ComposerAnnouncementCandidate<T>[];
  homeCandidates?: readonly ComposerAnnouncementCandidate<T>[] | null;
}) {
  const candidate = selectComposerAnnouncement(
    [...input.candidates, ...(input.homeCandidates ?? [])],
    input.area,
  );
  if (candidate?.content == null) return null;
  return {
    kind: "composer-announcement" as const,
    id: candidate.id,
    content: candidate.content,
    pageContextClaim: candidate.pageContextClaim,
    visibilityClaim: candidate.trackVisibility === true ? "HomeAnnouncement" : undefined,
  };
}

function initializeComposerAnnouncementPriorities(): void {}
function initializeComposerAnnouncementSlot(): void {}

export {
  initializeComposerAnnouncementPriorities as i,
  initializeComposerAnnouncementSlot as n,
  createComposerAnnouncementCandidate as r,
  ComposerAnnouncementSlot as t,
};
