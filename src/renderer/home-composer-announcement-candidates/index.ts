import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as announcementsChunk from "@rchunk/codex-home-announcements";
import * as worktreeStateChunk from "@rchunk/worktree-onboarding-state";
import * as entryPointsChunk from "@rchunk/announcement-entry-points";

interface AnnouncementCandidate {
  content: unknown;
  id: string;
  isEligible: boolean;
  isLoading: boolean;
}

interface CandidateState {
  dismiss(): void;
  isEligible: boolean;
  isLoading: boolean;
  markShown?(): void;
  openGiftCredits?(): void;
  openImport?(): void;
  replay?(): void;
}

export interface HomeComposerAnnouncementCandidatesProps {
  beaconProduct?: string | null;
  entryPoint: string;
  homeRunLocationRemoteProject?: unknown;
  includeGitCheckoutWarning?: boolean;
  renderCandidates(candidates: AnnouncementCandidate[]): unknown;
  shouldHideOnboardingPromos?: boolean;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;
const announcements = announcementsChunk as unknown as Record<string, unknown>;
const worktreeState = worktreeStateChunk as unknown as Record<string, unknown>;
const entryPoints = entryPointsChunk as unknown as Record<string, unknown>;

let jsx: {
  jsx(component: unknown, props: Record<string, unknown>, key?: string): unknown;
};
let flushSync: (callback: () => void) => void;
let RealtimeVoiceAnnouncement: unknown;
let WorktreeOnboardingController: unknown;

function callInitializer(candidate: unknown): void {
  if (typeof candidate === "function") candidate();
}

function HomeComposerAnnouncementCandidates({
  renderCandidates,
  beaconProduct,
  entryPoint,
  homeRunLocationRemoteProject,
  includeGitCheckoutWarning,
  shouldHideOnboardingPromos = false,
}: HomeComposerAnnouncementCandidatesProps): unknown {
  initializeHomeComposerAnnouncementCandidates();
  const useScope = shared.LX as (root: unknown) => { set(signal: unknown, value: unknown): void };
  const useSignalValue = shared.HX as (signal: unknown) => unknown;
  const useComposerEditor = initial.HZ as () => {
    eventEmitter: { emit(event: string): void };
    setPromptText(text: string): void;
  };
  const scope = useScope(shared.ZI);
  const isLocalModeRemote = homeRunLocationRemoteProject != null;
  const editor = useComposerEditor();
  const giftState = (entryPoints.i as (options: { enabled: boolean }) => CandidateState)({
    enabled: !shouldHideOnboardingPromos,
  });
  const computerHistoryStatus = useSignalValue(entryPoints.g) as string | undefined;
  const startRealtimeVoice = (initial.Fk as (surface: string) => (() => void) | null | undefined)(
    beaconProduct === "work_tab" ? "work" : entryPoint,
  );
  const voiceAvailable = (initial.qk as () => boolean | undefined)();
  const replayState = (entryPoints.f as (options: { enabled: boolean }) => CandidateState)({ enabled: true });
  const { showPluginInstallDetails } = (initial.U2 as () => { showPluginInstallDetails: boolean })();
  const navigateToLocalConversation = (initial.F$ as () => unknown)();
  const importEnabled = startRealtimeVoice == null || voiceAvailable === false;
  const importState = (entryPoints.o as (options: { enabled: boolean }) => CandidateState)({ enabled: importEnabled });
  const worktreeEnabled = !shouldHideOnboardingPromos && !giftState.isEligible && !giftState.isLoading && importEnabled && !importState.isEligible && !importState.isLoading;
  const worktree = (worktreeState.n as (options: { enabled: boolean; entryPoint: string; isLocalModeRemote: boolean }) => { isEligible: boolean })({ enabled: worktreeEnabled, entryPoint, isLocalModeRemote });
  const worktreeCandidate: AnnouncementCandidate = {
    id: "worktree-onboarding",
    isEligible: worktree.isEligible,
    isLoading: false,
    content: worktree.isEligible ? jsx.jsx(WorktreeOnboardingController, {}) : null,
  };
  const dismissComputerHistory = () => { scope.set(entryPoints.h, true); };
  const viewComputerHistoryRecap = (prompt: string) => {
    scope.set(entryPoints.h, true);
    flushSync(() => editor.setPromptText(prompt));
    editor.eventEmitter.emit("submit");
  };
  const historyAllowed = !shouldHideOnboardingPromos && !isLocalModeRemote && beaconProduct !== "chatgpt";
  const computerHistoryCandidate: AnnouncementCandidate = {
    id: "computer-history",
    isEligible: historyAllowed && computerHistoryStatus === "eligible",
    isLoading: historyAllowed && computerHistoryStatus === "loading",
    content: jsx.jsx(entryPoints.v, { onDismiss: dismissComputerHistory, onViewRecap: viewComputerHistoryRecap }),
  };
  const giftCandidate: AnnouncementCandidate = {
    id: "gift-credits",
    isEligible: !shouldHideOnboardingPromos && giftState.isEligible,
    isLoading: !shouldHideOnboardingPromos && giftState.isLoading,
    content: giftState.isEligible ? jsx.jsx(entryPoints.t, { onDismiss: giftState.dismiss, onOpenGiftCredits: giftState.openGiftCredits }) : null,
  };
  const voiceCandidate: AnnouncementCandidate = {
    id: "realtime-voice",
    isEligible: startRealtimeVoice != null && voiceAvailable === true,
    isLoading: startRealtimeVoice != null && voiceAvailable === undefined,
    content: startRealtimeVoice == null ? null : jsx.jsx(RealtimeVoiceAnnouncement, {
      entryPoint,
      onDismiss: () => (initial.Gk as (scope: unknown) => void)(scope),
      onStart: () => { startRealtimeVoice(); },
    }),
  };
  const importCandidate: AnnouncementCandidate = {
    id: "external-agent-import",
    isEligible: importState.isEligible,
    isLoading: importState.isLoading,
    content: jsx.jsx(entryPoints.s, { onDismiss: importState.dismiss, onImport: importState.openImport, onShown: importState.markShown }),
  };
  const replayCandidate: AnnouncementCandidate = {
    id: "codex-replay",
    isEligible: replayState.isEligible,
    isLoading: replayState.isLoading,
    content: jsx.jsx(entryPoints.p, {
      onDismiss: replayState.dismiss,
      onShown: replayState.markShown,
      onReplay: () => { void (entryPoints.u as (options: Record<string, unknown>) => Promise<void> | void)({ scope, navigateToLocalConversation, onReplay: replayState.replay, showPluginInstallDetails }); },
    }),
  };
  const entries = [giftCandidate, voiceCandidate, importCandidate, worktreeCandidate, computerHistoryCandidate, replayCandidate];
  const fallbackContent = jsx.jsx(primary.om, {});
  if (beaconProduct == null) {
    return jsx.jsx(announcements.t, { composerEntries: entries, fallbackContent, homeRunLocationRemoteProject, includeGitCheckoutWarning, renderCandidates, shouldHideOnboardingPromos });
  }
  return jsx.jsx(announcements.i, { entries, fallbackContent, product: beaconProduct, renderCandidates, shouldHideOnboardingPromos, startRealtimeVoice }, beaconProduct);
}

function initializeHomeComposerAnnouncementCandidates(): void {
  if (jsx != null) return;
  callInitializer(shared.$3);
  callInitializer(shared.FX);
  const reactDomFactory = shared.P3 as () => { flushSync(callback: () => void): void };
  flushSync = reactDomFactory().flushSync;
  for (const candidate of [
    announcements.a, announcements.r, primary.sm, initial.VZ, worktreeState.t,
    entryPoints.y, entryPoints._, shared.qm, entryPoints.m, entryPoints.l,
    entryPoints.d, entryPoints.c, entryPoints.a, entryPoints.n, entryPoints.r,
    initial.L2, initial.Nk, initial.Wk, shared.QI, initial.P$,
  ]) callInitializer(candidate);
  jsx = (shared.I3 as () => typeof jsx)();
  callInitializer(shared.H3);
  const lazy = shared.Jm as (loader: () => Promise<unknown>, options: { propagateLoadError: boolean }) => unknown;
  RealtimeVoiceAnnouncement = lazy(async () => (await import("@rchunk/realtime-voice-home-announcement")).RealtimeVoiceHomeAnnouncementContent, { propagateLoadError: true });
  WorktreeOnboardingController = lazy(async () => (await import("@rchunk/worktree-onboarding-banner-controller")).WorktreeOnboardingBannerController, { propagateLoadError: true });
}

initializeHomeComposerAnnouncementCandidates();

export { HomeComposerAnnouncementCandidates };
