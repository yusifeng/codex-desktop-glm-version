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
  Lin as hasCompleteConversationHistory,
  Mg as initializeBackgroundAgentModel,
  Og as initializeBackgroundAgentTabs,
  Pin as getConversationMessages,
  RQt as activeConversationIdsByHost,
  Ugn as getConversationHydrator,
  Wvt as initializeSidePanel,
  jg as getBackgroundAgentTabId,
  kg as createBackgroundAgentPanelDefinition,
  vZt as hostServiceById,
  zZt as threadExists,
} from "@rchunk/app-initial";
import {
  Bl as ThreadAvatar,
  Vl as initializeThreadAvatar,
  Wr as initializeConversationSurface,
} from "@rchunk/app-primary";
import { ensureConversationReady } from "../app-primary/runtime/ensure-conversation-ready";
import { r as initializeOpenTarget } from "@rchunk/open-target";

export interface BackgroundAgent {
  canInteract: boolean;
  conversationId: string;
  displayName: string;
}

export interface BackgroundAgentScope {
  get(signal: unknown, parameter?: unknown): unknown;
}

interface ConversationState {
  resumeState?: string;
}

interface ConversationStore {
  getConversation(conversationId: string): ConversationState | null | undefined;
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

  const available = ensureConversationReady(
    {
      getConversationStore: (requestedHostId) =>
        scope.get(hostServiceById, requestedHostId) as ConversationStore | null | undefined,
      getHydrationService: (requestedHostId) =>
        getConversationHydrator(scope, requestedHostId),
    },
    backgroundAgent.conversationId,
    hostId,
    {
      isResumed: (conversation) => conversation.resumeState === "resumed",
      hasSufficientHistory: (conversation) =>
        getConversationMessages(conversation).length > 0 ||
        hasCompleteConversationHistory(conversation),
    },
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
  initializeConversationSurface();
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
