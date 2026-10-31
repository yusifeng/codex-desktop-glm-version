// IAB 本地标签候选 store：按当前窗口族搜索、排序并广播 snapshot 失效。

import { BrowserWindow } from "electron";
import {
  qc as matchesTabQuery,
  Jc as normalizeFaviconUrl,
  Uc as tabCandidateSchema,
  Vc as browserPluginDescriptor,
  lu as browserTabTypes,
} from "@chunk/shared";

interface ThreadState {
  browserTabId: string;
  conversationId: string;
  lastTabActivityTime: number;
  pendingTeardown?: { reason?: string } | null;
  snapshot: { faviconUrl?: string | null; tabType?: unknown; title: string; url: string };
}

interface WindowState {
  tabSourceWindow?: WindowState | null;
  threads: Map<unknown, ThreadState>;
}

/** 原 `qGe`：IAB 标签候选搜索与失效通知的唯一状态 owner。 */
export class IabTabCandidateStore {
  private invalidationListeners = new Set<() => void>();

  constructor(private windows: Map<number, WindowState>) {}

  subscribeInvalidations(listener: () => void): () => void {
    this.invalidationListeners.add(listener);
    return () => this.invalidationListeners.delete(listener);
  }

  search(origin: Electron.WebContents, conversationId: string | null, query: string, limit = 100): { candidates: unknown[] } {
    if (conversationId == null) return { candidates: [] };
    const currentWindow = this.getCurrentWindowState(origin);
    if (currentWindow == null) return { candidates: [] };
    return {
      candidates: Array.from(this.windows.values())
        .filter((windowState) => windowState === currentWindow || windowState.tabSourceWindow === currentWindow)
        .flatMap((windowState) => Array.from(windowState.threads.values()))
        .filter((thread) => thread.conversationId === conversationId && isSearchableThread(thread) && matchesTabQuery(thread.snapshot, query))
        .sort(compareThreadRecency)
        .slice(0, Math.min(limit, 100))
        .map(toCandidate)
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate != null),
    };
  }

  notifyInvalidated(): void {
    for (const listener of this.invalidationListeners) listener();
  }

  trackSnapshotUpdate(thread: ThreadState, update: () => void): void {
    const { faviconUrl, title, url } = thread.snapshot;
    update();
    if (faviconUrl !== thread.snapshot.faviconUrl || title !== thread.snapshot.title || url !== thread.snapshot.url) {
      this.notifyInvalidated();
    }
  }

  private getCurrentWindowState(origin: Electron.WebContents): WindowState | null {
    const window = BrowserWindow.fromWebContents(origin);
    return window == null || window.isDestroyed() ? null : (this.windows.get(window.id) ?? null);
  }
}

function compareThreadRecency(left: ThreadState, right: ThreadState): number {
  const recency = right.lastTabActivityTime - left.lastTabActivityTime;
  return recency === 0
    ? left.browserTabId === right.browserTabId
      ? 0
      : left.browserTabId < right.browserTabId
        ? -1
        : 1
    : recency;
}

function isSearchableThread(thread: ThreadState): boolean {
  return thread.pendingTeardown?.reason !== "closed" &&
    (thread.snapshot.tabType !== (browserTabTypes as { NEW_TAB_PAGE: unknown }).NEW_TAB_PAGE || thread.snapshot.url.length !== 0);
}

function toCandidate(thread: ThreadState): Record<string, unknown> | null {
  const parsed = (tabCandidateSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> } }).safeParse({
    browserId: thread.conversationId,
    pluginId: (browserPluginDescriptor as { browser: unknown }).browser,
    source: "iab",
    tabId: thread.browserTabId,
    snapshot: { title: thread.snapshot.title, url: thread.snapshot.url },
  });
  return parsed.success
    ? { ...parsed.data!, faviconUrl: normalizeFaviconUrl(thread.snapshot.faviconUrl), recency: thread.lastTabActivityTime }
    : null;
}
