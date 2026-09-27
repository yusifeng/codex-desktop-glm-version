import {
  e6 as getReactRuntime,
  lw as initializeBrowserIcons,
  wy as AutomationIcon,
} from "@rchunk/app-shared";
import {
  FCt as initializeAutomationModel,
  Gvt as openSidePanelTab,
  HZt as initializeSidePanelRoutes,
  ICt as isHeartbeatAutomation,
  QCt as automationsQuery,
  Ugn as getHostService,
  Wgn as initializeHostServices,
  Wvt as initializeSidePanel,
  ZCt as initializeAutomationQueries,
  _vt as initializeThreadAccounts,
  dg as initializeRouting,
  fg as createSidePanelDefinition,
  gvt as getTabTarget,
  hsn as isThreadAccount,
  mg as initializePanelRegistry,
  msn as initializeConversationState,
  pg as pullRequestFixRouteKind,
  wQt as conversationAccount,
  zZt as threadExists,
} from "@rchunk/app-initial";

export interface PullRequestFixPanelInput {
  automationId: string;
  targetConversationId: string;
  title: string;
}

export interface PullRequestFixPanelOptions {
  insertPosition?: unknown;
  revealAndFocus?: boolean;
  tabId?: string;
  target?: string;
}

export interface PullRequestFixPanelScope {
  value: { conversationId: string; routeKind: string };
  get(signal: unknown, parameter?: unknown): unknown;
  query: {
    getOrFetch(signal: unknown): Promise<{
      items: Array<{
        id: string;
        name: string;
        status: string;
        targetThreadId?: string;
        [key: string]: unknown;
      }>;
    }>;
  };
}

let pullRequestFixPanelDefinition: unknown;

function openPullRequestFixAutomationPanel(
  scope: PullRequestFixPanelScope,
  { automationId, targetConversationId, title }: PullRequestFixPanelInput,
  {
    revealAndFocus = true,
    insertPosition,
    tabId,
    target = "right",
  }: PullRequestFixPanelOptions = {},
): unknown {
  const id = tabId ?? `pull-request-auto-fix:${targetConversationId}`;
  const resolvedTarget =
    (getTabTarget(scope, id) as string | null | undefined) ?? target;
  const React = getReactRuntime();
  return openSidePanelTab(scope, pullRequestFixPanelDefinition, {
    revealAndFocus,
    durableRoute:
      automationId.trim() === "" || targetConversationId.trim() === ""
        ? undefined
        : {
            kind: pullRequestFixRouteKind,
            params: { automationId, targetConversationId },
            payloadVersion: 1,
          },
    icon: React.createElement(AutomationIcon, { "aria-hidden": false }),
    id,
    insertPosition,
    props: { conversationId: targetConversationId },
    target: resolvedTarget,
    title,
    tooltip: title,
  });
}

async function restorePullRequestFixAutomationSidePanelTab(
  scope: PullRequestFixPanelScope,
  { automationId, targetConversationId }: Omit<PullRequestFixPanelInput, "title">,
  { insertPosition, revealAndFocus, tabId, target }: PullRequestFixPanelOptions,
): Promise<boolean> {
  if (scope.value.routeKind !== "local-thread") return false;
  const account = scope.get(conversationAccount, scope.value.conversationId);
  if (!isThreadAccount(account)) return false;
  try {
    const { items } = await scope.query.getOrFetch(automationsQuery);
    const automation = items.find(({ id }) => id === automationId);
    if (
      automation == null ||
      automation.status === "DELETED" ||
      !isHeartbeatAutomation(automation) ||
      automation.targetThreadId !== targetConversationId
    ) {
      return false;
    }
    if (!scope.get(threadExists, targetConversationId)) {
      const service = getHostService(scope, account) as {
        hydrateBackgroundThreads(ids: string[]): Promise<void>;
      };
      await service.hydrateBackgroundThreads([targetConversationId]);
      if (!scope.get(threadExists, targetConversationId)) return false;
    }
    if (scope.get(conversationAccount, targetConversationId) !== account) return false;
    return (
      openPullRequestFixAutomationPanel(
        scope,
        {
          automationId,
          targetConversationId,
          title: automation.name,
        },
        { insertPosition, revealAndFocus, tabId, target },
      ) === tabId
    );
  } catch {
    return false;
  }
}

function initializePullRequestFixAutomationPanel(): void {
  initializeHostServices();
  initializeSidePanelRoutes();
  initializeSidePanel();
  initializeConversationState();
  initializeAutomationQueries();
  initializeBrowserIcons();
  initializeRouting();
  initializeThreadAccounts();
  initializeAutomationModel();
  initializePanelRegistry();
  pullRequestFixPanelDefinition = createSidePanelDefinition({
    open: openPullRequestFixAutomationPanel,
    restore: restorePullRequestFixAutomationSidePanelTab,
  });
}

export {
  openPullRequestFixAutomationPanel as n,
  restorePullRequestFixAutomationSidePanelTab as r,
  initializePullRequestFixAutomationPanel as t,
};
