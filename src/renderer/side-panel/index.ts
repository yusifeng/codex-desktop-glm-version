import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  H3 as initializeLazyComponents,
  Hy as EnvironmentIcon,
  Jm as createLazyComponent,
  V3 as preloadModule,
  e6 as getReactRuntime,
  lw as initializeReactRuntime,
  oZ as createSignalFamily,
  pZ as createSignal,
  qm as initializePanelComponents,
  rJ as isClientConversationId,
  sZ as createDerivedSignal,
  wL as initializeWindowRuntime,
} from "@rchunk/app-shared";
import {
  $en as conversationScope,
  Ebt as initializeEnvironmentAvailability,
  FDt as initializeSidePanelDefinitions,
  Ftn as initializeThreadState,
  Gvt as openSidePanelTab,
  IDt as registerSidePanelTabType,
  Otn as canonicalConversationIdFamily,
  Utn as resolvedConversationIdFamily,
  Wvt as initializeSidePanelRuntime,
  _vt as initializeRightPanelState,
  itn as initializeConversationScope,
  mpn as intlSignal,
  ppn as initializeIntlRuntime,
  qvt as rightPanelState,
  vbt as environmentSetupAvailableSignal,
  vvt as revealSidePanel,
  wtn as sidePanelLayoutSignal,
} from "@rchunk/app-initial";

interface EnvironmentPanelScope {
  get<Value>(signal: unknown, parameter?: unknown): Value;
  set<Value>(signal: unknown, parameter: unknown, value?: Value): void;
  value: {
    clientThreadId?: string;
    conversationId?: string;
    routeKind?: string;
  };
}

let EnvironmentSetupPanel: (props: Record<string, unknown>) => unknown;
let environmentSetupDefinition: { kind?: string };
let pendingEnvironmentIdFamily: unknown;
let isEnvironmentSetupActive: unknown;
let environmentSetupOpenedAutomatically: unknown;
let React: ReturnType<typeof getReactRuntime>;

const environmentSetupDependencies = [
  "./tab-panel-f36ccc73e17f.js",
  "./rolldown-runtime-2d059c5e81f4.js",
  "./app-shared-7b9edc1bfb7f.js",
  "./app-shared-fa570b9eb9dd.css",
  "./app-initial-51da50e6c6e3.js",
  "./app-initial-e8ceb32eb626.css",
  "./publish-actions-271f912485e5.js",
  "./pending-onboarding-9e794fa64b02.js",
  "./allowed-domains-input-2ddf45ddb4ff.js",
  "./validation-message-f0452d72af5e.js",
  "./change-messages-b91c906d971c.js",
  "./configuration-fields-56633f88c571.js",
  "./codex-diff-css-4cc1d2356a79.js",
  "./register-pierre-themes-58d8ca57f84b.js",
  "./File-4270090fca79.js",
  "./renderFileChildren-897963e963e5.js",
  "./file-diff-d04472cf49af.js",
  "./file-diff-presentation-b78d448e2f9c.js",
  "./virtualized-file-diff-line-position-c13dbee45987.js",
  "./result-values-d618934c5c1e.js",
  "./editor-370fecef1630.js",
  "./error-1e0b38c6edf3.js",
] as const;

function createEnvironmentSetupDefinition({
  open,
}: {
  open: (...arguments_: unknown[]) => unknown;
}): { kind?: string } {
  return registerSidePanelTabType("environment-setup", EnvironmentSetupPanel, {
    getId: (scope: EnvironmentPanelScope, { conversationId }: { conversationId: string }) =>
      `environment-setup:${isClientConversationId(conversationId)
        ? conversationId
        : (scope.get(canonicalConversationIdFamily, conversationId) ?? conversationId)}`,
    isAvailable: (scope: EnvironmentPanelScope, input?: { conversationId: string }) =>
      scope.value.routeKind === "client-local-thread"
        ? input != null && scope.value.clientThreadId === input.conversationId
        : scope.value.routeKind === "local-thread"
          && (input == null
            || scope.value.conversationId === scope.get(resolvedConversationIdFamily, input.conversationId)),
    open,
  }) as { kind?: string };
}

