import "@rchunk/rolldown-runtime";
import { Q3 as logger, Z3 as initializeLogger } from "@rchunk/app-shared";
import {
  GZt as conversationHydratedFamily,
  Gvt as openSidePanelTab,
  HZt as initializeSubagentsPanel,
  PQt as conversationRecordFamily,
  Ugn as getConversationHydrator,
  Wgn as initializeConversationHydration,
  Wvt as initializeSidePanel,
  ag as createSidePanelDefinition,
  cg as initializeConversationModels,
  ig as initializeSubagentIcon,
  kZt as lastHydratedTurnStartedAtFamily,
  lQt as activeTurnFamily,
  mpn as intlSignal,
  og as subagentsRouteKind,
  ppn as initializeIntlRuntime,
  qvt as rightPanelState,
  sg as getSubagentsTabId,
  vZt as conversationStoreFamily,
  wZt as conversationTurnsFamily,
  zZt as conversationExistsFamily,
} from "@rchunk/app-initial";
import {
  n as verifyDescendant,
  t as initializeVerifyDescendant,
} from "@rchunk/verify-descendant";

interface PanelScope {
  get<Value>(signal: unknown, parameter?: unknown): Value;
}

interface OpenSubagentsOptions extends Record<string, unknown> {
  deferHydrationUntilActivation?: boolean;
  hostId: string;
  insertPosition?: unknown;
  openOverviewWhenSelectionUnavailable?: boolean;
  parentConversationId: string;
  revealAndFocus?: boolean;
  selectedConversationId?: string | null;
  selectedDisplayName?: string | null;
  tabId?: string;
}

let subagentsPanelDefinition: unknown;

