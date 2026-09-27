import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  wL as initializeUtilities,
  zU as isRemoteHost,
} from "@rchunk/app-shared";
import {
  Ag as backgroundAgentRouteKind,
  Gvt as openSidePanelTab,
  HZt as initializeSidePanelRoutes,
  Mg as initializeBackgroundAgentModel,
  Og as initializeBackgroundAgentTabs,
  RQt as activeConversationIdsByHost,
  Wvt as initializeSidePanel,
  jg as getBackgroundAgentTabId,
  kg as createBackgroundAgentPanelDefinition,
  vZt as hostServiceById,
  zZt as threadExists,
} from "@rchunk/app-initial";
import {
  Bl as ThreadAvatar,
  Ur as ensureConversationAvailable,
  Vl as initializeConversationAvailability,
  Wr as initializeThreadAvatar,
} from "@rchunk/app-primary";
import { r as initializeOpenTarget } from "@rchunk/open-target";

export interface BackgroundAgent {
  canInteract: boolean;
  conversationId: string;
  displayName: string;
}

export interface BackgroundAgentScope {
  get(signal: unknown, parameter?: unknown): unknown;
}

export interface OpenBackgroundAgentOptions {
  backgroundAgent: BackgroundAgent;
  hostId: string;
  insertPosition?: unknown;
  revealAndFocus?: boolean;
  shouldResume?: boolean;
  tabId?: string;
  TabComponent?: unknown;
}

let backgroundAgentPanelDefinition: unknown;

async function openLocalConversationBackgroundAgent(
  scope: BackgroundAgentScope,
  {
    revealAndFocus = true,
    backgroundAgent,
    hostId,
    insertPosition,
    shouldResume = !isRemoteHost(hostId),
    tabId,
    TabComponent,
  }: OpenBackgroundAgentOptions,
): Promise<unknown | null> {
  const hostService = scope.get(hostServiceById, hostId) as
    | { activateThreadSummary(id: string, options: { addToRecent: boolean }): void }
    | null
    | undefined;
  hostService?.activateThreadSummary(backgroundAgent.conversationId, { addToRecent: false });

  const available = ensureConversationAvailable(
    scope,
    backgroundAgent.conversationId,
    hostId,
  );
  if (available !== true && !(await available)) return null;

  return renderBackgroundAgentTab(scope, {
    revealAndFocus,
    backgroundAgent,
    hostId,
    insertPosition,
    shouldResume,
    tabId,
    TabComponent,
  });
}

function renderBackgroundAgentTab(
  scope: BackgroundAgentScope,
  {
    revealAndFocus = true,
    backgroundAgent,
    hostId,
    insertPosition,
    shouldResume = true,
    tabId,
    TabComponent,
  }: OpenBackgroundAgentOptions,
): unknown | null {
  const exists = scope.get(threadExists, backgroundAgent.conversationId);
  const activeIds = scope.get(activeConversationIdsByHost, hostId) as string[];
  if (!exists || activeIds.includes(backgroundAgent.conversationId)) return null;

  const id = tabId ?? getBackgroundAgentTabId(backgroundAgent.conversationId);
  const ReactJsx = getJsxRuntime();
  return openSidePanelTab(scope, backgroundAgentPanelDefinition, {
    revealAndFocus,
    durableRoute: {
      kind: backgroundAgentRouteKind,
      params: { conversationId: backgroundAgent.conversationId },
      payloadVersion: 1,
    },
    icon: ReactJsx.jsx(ThreadAvatar, {
      className: "icon-sm",
      seed: backgroundAgent.conversationId,
    }),
    id,
    insertPosition,
    props: {
      canInteract: backgroundAgent.canInteract,
      conversationId: backgroundAgent.conversationId,
      hostId,
      shouldResume,
      onOpenBackgroundAgent: (nextAgent: BackgroundAgent) => {
        void openLocalConversationBackgroundAgent(scope, {
          backgroundAgent: nextAgent,
          hostId,
          shouldResume,
          TabComponent,
        });
      },
    },
    title: backgroundAgent.displayName,
  });
}

function initializeOpenLocalConversationBackgroundAgent(): void {
  initializeUtilities();
  initializeSidePanelRoutes();
  initializeSidePanel();
  initializeBackgroundAgentTabs();
  initializeConversationAvailability();
  initializeBackgroundAgentModel();
  initializeThreadAvatar();
  getJsxRuntime();
  initializeOpenTarget();
  backgroundAgentPanelDefinition = createBackgroundAgentPanelDefinition({
    open: openLocalConversationBackgroundAgent,
  });
}

export {
  initializeOpenLocalConversationBackgroundAgent as n,
  openLocalConversationBackgroundAgent as r,
  backgroundAgentPanelDefinition as t,
};