function initializeEnvironmentSetupPanel(): void {
  initializeWindowRuntime();
  initializeSidePanelDefinitions();
  initializePanelComponents();
  initializeThreadState();
  initializeLazyComponents();
  EnvironmentSetupPanel = createLazyComponent(
    async () => {
      const { EnvironmentSetupTabPanel } = await preloadModule(
        async () => import("@rchunk/environment-setup-tab-panel"),
        environmentSetupDependencies,
        import.meta.url,
      );
      return EnvironmentSetupTabPanel;
    },
    { propagateLoadError: true },
  );
}

function initializePendingEnvironmentState(): void {
  initializeSignalRuntime();
  initializeConversationScope();
  pendingEnvironmentIdFamily = createSignalFamily(conversationScope, () => null);
}

function openEnvironmentSetupPanel(
  scope: EnvironmentPanelScope,
  conversationId: string,
  environmentId?: string | null,
): boolean {
  const routeMatches = (scope.value.routeKind === "local-thread"
      && scope.value.conversationId === conversationId)
    || (scope.value.routeKind === "client-local-thread"
      && scope.value.clientThreadId === conversationId);
  if (!routeMatches) return false;
  openSidePanelTab(scope, environmentSetupDefinition, {
    revealAndFocus: true,
    allowDuringThreadCreation: true,
    icon: React.createElement(EnvironmentIcon, null),
    id: `environment-setup:${isClientConversationId(conversationId)
      ? conversationId
      : (scope.get(canonicalConversationIdFamily, conversationId) ?? conversationId)}`,
    props: { conversationId },
    requiresWorkspaceReady: false,
    title: scope.get<{ formatMessage(input: Record<string, unknown>): string }>(intlSignal)
      .formatMessage({
        id: "restricted.environmentSetup.sidePanel.tabTitle",
        defaultMessage: "Environment",
        description: "Title of the side-panel tab for editing a cloud environment",
      }),
  });
  const visible = revealSidePanel(scope, "right");
  if (visible && !isClientConversationId(conversationId)) {
    scope.set(pendingEnvironmentIdFamily, conversationId, environmentId ?? null);
  }
  return visible;
}

function openEnvironmentSetupPanelOnce(scope: EnvironmentPanelScope, conversationId: string): void {
  if (!scope.get(environmentSetupOpenedAutomatically)
    && openEnvironmentSetupPanel(scope, conversationId)) {
    scope.set(environmentSetupOpenedAutomatically, true);
  }
}

function initializeEnvironmentSetupSidePanel(): void {
  initializeSignalRuntime();
  initializeWindowRuntime();
  React = getReactRuntime();
  initializeReactRuntime();
  initializeSidePanelRuntime();
  initializeEnvironmentAvailability();
  initializeIntlRuntime();
  initializeThreadState();
  initializeEnvironmentSetupPanel();
  initializeRightPanelState();
  initializePendingEnvironmentState();
  environmentSetupDefinition = createEnvironmentSetupDefinition({ open: openEnvironmentSetupPanel });
  isEnvironmentSetupActive = createDerivedSignal(sidePanelLayoutSignal, ({ get }) => {
    const activeTab = get(rightPanelState.activeTab$) as {
      tabType?: { kind?: string };
    } | null;
    return get(environmentSetupAvailableSignal)
      && activeTab?.tabType?.kind === environmentSetupDefinition.kind;
  });
  environmentSetupOpenedAutomatically = createSignal(sidePanelLayoutSignal, false);
}

export {
  pendingEnvironmentIdFamily as a,
  openEnvironmentSetupPanel as i,
  initializeEnvironmentSetupSidePanel as n,
  initializePendingEnvironmentState as o,
  isEnvironmentSetupActive as r,
  openEnvironmentSetupPanelOnce as t,
};