async function openLocalConversationSubagentsPanel(
  scope: PanelScope,
  {
    revealAndFocus = true,
    deferHydrationUntilActivation = false,
    hostId,
    insertPosition,
    openOverviewWhenSelectionUnavailable = false,
    parentConversationId,
    selectedConversationId = null,
    selectedDisplayName = null,
    tabId,
  }: OpenSubagentsOptions,
): Promise<unknown> {
  const id = tabId ?? getSubagentsTabId(parentConversationId);
  let selectionAvailable: boolean | Promise<boolean> = true;
  if (selectedConversationId != null && !deferHydrationUntilActivation) {
    selectionAvailable = verifyDescendant(scope, {
      hostId,
      hydrateMissingAncestors: openOverviewWhenSelectionUnavailable,
      parentConversationId,
      selectedConversationId,
    });
    if (selectionAvailable === false) {
      return openOverviewWhenSelectionUnavailable
        ? openLocalConversationSubagentsPanel(scope, {
          revealAndFocus, hostId, insertPosition, parentConversationId, tabId: id,
        })
        : null;
    }
  }
  const parentNeedsHydration = selectedConversationId != null
    && scope.get<boolean>(conversationHydratedFamily, parentConversationId) === false;
  const isLoading = deferHydrationUntilActivation
    || typeof selectionAvailable !== "boolean"
    || parentNeedsHydration;
  const panelOptions: Record<string, unknown> = {
    durableRoute: { kind: subagentsRouteKind, params: { selectedConversationId }, payloadVersion: 1 },
    id,
    insertPosition,
    onActivate: deferHydrationUntilActivation ? () => {
      const current = scope.get<{ renderPanel?: unknown } | null>(rightPanelState.tabById$, id);
      openLocalConversationSubagentsPanel(scope, {
        revealAndFocus: false, hostId, openOverviewWhenSelectionUnavailable,
        parentConversationId, selectedConversationId, selectedDisplayName, tabId: id,
      }).catch((error: unknown) => {
        logger.warning("Failed to load restored subagent", { safe: {}, sensitive: { error } });
        const next = scope.get<{ renderPanel?: unknown } | null>(rightPanelState.tabById$, id);
        if (next != null && next.renderPanel === current?.renderPanel) {
          void openLocalConversationSubagentsPanel(scope, {
            revealAndFocus: false, hostId, parentConversationId, tabId: id,
          });
        }
      });
    } : undefined,
    title: scope.get<{ formatMessage(input: Record<string, unknown>): string }>(intlSignal).formatMessage({
      id: "localConversation.subagentsPanel.title", defaultMessage: "Subagents",
      description: "Title for the subagents right side panel tab",
    }),
    props: {
      hostId, isLoading, parentConversationId,
      requestedConversationId: selectedConversationId,
      requestedDisplayName: selectedDisplayName,
      onSelect: (conversationId: string, displayName: string) => {
        void openLocalConversationSubagentsPanel(scope, {
          hostId, parentConversationId, selectedConversationId: conversationId,
          selectedDisplayName: displayName, tabId: id,
        });
      },
    },
  };
  const openedId = openSidePanelTab(scope, subagentsPanelDefinition, {
    ...panelOptions, revealAndFocus,
  });
  if (selectedConversationId == null || deferHydrationUntilActivation) return openedId;
  const descendant = await selectionAvailable;
  const opened = scope.get<{ props: Record<string, unknown> } | null>(rightPanelState.tabById$, openedId);
  if (opened == null) return null;
  if (opened.props.requestedConversationId !== selectedConversationId) return openedId;
  if (!descendant) {
    openSidePanelTab(scope, subagentsPanelDefinition, {
      ...panelOptions,
      durableRoute: { kind: subagentsRouteKind, params: { selectedConversationId: null }, payloadVersion: 1 },
      props: { ...(panelOptions.props as Record<string, unknown>), isLoading: false,
        requestedConversationId: null, requestedDisplayName: null },
      revealAndFocus: false,
    });
    return openedId;
  }
  const hydration: Promise<unknown>[] = [];
  const conversationMissing = !scope.get(conversationExistsFamily, selectedConversationId)
    || scope.get(conversationRecordFamily, selectedConversationId) == null;
  const store = scope.get<{ getConversation(id: string): { forkedFromId?: string | null } | undefined } | null>(
    conversationStoreFamily, hostId,
  );
  if (parentNeedsHydration && store?.getConversation(selectedConversationId)?.forkedFromId !== null) {
    hydration.push(getConversationHydrator(scope, hostId).hydrateBackgroundThreads(
      [parentConversationId], { includeTurns: true },
    ));
  }
  const activeTurn = scope.get<{ items: Array<{ text?: string; type: string }>; turnId?: string; turnStartedAtMs?: number } | null>(
    activeTurnFamily, selectedConversationId,
  );
  const hydratedAt = scope.get<number | null>(lastHydratedTurnStartedAtFamily, selectedConversationId);
  const hasVisibleActiveMessage = activeTurn?.items.some((item) =>
    item.type === "agentMessage" && (item.text?.trim().length ?? 0) > 0) === true;
  if (!conversationMissing
    && !scope.get(conversationHydratedFamily, selectedConversationId)
    && !hasVisibleActiveMessage) {
    hydration.push(getConversationHydrator(scope, hostId).hydrateBackgroundThreads(
      [selectedConversationId], { includeTurns: true },
    ));
  }
  void hydratedAt;
  await Promise.all(hydration);
  if (isLoading) {
    const current = scope.get<{ props: Record<string, unknown> } | null>(rightPanelState.tabById$, openedId);
    if (current == null) return null;
    if (current.props.requestedConversationId !== selectedConversationId) return openedId;
    openSidePanelTab(scope, subagentsPanelDefinition, {
      ...panelOptions,
      props: { ...(panelOptions.props as Record<string, unknown>), isLoading: false },
      revealAndFocus: false,
    });
  }
  return openedId;
}

function initializeOpenLocalConversationSubagentsPanel(): void {
  initializeConversationHydration();
  initializeSubagentsPanel();
  initializeSidePanel();
  initializeIntlRuntime();
  initializeSubagentIcon();
  initializeLogger();
  initializeConversationModels();
  initializeVerifyDescendant();
  subagentsPanelDefinition = createSidePanelDefinition({ open: openLocalConversationSubagentsPanel });
}

export {
  openLocalConversationSubagentsPanel as n,
  initializeOpenLocalConversationSubagentsPanel as t,
};
