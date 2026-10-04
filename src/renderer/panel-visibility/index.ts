import "@rchunk/rolldown-runtime";
// @ts-expect-error The release app-initial surface is declared incrementally by the shared manifest owner.
import {
  Bgt as activateBrowserTab,
  Ebt as initializePanelState,
  Fgt as initializePanelRouting,
  Ibt as panelLayout,
  Jen as getBrowserTabId,
  Ken as getActiveConversationId,
  Vvt as bottomPanelTabs,
  Wvt as initializeSidePanel,
  Xen as isBrowserTab,
  Yen as initializePanelTabs,
  _bt as rightPanelOpen,
  _gt as initializePanelActions,
  _vt as initializePanelSelection,
  dgt as getBrowserTabTarget,
  fvt as showPanelTab,
  ggt as browserUseState,
  mbt as bottomPanelOpen,
  mgt as initializeBrowserPanelTabs,
  nlt as initializePanelLayout,
  pvt as closePanel,
  qbt as initializeRightPanel,
  qvt as rightPanelTabs,
  rlt as ensureBrowserPanelTab,
  tlt as resolveBrowserTabId,
  ugt as getLastFocusedBrowserTabId,
  vbt as rightPanelEnabled,
  ygt as clearBrowserTabTransfer,
} from "@rchunk/app-initial";
// @ts-expect-error The release app-primary surface is declared incrementally by the shared manifest owner.
import { Af as initializePanelHelpers } from "@rchunk/app-primary";
import {
  getFallbackPanelTarget,
  getPreferredPanelTarget,
} from "../app-primary/runtime/panel-target-policy";

interface Scope {
  get(signal: unknown): unknown;
}

interface PanelTab {
  tabId?: string | null;
  type?: string;
}

interface BrowserTabTarget {
  browserTabId?: string | null;
  tab: PanelTab;
  target?: "bottom" | "right" | null;
}

export interface SetPanelVisibilityOptions {
  browserTabId?: string | null;
  initiator?: unknown;
  open?: boolean | null;
  source?: unknown;
}

function findMostRecentBrowserTabId(
  tabs: readonly PanelTab[],
  requestedTabId?: string | null,
): string | null {
  if (requestedTabId != null) {
    return tabs.some((tab) => tab.tabId === requestedTabId)
      ? requestedTabId
      : null;
  }
  for (let index = tabs.length - 1; index >= 0; index -= 1) {
    const tab = tabs[index];
    if (tab != null && isBrowserTab(tab)) return tab.tabId ?? null;
  }
  return null;
}

function setPanelVisibility(
  scope: Scope,
  { browserTabId, initiator, open, source }: SetPanelVisibilityOptions,
): void {
  const bottomTabsState = bottomPanelTabs as unknown as { activeTab$: unknown };
  const rightTabsState = rightPanelTabs as unknown as {
    activeTab$: unknown;
    tabs$: unknown;
  };
  const conversationId = getActiveConversationId(scope);
  const resolvedBrowserTabId =
    conversationId != null && browserTabId != null
      ? resolveBrowserTabId(browserTabId)
      : undefined;
  const browserTarget: BrowserTabTarget | null =
    conversationId != null && resolvedBrowserTabId != null
      ? getBrowserTabTarget(scope, resolvedBrowserTabId)
      : null;
  const bottomActiveTab = scope.get(
    bottomTabsState.activeTab$,
  ) as PanelTab | null;
  const rightActiveTab = scope.get(
    rightTabsState.activeTab$,
  ) as PanelTab | null;
  const preferredTarget =
    conversationId != null && resolvedBrowserTabId == null
      ? getPreferredPanelTarget(
          scope.get(panelLayout),
          { bottom: bottomActiveTab, right: rightActiveTab },
          {
            bottom: Boolean(scope.get(bottomPanelOpen)),
            right:
              Boolean(scope.get(rightPanelOpen)) &&
              Boolean(scope.get(rightPanelEnabled)),
          },
          isBrowserTab,
        )
      : null;
  const target =
    browserTarget?.target ??
    preferredTarget ??
    (conversationId != null && resolvedBrowserTabId == null
      ? getFallbackPanelTarget(
          scope.get(panelLayout),
          {
            bottom: bottomActiveTab,
            right: rightActiveTab,
          },
          isBrowserTab,
        )
      : null);
  const currentlyOpen =
    target === "bottom"
      ? Boolean(scope.get(bottomPanelOpen)) && isBrowserTab(bottomActiveTab)
      : Boolean(scope.get(rightPanelOpen)) &&
        Boolean(scope.get(rightPanelEnabled)) &&
        isBrowserTab(rightActiveTab);

  if (open === false || (open == null && currentlyOpen)) {
    closePanel(scope, target ?? "right");
    if (conversationId != null)
      clearBrowserTabTransfer(conversationId, resolvedBrowserTabId);
    return;
  }

  if (target === "bottom") {
    const targetBrowserTabId =
      browserTarget?.browserTabId ?? getBrowserTabId(bottomActiveTab);
    const panelTabId = browserTarget?.tab.tabId ?? bottomActiveTab?.tabId;
    if (targetBrowserTabId == null || panelTabId == null) return;
    if (!currentlyOpen && conversationId != null) {
      activateBrowserTab(conversationId, targetBrowserTabId, {
        initiator,
        source,
      });
    }
    showPanelTab(scope, "bottom", panelTabId);
    return;
  }

  const tabs = scope.get(rightTabsState.tabs$) as PanelTab[];
  const panelTabId = findMostRecentBrowserTabId(tabs, resolvedBrowserTabId);
  const activeBrowserTabId =
    conversationId == null
      ? null
      : browserUseState.getBrowserUseActiveBrowserTabId(conversationId);
  let targetBrowserTabId: string | null = null;
  if (conversationId != null) {
    targetBrowserTabId =
      panelTabId == null
        ? resolveBrowserTabId(
            resolvedBrowserTabId ?? activeBrowserTabId ?? undefined,
          )
        : getBrowserTabId(
            tabs.find((tab) => tab.tabId === panelTabId) ?? {
              tabId: panelTabId,
            },
          );
  }

  if (panelTabId == null) {
    const created = ensureBrowserPanelTab(scope, {
      browserTabId: targetBrowserTabId ?? undefined,
    });
    const browserId =
      conversationId == null
        ? targetBrowserTabId
        : (getLastFocusedBrowserTabId(scope, conversationId) ??
          targetBrowserTabId);
    if (
      created &&
      conversationId != null &&
      browserId != null &&
      !currentlyOpen
    ) {
      activateBrowserTab(conversationId, browserId, { initiator, source });
    }
    return;
  }

  if (conversationId != null && targetBrowserTabId != null && !currentlyOpen) {
    activateBrowserTab(conversationId, targetBrowserTabId, {
      initiator,
      source,
    });
  }
  showPanelTab(scope, "right", panelTabId);
}

let initialized = false;

function initializePanelVisibility(): void {
  if (initialized) return;
  initialized = true;
  initializeRightPanel();
  initializeSidePanel();
  initializePanelState();
  initializePanelActions();
  initializePanelRouting();
  initializePanelSelection();
  initializePanelLayout();
  initializeBrowserPanelTabs();
  initializePanelTabs();
  initializePanelHelpers();
}

export { setPanelVisibility as n, initializePanelVisibility as t };
