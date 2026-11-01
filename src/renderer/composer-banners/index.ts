import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as usageChunk from "@rchunk/usage";
import * as slotChunk from "@rchunk/composer-announcement-slot";

interface Candidate { content: unknown; id: string; isEligible: boolean; isLoading: boolean }
interface LegacyWslState { destinationLabel?: string; hostId?: string; kind: string; project?: { hostId: string; remotePath: string } }
interface EnvironmentBanners { legacyWslState?: LegacyWslState; showFullAccessWarning?: boolean; windowsSandboxWarnings?: unknown }
export interface ComposerBannersProps {
  conversationId?: string | null;
  environmentBanners?: EnvironmentBanners | null;
  hostId: string;
  homeComposerBanners?: unknown;
  latestTurnId?: string | null;
  misalignmentPolicyViolationBanner?: unknown;
  onDismissSafetyEvent?(): void;
  safetyBufferingBanner?: unknown;
  safetyEvent?: unknown;
  showUltraWarning?: boolean;
  ultraWarningModel?: string | null;
  usageBannerProps?: Record<string, unknown>;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;
const usage = usageChunk as unknown as Record<string, unknown>;
const slot = slotChunk as unknown as Record<string, unknown>;
let React: { Suspense: unknown };
let jsx: { jsx(component: unknown, props: Record<string, unknown>): unknown };
let TaskAnnouncementCandidates: unknown;
let ultraWarningDismissed: unknown;

function call(candidate: unknown): void { if (typeof candidate === "function") candidate(); }
function candidate(id: string, content: unknown): Candidate {
  return (slot.r as (id: string, content: unknown) => Candidate)(id, content);
}

function UltraAgentUsageWarning({ conversationId, model }: { conversationId?: string | null; model: string }): unknown {
  const scope = (shared.LX as (root: unknown) => { set(signal: unknown, value: unknown): void })(shared.ZI);
  const conversation = (initial.jyt as (id: string | null | undefined) => { cwd?: string; hostId: string })(conversationId);
  const host = (initial.P6t as (id: string) => { authMethod?: unknown } | null)(conversation.hostId);
  const modelQuery = (initial.w8 as (options: { hostId: string }) => { data?: { models?: unknown[] } })({ hostId: conversation.hostId });
  const { data: config } = (shared.BX as (
    signal: unknown,
    key: unknown,
  ) => { data?: unknown })(initial.wst, { cwd: conversation.cwd, hostId: conversation.hostId });
  const dismissed = (shared.HX as (signal: unknown) => boolean)(ultraWarningDismissed);
  const matching = (primary.Tp as (models: unknown[] | undefined, model: string) => Array<{ reasoningEffort?: string }>)(modelQuery.data?.models, model);
  const hasUltra = matching.some(item => item.reasoningEffort === "ultra");
  const count = hasUltra ? (primary.Cp as (input: { authMethod?: unknown; config: unknown }) => number | undefined)({ authMethod: host?.authMethod, config }) : undefined;
  if (count == null || dismissed !== false) return null;
  return jsx.jsx(initial.n7, {
    ariaLive: "polite",
    content: jsx.jsx(shared.Y2, {
      id: "composer.intelligenceDropdown.ultraAgentUsageWarning",
      defaultMessage: "Ultra with up to {count} agents can use your usage limits quickly",
      description: "Warning above the composer when a ChatGPT-authenticated user has configured many agents and selected Ultra reasoning",
      values: { count },
    }),
    Icon: primary.Jp,
    onSecondaryCtaClick: () => scope.set(ultraWarningDismissed, true),
    role: "status",
    secondaryCtaText: jsx.jsx(shared.Y2, {
      id: "composer.intelligenceDropdown.ultraAgentUsageWarning.dismiss",
      defaultMessage: "Dismiss",
      description: "Button to permanently dismiss the Ultra reasoning and high agent count usage warning",
    }),
    type: "warning",
  });
}

function LegacyWslBanner({ state }: { state: LegacyWslState }): unknown {
  const scope = (shared.LX as (root: unknown) => { get(signal: unknown): unknown; set(signal: unknown, value: unknown): void })(initial.kht);
  const conversationId = (initial.Fht as (scope: unknown) => string | null)(scope);
  const navigate = (initial.o_n as () => (path: string) => void)();
  const conversation = (initial.jyt as (id: string | null) => { cwd?: string; hostConfig?: unknown })(conversationId);
  const enabled = state.kind === "handoff" && conversation.cwd != null;
  const branchQuery = (primary.fp as (...args: unknown[]) => { data?: string })(conversation.cwd, conversation.hostConfig, "local_remote_dropdown", { enabled });
  const project = (initial.GM as (conversationId: string | null) => unknown)(conversationId);
  const operation = (primary._p as (project: unknown) => { id: string } | null)(project);
  const { openOperation } = (initial.WM as () => { openOperation(id: string): void })();
  const fallbackBranch = (shared.BX as (signal: unknown, key: unknown) => string | undefined)(initial.RZt, conversationId);
  const title = (shared.BX as (signal: unknown, key: unknown) => string | undefined)(initial.RCt, conversationId);
  if (state.kind === "hidden" || conversationId == null) return null;
  if (state.kind === "handoff" && operation != null && !(primary.yp as (input: Record<string, unknown>) => boolean)({ destinationHostId: state.project?.hostId, destinationWorkspaceRoot: state.project?.remotePath, operation })) return null;
  return jsx.jsx(primary.xp, {
    state,
    onChooseProject: () => scope.set(initial.k3, "composer"),
    onCreateProject: () => (initial.Kj as (options: Record<string, unknown>) => void)({ hostId: state.kind === "createProject" ? state.hostId : undefined }),
    onHandoff: () => {
      if (state.kind !== "handoff" || conversation.cwd == null || state.project == null) return;
      (initial.Uzt as (...args: unknown[]) => void)(scope, primary.Zf, {
        conversationId,
        composerViewState: scope.get(initial._3),
        conversationTitle: title,
        currentBranch: branchQuery.data ?? (primary.hp as (...args: unknown[]) => string | undefined)(operation, conversationId) ?? fallbackBranch ?? "",
        cwd: (shared.iW as (value: string) => string)(conversation.cwd),
        destinationHostId: state.project.hostId,
        destinationWorkspaceRoot: (shared.iW as (value: string) => string)(state.project.remotePath),
        destinationLabel: state.destinationLabel,
      });
      if (operation != null) openOperation(operation.id);
    },
    onOpenConnections: () => navigate("/settings/connections/wsl"),
  });
}

function ComposerBanners({
  conversationId, environmentBanners, hostId, homeComposerBanners, latestTurnId,
  misalignmentPolicyViolationBanner, safetyBufferingBanner, safetyEvent,
  onDismissSafetyEvent, showUltraWarning, ultraWarningModel, usageBannerProps,
}: ComposerBannersProps): unknown {
  initializeComposerBanners();
  const usageContent = (usage.n as (props: Record<string, unknown>) => unknown)({ ...(usageBannerProps ?? {}), hostId });
  const legacyState = environmentBanners?.legacyWslState ?? { kind: "hidden" };
  const legacyContent = jsx.jsx(LegacyWslBanner, { state: legacyState });
  const ultraContent = showUltraWarning && ultraWarningModel != null
    ? jsx.jsx(UltraAgentUsageWarning, { conversationId, model: ultraWarningModel })
    : null;
  const candidates = [
    candidate("windows-sandbox", environmentBanners?.windowsSandboxWarnings),
    candidate("wsl-migration", legacyContent),
    candidate("full-access", environmentBanners?.showFullAccessWarning ? jsx.jsx(primary.Op, {}) : null),
    candidate("cyber-safety", safetyEvent == null ? null : jsx.jsx(primary.Vf, { event: safetyEvent, onDismiss: onDismissSafetyEvent })),
    candidate("codex-usage", usageContent),
    candidate("ultra-usage", ultraContent),
    candidate("misalignment-policy", misalignmentPolicyViolationBanner),
    candidate("safety-buffering", safetyBufferingBanner),
    candidate("dictation-first-use", jsx.jsx(primary.om, {})),
  ];
  if (conversationId == null) {
    return jsx.jsx(slot.t, { area: "home", candidates, homeCandidates: homeComposerBanners });
  }
  return jsx.jsx(React.Suspense, {
    fallback: jsx.jsx(slot.t, {
      area: "task",
      candidates: [...candidates, { id: "workspace-renewal-payment", isEligible: false, isLoading: true, content: null }],
    }),
    children: jsx.jsx(TaskAnnouncementCandidates, { conversationId, hostId, turnId: latestTurnId, candidates }),
  });
}

function initializeComposerBanners(): void {
  if (jsx != null) return;
  call(shared.$3);
  React = (shared.e6 as () => typeof React)();
  call(primary.kp);
  initializeUltraAgentUsageWarning();
  call(usage.t);
  initializeLegacyWslBanner();
  for (const initializer of [slot.i, slot.n, primary.Hf, primary.sm, shared.qm]) call(initializer);
  jsx = (shared.I3 as () => typeof jsx)();
  call(shared.H3);
  const lazy = shared.Jm as (loader: () => Promise<unknown>, options: Record<string, boolean>) => unknown;
  TaskAnnouncementCandidates = lazy(
    async () => (await import("@rchunk/task-announcement-candidates")).TaskAnnouncementCandidates,
    { suspendToParent: true, propagateLoadError: true },
  );
}

function initializeUltraAgentUsageWarning(): void {
  for (const initializer of [
    shared.$3, shared.FX, shared.K2, initial.Tst, initial.M6t, primary.Dp,
    primary.wp, initial.r7, initial.Ayt, primary.Yp, initial.S8, shared.QI, initial.uun,
  ]) call(initializer);
  ultraWarningDismissed = (initial.dun as (key: string, fallback: boolean) => unknown)("ultra-agent-usage-warning-dismissed", false);
}

function initializeLegacyWslBanner(): void {
  for (const initializer of [
    shared.$3, shared.FX, shared.wL, initial.Qgn, initial.HZt, initial.x3,
    primary.Sp, initial.Vzt, primary.dp, initial.Ayt, initial.LCt, primary.Qf,
    initial.VM, initial.Wj, initial.Rht,
  ]) call(initializer);
}

initializeComposerBanners();

export { ComposerBanners };
