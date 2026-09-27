import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { dun as createPersistedState } from "@rchunk/app-initial";

interface WritableState<Value> { value: Value }
interface StateScope { set<Value>(state: WritableState<Value>, value: Value): void }
interface TargetRules { domains?: string[]; urls?: string[] }
interface DiscoveryInput {
  bannerAlreadyVisible?: boolean;
  bannerDismissedAtMs?: number | null;
  experimentAvailable?: boolean;
  experimentEnabled?: boolean;
  hasImported?: boolean;
  hasLoadedBrowserPage?: boolean;
  hasSeenBanner?: boolean;
  hasSeenModal?: boolean;
  isModalExperimentAssignment?: boolean;
  isPanelSettled?: boolean;
  isVisible?: boolean;
  modalDismissedAtMs?: number | null;
  nowMs: number;
  profiles?: readonly unknown[] | null;
  profilesQuerySucceeded?: boolean;
  serviceAvailable?: boolean;
}

const n = "1161538056";
const r = "show_modal";
const i = "target_specific_urls";
const a = "178837158";
const t = 86_400_000;
let f: WritableState<boolean>;
let p: WritableState<boolean>;
let s: WritableState<number | null>;
let c: WritableState<number | null>;

function h(rules: TargetRules, candidate: string): boolean {
  if (!URL.canParse(candidate)) return false;
  const url = new URL(candidate);
  return (rules.domains ?? []).some((domain) => {
    const normalized = domain.trim().toLowerCase();
    return normalized !== "" && (url.hostname === normalized || url.hostname.endsWith(`.${normalized}`));
  }) || (rules.urls ?? []).some((prefix) => {
    const normalized = prefix.trim();
    return URL.canParse(normalized) && url.href.startsWith(new URL(normalized).href);
  });
}

function cooledDown(timestamp: number, now: number): boolean { return now - timestamp >= t; }

function presentation(input: DiscoveryInput): "banner" | "modal" | null {
  const {
    bannerAlreadyVisible = false, bannerDismissedAtMs, experimentEnabled = false,
    hasImported, hasLoadedBrowserPage = false, hasSeenBanner, hasSeenModal,
    isModalExperimentAssignment = false, isVisible = false, modalDismissedAtMs,
    nowMs, profiles, profilesQuerySucceeded = false, serviceAvailable = false,
  } = input;
  if (hasImported !== false || hasSeenBanner === undefined || hasSeenModal === undefined ||
      bannerDismissedAtMs === undefined || modalDismissedAtMs === undefined || !isVisible ||
      !serviceAvailable || !profilesQuerySucceeded || profiles == null || profiles.length === 0 ||
      (isModalExperimentAssignment && !hasLoadedBrowserPage && !bannerAlreadyVisible)) return null;
  if (bannerDismissedAtMs != null && (modalDismissedAtMs == null || bannerDismissedAtMs > modalDismissedAtMs)) {
    return experimentEnabled && !hasSeenModal && cooledDown(bannerDismissedAtMs, nowMs) ? "modal" : null;
  }
  if (modalDismissedAtMs != null && (bannerDismissedAtMs == null || modalDismissedAtMs > bannerDismissedAtMs)) {
    return cooledDown(modalDismissedAtMs, nowMs) ? "banner" : null;
  }
  if (experimentEnabled && !hasSeenModal && !bannerAlreadyVisible) return "modal";
  return !hasSeenBanner && !hasSeenModal ? "banner" : null;
}

function d(input: DiscoveryInput): { cooldownEndsAtMs: number | null; presentation: "banner" | "modal" | null; shouldDiscoverProfiles: boolean } {
  const latestDismissal = input.bannerDismissedAtMs == null
    ? input.modalDismissedAtMs
    : input.modalDismissedAtMs == null
      ? input.bannerDismissedAtMs
      : Math.max(input.bannerDismissedAtMs, input.modalDismissedAtMs);
  return {
    cooldownEndsAtMs: latestDismissal == null ? null : latestDismissal + t,
    presentation: presentation(input),
    shouldDiscoverProfiles: input.isVisible === true && input.isPanelSettled === true &&
      input.serviceAvailable === true && input.hasImported === false &&
      (input.hasSeenBanner === false || input.modalDismissedAtMs != null ||
        (input.experimentAvailable === true && (input.hasSeenModal === false || input.bannerDismissedAtMs != null))),
  };
}

function l(scope: StateScope): void { scope.set(f, true); scope.set(s, Date.now()); }
function u(scope: StateScope): void { scope.set(p, true); scope.set(c, Date.now()); }
function o(scope: StateScope): void { scope.set(f, true); scope.set(p, true); }
function m(): void {
  f ??= createPersistedState("browser-profile-import-banner-seen", false) as unknown as WritableState<boolean>;
  p ??= createPersistedState("browser-profile-import-modal-seen", false) as unknown as WritableState<boolean>;
  s ??= createPersistedState<number | null>("browser-profile-import-banner-dismissed-at", null) as unknown as WritableState<number | null>;
  c ??= createPersistedState<number | null>("browser-profile-import-modal-dismissed-at", null) as unknown as WritableState<number | null>;
}

export { a, c, d, f, h, i, l, m, n, o, p, r, s, t, u };
