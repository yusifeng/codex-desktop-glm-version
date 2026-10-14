type AnyRecord = Record<string, any>;

type TimerHandle = ReturnType<typeof setTimeout>;

export type BrowserTabWorkingSetManagerOptions = {
  browserSessionRegistry: AnyRecord;
  hasActiveDownload(threadState: AnyRecord): boolean;
  now?(): number;
  onTabActivity(): void;
  suspendDetachedThread(windowState: AnyRecord, threadState: AnyRecord): void;
  windows: Map<number, AnyRecord>;
};

const MAX_LIVE_DETACHED_TABS = 32;
const WORKING_SET_PROTECTION_MS = 30 * 60 * 1_000;

/** Owns tab activity ranks, working-set protection, expiry timers, and suspension selection. */
export class BrowserTabWorkingSetManager {
  private readonly options: BrowserTabWorkingSetManagerOptions;
  private tabActivitySequence = 0;
  private lastTabActivityTime = 0;
  private readonly activeConversationByWindow = new Map<number, string>();
  private readonly selectedTabsByWindow = new Map<
    number,
    Map<string, { browserTabId: string; selectedAt: number }>
  >();
  private readonly workingSetExpiryTimersByWindow = new Map<number, TimerHandle>();

  constructor(options: BrowserTabWorkingSetManagerOptions) {
    this.options = options;
  }

  markTabActivity(threadState: AnyRecord): void {
    this.updateTabActivity(threadState);
    this.options.onTabActivity();
  }

  markTabSelected(windowState: AnyRecord, threadState: AnyRecord): void {
    this.updateTabActivity(threadState);
    const windowId = windowState.window.id;
    const now = this.now();
    let selectedTabs = this.selectedTabsByWindow.get(windowId);
    if (selectedTabs == null) {
      selectedTabs = new Map();
      this.selectedTabsByWindow.set(windowId, selectedTabs);
    }
    const activeConversationId = this.activeConversationByWindow.get(windowId);
    const previousSelection =
      activeConversationId == null ? null : selectedTabs.get(activeConversationId);
    if (previousSelection != null) previousSelection.selectedAt = now;
    selectedTabs.set(threadState.conversationId, {
      browserTabId: threadState.browserTabId,
      selectedAt: now,
    });
    this.activeConversationByWindow.set(windowId, threadState.conversationId);
    this.options.onTabActivity();
  }

  isTabProtectedFromSuspension(windowState: AnyRecord, threadState: AnyRecord): boolean {
    return this.getProtection(windowState, threadState, this.now()).protected;
  }

  enforceDetachedPageBudgets(): void {
    for (const windowState of this.options.windows.values()) {
      this.enforceDetachedPageBudget(windowState);
    }
  }

  enforceDetachedPageBudget(windowState: AnyRecord): void {
    const windowId = windowState.window.id;
    this.clearWorkingSetExpiryTimer(windowId);
    const liveDetachedThreads = getLiveDetachedThreads(windowState);
    if (
      liveDetachedThreads.length <= MAX_LIVE_DETACHED_TABS ||
      Array.from(windowState.threads.values()).some(
        (threadState: AnyRecord) =>
          threadState.page?.isRestoring === true ||
          threadState.pendingTeardown?.reason === "suspended",
      )
    ) {
      return;
    }
    const now = this.now();
    const candidate = liveDetachedThreads
      .filter(
        (threadState) =>
          threadState.pendingTeardown == null &&
          !this.getProtection(windowState, threadState, now).protected,
      )
      .sort(
        (left, right) =>
          candidateRankWeight(this.getCandidateRank(windowState, left)) -
            candidateRankWeight(this.getCandidateRank(windowState, right)) ||
          left.lastTabActivitySequence - right.lastTabActivitySequence ||
          left.browserTabId.localeCompare(right.browserTabId),
      )[0];
    if (candidate == null) {
      this.scheduleWorkingSetExpiry(windowState, liveDetachedThreads, now);
      return;
    }
    const candidateRank = this.getCandidateRank(windowState, candidate);
    const protectionCounts = this.getProtectionCounts(windowState, liveDetachedThreads, now);
    this.recordTabBudgetEvent(
      windowState,
      candidate,
      "browser-tab-budget-suspension-selected",
      "Selected Browser tab for budget suspension",
      {
        budget: MAX_LIVE_DETACHED_TABS,
        candidateRank,
        activeTabProtectedCount: protectionCounts.activeTab,
        liveDetachedRendererCount: liveDetachedThreads.length,
        pressureReason: "count",
        workingSetSelectedProtectedCount: protectionCounts.workingSetSelected,
      },
    );
    this.options.suspendDetachedThread(windowState, candidate);
  }

  recordTabSuspended(windowState: AnyRecord, threadState: AnyRecord): void {
    this.recordTabBudgetEvent(
      windowState,
      threadState,
      "browser-tab-budget-tab-suspended",
      "Suspended Browser tab selected by the tab budget",
      { pressureReason: "count" },
    );
  }

  handleWindowClosed(windowId: number): void {
    this.clearWorkingSetExpiryTimer(windowId);
    this.activeConversationByWindow.delete(windowId);
    this.selectedTabsByWindow.delete(windowId);
  }

