// browser sidebar 页内查找状态机：open-find / 查询 / 上一个 / 下一个 / 关闭。
//
// 对应 main-C-Mhak1n.ts 106,548-106,620（oq/sq/cq/lq/uq/zGe/dq/fq/pq）：
//   - oq：空状态
//   - sq：open-find 命令 + 状态广播
//   - cq：查询变更 → findInPage（requestId 守卫）
//   - lq/uq：下一个/上一个（findNext + forward）
//   - zGe：found-in-page 结果回填（finalUpdate 清 requestId）
//   - dq：browser-sidebar-find-state 广播
//   - fq：关闭（stopFindInPage clearSelection + 状态复位）
//   - pq：方向查找
//
// 模块加载期副作用：无。

/** 页内查找状态（原 `oq` 形态）。 */
export interface FindInPageState {
  activeMatchOrdinal: number;
  matches: number;
  query: string;
  requestId: number | null;
}

/** webContents 面（结构化子集）。 */
export interface FindWebContentsLike {
  isDestroyed(): boolean;
  findInPage(text: string, options?: { findNext?: boolean; forward?: boolean }): number;
  stopFindInPage(action: "clearSelection" | "keepSelection" | "activateSelection"): void;
}

/** 持有查找状态的 tab（结构化子集）。 */
export interface FindableTab {
  browserTabId: string;
  findState: FindInPageState;
  page: { view: { webContents: FindWebContentsLike | null } } | null;
}

/** 窗口管理器面（结构化子集）。 */
export interface FindWindowManagerLike {
  sendMessageToWebContents(webContents: { isDestroyed(): boolean }, message: unknown): void;
}

/** 空状态（原 `oq`）。 */
export function emptyFindState(): FindInPageState {
  return { activeMatchOrdinal: 0, matches: 0, query: "", requestId: null };
}

/** 状态广播（原 `dq`）。 */
export function broadcastFindState(windowManager: FindWindowManagerLike, owner: { isDestroyed(): boolean }, conversationId: string, tab: FindableTab): void {
  if (owner.isDestroyed()) return;
  windowManager.sendMessageToWebContents(owner, {
    type: "browser-sidebar-find-state",
    conversationId,
    browserTabId: tab.browserTabId,
    state: {
      activeMatchOrdinal: tab.findState.activeMatchOrdinal,
      matches: tab.findState.matches,
      query: tab.findState.query,
    },
  });
}

/** open-find 命令（原 `sq`）：广播命令 + 状态。 */
export function openFindInPage(windowManager: FindWindowManagerLike, owner: { isDestroyed(): boolean }, conversationId: string, tab: FindableTab): void {
  windowManager.sendMessageToWebContents(owner, {
    type: "browser-sidebar-command",
    conversationId,
    browserTabId: tab.browserTabId,
    command: { type: "open-find" },
  });
  broadcastFindState(windowManager, owner, conversationId, tab);
}

/** 查询变更（原 `cq`）：空查询关闭；同查询跳过；否则重置并 findInPage。 */
export function updateFindQuery(windowManager: FindWindowManagerLike, owner: { isDestroyed(): boolean }, conversationId: string, tab: FindableTab, query: string): void {
  if (query.length === 0) {
    closeFindInPage(windowManager, owner, conversationId, tab);
    return;
  }
  if (tab.findState.query === query) return;
  tab.findState = { ...tab.findState, activeMatchOrdinal: 0, matches: 0, query, requestId: null };
  broadcastFindState(windowManager, owner, conversationId, tab);
  const webContents = tab.page?.view.webContents;
  if (webContents != null && !webContents.isDestroyed()) {
    tab.findState.requestId = webContents.findInPage(query);
  }
}

/** 下一个（原 `lq`）。 */
export function findNext(tab: FindableTab): void {
  findDirectional(tab, true);
}

/** 上一个（原 `uq`）。 */
export function findPrevious(tab: FindableTab): void {
  findDirectional(tab, false);
}

function findDirectional(tab: FindableTab, forward: boolean): void {
  if (tab.findState.query.length === 0) return;
  const webContents = tab.page?.view.webContents;
  if (webContents == null || webContents.isDestroyed()) return;
  tab.findState.requestId = webContents.findInPage(tab.findState.query, { findNext: false, forward });
}

/** found-in-page 结果回填（原 `zGe`）：requestId 匹配才受理。 */
export function applyFindResult(windowManager: FindWindowManagerLike, owner: { isDestroyed(): boolean }, conversationId: string, tab: FindableTab, result: { activeMatchOrdinal: number; finalUpdate: boolean; matches: number; requestId: number }): void {
  if (result.requestId !== tab.findState.requestId) return;
  tab.findState = {
    ...tab.findState,
    activeMatchOrdinal: result.activeMatchOrdinal,
    matches: result.matches,
    requestId: result.finalUpdate ? null : result.requestId,
  };
  broadcastFindState(windowManager, owner, conversationId, tab);
}

/** 关闭查找（原 `fq`）：已复位跳过；否则 clearSelection + 复位 + 广播。 */
export function closeFindInPage(windowManager: FindWindowManagerLike, owner: { isDestroyed(): boolean }, conversationId: string, tab: FindableTab): void {
  if (
    tab.findState.query.length === 0 &&
    tab.findState.matches === 0 &&
    tab.findState.activeMatchOrdinal === 0 &&
    tab.findState.requestId == null
  ) {
    return;
  }
  const webContents = tab.page?.view.webContents;
  if (webContents != null && !webContents.isDestroyed()) webContents.stopFindInPage("clearSelection");
  tab.findState = emptyFindState();
  broadcastFindState(windowManager, owner, conversationId, tab);
}
