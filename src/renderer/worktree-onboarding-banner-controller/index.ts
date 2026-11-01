// worktree-onboarding-banner-controller —— Worktree 建议横幅及动作控制。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as announcementStateChunk from "@rchunk/home-announcement-state";
import * as stateChunk from "@rchunk/worktree-onboarding-state";
import type {
  JsxRuntime,
  MaitaiScope,
  MaitaiScopeApi,
  ReadableSignal,
} from "@rchunk/app-shared";

void runtimeChunk;

interface WorkspaceState {
  cwd: string;
  hostId: string;
}

interface WorktreeProjectKey {
  cwd: string;
  hostId: string;
}

interface AppInitialBindings {
  Dft(): void;
  Evt(): void;
  Oft(input: { event: unknown; href: string; initiator: string }): void;
  QTt: string;
  Rht(): void;
  eEt(): void;
  j3(
    scope: MaitaiScopeApi<unknown>,
    project: WorktreeProjectKey,
    mode: "worktree",
  ): void;
  jst(): void;
  kht: MaitaiScope<unknown>;
  kst(input: WorktreeProjectKey): WorktreeProjectKey;
  mdt: ReadableSignal<WorkspaceState>;
  pdt(): void;
  x3(): void;
  xpn(
    scope: MaitaiScopeApi<unknown>,
    event: unknown,
    details: { mode: "worktree" },
  ): void;
  xvt(): void;
  ypn(): void;
}

interface WorktreeOnboardingBannerViewProps {
  description: string;
  dismissAction: { ariaLabel: string; icon: unknown; onClick(): void };
  primaryAction: { label: string; onClick(): void };
  secondaryAction: { label: string; onClick(event: unknown): void };
  title: string;
}

interface WorktreeOnboardingBannerProps {
  onDismiss(): void;
  onLearnMore(event: unknown): void;
  onNewWorktree(): void;
}

const {
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: jsxRuntimeExport,
  LX: useSignalScope,
  MA: worktreeAnalyticsEvent,
  fI: initializeIntlRuntime,
  ig: dismissIcon,
  n4: useIntl,
} = appSharedChunk;
const {
  Dft: initializeWorktreeSelection,
  Evt: initializeWindowActions,
  Oft: openExternalLink,
  QTt: worktreeDocumentationUrl,
  Rht: initializeWorkspaceState,
  eEt: initializeBannerRuntime,
  j3: selectWorktreeProject,
  jst: initializeProjectKeys,
  kht: routeScope,
  kst: createWorktreeProjectKey,
  mdt: workspaceSignal,
  pdt: initializeWorkspaceSignals,
  x3: initializeWorktreeMode,
  xpn: trackWorktreeAction,
  xvt: closeWorktreePicker,
  ypn: initializeWorktreeAnalytics,
} = appInitialChunk as unknown as AppInitialBindings;
const announcementState = announcementStateChunk.t as typeof announcementStateChunk.t & {
  presentation: {
    Banner: ((props: WorktreeOnboardingBannerViewProps) => unknown) | null;
    initializeBanner(): void;
  };
};
const {
  Banner,
  initializeBanner,
} = announcementState.presentation;
const {
  r: worktreeOnboardingStateSignal,
  t: initializeWorktreeOnboardingState,
} = stateChunk;

let jsx: JsxRuntime;

function WorktreeOnboardingBanner({
  onDismiss,
  onLearnMore,
  onNewWorktree,
}: WorktreeOnboardingBannerProps): unknown {
  const intl = useIntl();
  const text = (defaultMessage: string) => defaultMessage;
  const props = {
    title: text("Start another task without disturbing your work"),
    description: text("A Git worktree gives your task its own workspace"),
    primaryAction: { label: text("New worktree"), onClick: onNewWorktree },
    secondaryAction: { label: text("Learn more"), onClick: onLearnMore },
    dismissAction: {
      ariaLabel: (() => {
        const value = intl.formatMessage({
          id: "worktreeOnboarding.dismiss",
          defaultMessage: "Dismiss worktree suggestion",
        });
        return typeof value === "string" ? value : "Dismiss worktree suggestion";
      })(),
      icon: dismissIcon,
      onClick: onDismiss,
    },
  };
  return Banner == null
    ? jsx.jsx("aside", { className: "worktree-onboarding-banner", ...props })
    : jsx.jsx(Banner, props);
}

function WorktreeOnboardingBannerController(): unknown {
  initializeWorktreeOnboardingBanner();
  const scope = useSignalScope(routeScope);
  const workspace = useSignalValue(workspaceSignal);
  const onDismiss = () => scope.set(worktreeOnboardingStateSignal, "dismissed");
  const onNewWorktree = () => {
    trackWorktreeAction(scope, worktreeAnalyticsEvent, { mode: "worktree" });
    selectWorktreeProject(
      scope,
      createWorktreeProjectKey({
        cwd: workspace.cwd,
        hostId: workspace.hostId,
      }),
      "worktree",
    );
    closeWorktreePicker();
  };
  const onLearnMore = (event: unknown) =>
    openExternalLink({
      event,
      href: worktreeDocumentationUrl,
      initiator: "open_in_browser_bridge",
    });
  return jsx.jsx(WorktreeOnboardingBanner, {
    onDismiss,
    onLearnMore,
    onNewWorktree,
  });
}

function initializeWorktreeOnboardingBanner(): void {
  if (jsx != null) return;
  initializeIntlRuntime();
  initializeSignalRuntime();
  initializeBannerRuntime();
  initializeWorktreeSelection();
  initializeWorktreeAnalytics();
  initializeWorkspaceSignals();
  initializeWorkspaceState();
  initializeProjectKeys();
  initializeWorktreeMode();
  initializeWindowActions();
  initializeWorktreeOnboardingState();
  initializeBanner();
  jsx = resolveRuntime<JsxRuntime>(jsxRuntimeExport);
}

function resolveRuntime<T>(value: unknown): T {
  return (typeof value === "function" ? value() : value) as T;
}

initializeWorktreeOnboardingBanner();

export { WorktreeOnboardingBannerController };