  private getCandidateRank(
    windowState: AnyRecord,
    threadState: AnyRecord,
  ): "current-thread-secondary" | "inactive-selected" | "inactive-secondary" {
    return windowState.activeBrowserTabId != null &&
      windowState.activeConversationId === threadState.conversationId
      ? "current-thread-secondary"
      : this.getSelectedTab(windowState, threadState)?.browserTabId === threadState.browserTabId
        ? "inactive-selected"
        : "inactive-secondary";
  }

  private getProtection(windowState: AnyRecord, threadState: AnyRecord, now: number): AnyRecord {
    const activeTab =
      windowState.activeConversationId === threadState.conversationId &&
      windowState.activeBrowserTabId === threadState.browserTabId;
    const selectedTab = this.getSelectedTab(windowState, threadState);
    const workingSetSelected =
      !activeTab &&
      selectedTab?.browserTabId === threadState.browserTabId &&
      now - selectedTab.selectedAt < WORKING_SET_PROTECTION_MS;
    return {
      activeTab,
      workingSetSelected,
      protected:
        activeTab ||
        workingSetSelected ||
        threadState.presented ||
        threadState.isBrowserUseActive ||
        threadState.isTabCaptureActive === true ||
        threadState.page?.isAudible === true ||
        threadState.page?.isCapturingUserMedia === true ||
        threadState.page?.isLoading === true ||
        threadState.page?.isRestoring === true ||
        this.options.hasActiveDownload(threadState),
    };
  }

  private getSelectedTab(
    windowState: AnyRecord,
    threadState: AnyRecord,
  ): { browserTabId: string; selectedAt: number } | undefined {
    return this.selectedTabsByWindow
      .get(windowState.window.id)
      ?.get(threadState.conversationId);
  }

  private getProtectionCounts(
    windowState: AnyRecord,
    threadStates: AnyRecord[],
    now: number,
  ): { activeTab: number; workingSetSelected: number } {
    const counts = { activeTab: 0, workingSetSelected: 0 };
    for (const threadState of threadStates) {
      const protection = this.getProtection(windowState, threadState, now);
      counts.activeTab += +!!protection.activeTab;
      counts.workingSetSelected += +!!protection.workingSetSelected;
    }
    return counts;
  }

  private scheduleWorkingSetExpiry(
    windowState: AnyRecord,
    threadStates: AnyRecord[],
    now: number,
  ): void {
    let earliestExpiry = Number.POSITIVE_INFINITY;
    for (const threadState of threadStates) {
      if (!this.getProtection(windowState, threadState, now).workingSetSelected) continue;
      const selectedTab = this.getSelectedTab(windowState, threadState);
      if (selectedTab != null) {
        earliestExpiry = Math.min(
          earliestExpiry,
          selectedTab.selectedAt + WORKING_SET_PROTECTION_MS,
        );
      }
    }
    if (!Number.isFinite(earliestExpiry)) return;
    const windowId = windowState.window.id;
    const timer = setTimeout(() => {
      this.workingSetExpiryTimersByWindow.delete(windowId);
      const currentWindowState = this.options.windows.get(windowId);
      if (currentWindowState != null) this.enforceDetachedPageBudget(currentWindowState);
    }, earliestExpiry - now);
    timer.unref();
    this.workingSetExpiryTimersByWindow.set(windowId, timer);
  }

  private clearWorkingSetExpiryTimer(windowId: number): void {
    const timer = this.workingSetExpiryTimersByWindow.get(windowId);
    if (timer != null) {
      clearTimeout(timer);
      this.workingSetExpiryTimersByWindow.delete(windowId);
    }
  }

  private recordTabBudgetEvent(
    windowState: AnyRecord,
    threadState: AnyRecord,
    kind: string,
    message: string,
    details: AnyRecord,
  ): void {
    this.options.browserSessionRegistry.recordDebugEvent({
      browserTabId: threadState.browserTabId,
      conversationId: threadState.conversationId,
      details: Object.entries(details).map(([label, value]) => ({
        label,
        value: String(value),
      })),
      guestWebContentsId: threadState.page?.view.webContents?.id ?? null,
      kind,
      message,
      ownerWebContentsId: windowState.owner.id,
      pageKey: null,
      windowId: windowState.window.id,
    });
  }

  private updateTabActivity(threadState: AnyRecord): void {
    this.tabActivitySequence += 1;
    this.lastTabActivityTime = Math.max(this.now(), this.lastTabActivityTime + 1);
    threadState.lastTabActivitySequence = this.tabActivitySequence;
    threadState.lastTabActivityTime = this.lastTabActivityTime;
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }
}

function candidateRankWeight(
  rank: "current-thread-secondary" | "inactive-selected" | "inactive-secondary",
): number {
  switch (rank) {
    case "inactive-secondary":
      return 0;
    case "inactive-selected":
      return 1;
    case "current-thread-secondary":
      return 2;
  }
}

function getLiveDetachedThreads(windowState: AnyRecord): AnyRecord[] {
  return Array.from(windowState.threads.values()).filter(
    (threadState: AnyRecord) =>
      threadState.sessionState === "live-detached" &&
      threadState.page?.view.webContents != null &&
      !threadState.page.view.webContents.isDestroyed(),
  );
}

if (typeof module !== "undefined") {
  module.exports = { BrowserTabWorkingSetManager };
}
