import * as appInitialChunk from "@rchunk/app-initial";
import * as threadSidePanelTabsChunk from "@rchunk/thread-side-panel-tabs";

const appRuntime = appInitialChunk as unknown as {
  Act(threadId: string, appId: string): string;
  Mct(...arguments_: unknown[]): unknown;
  Zen: unknown;
  kct(...arguments_: unknown[]): unknown;
};
const panelRuntime = threadSidePanelTabsChunk as unknown as {
  n(...arguments_: unknown[]): unknown;
  r(...arguments_: unknown[]): unknown;
  t(): void;
};

const {
  Act: getThreadMcpAppSidePanelTabId,
  Mct: openThreadMcpAppSidePanelTab,
  Zen: THREAD_SIDE_PANEL_TAB,
  kct: closeThreadMcpAppSidePanelTab,
} = appRuntime;
const {
  n: openSessionSandboxSidePanel,
  r: openThreadTimelineSidePanel,
  t: initializeThreadSidePanelTabs,
} = panelRuntime;

initializeThreadSidePanelTabs();

export {
  THREAD_SIDE_PANEL_TAB,
  closeThreadMcpAppSidePanelTab,
  getThreadMcpAppSidePanelTabId,
  openSessionSandboxSidePanel,
  openThreadMcpAppSidePanelTab,
  openThreadTimelineSidePanel,
};
