import {
  Qen as initializeSidePanelRegistry,
  jct as initializeThreadSidePanelState,
} from "@rchunk/app-initial";

export interface SidePanelTabOptions extends Record<string, unknown> {}

function hasThreadSidePanelTab(
  _scope: unknown,
  _tabType: unknown,
  _options: SidePanelTabOptions = {},
): boolean {
  return false;
}

function openThreadSidePanelTab(
  _scope: unknown,
  _tabType: unknown,
  _reveal = true,
  _options: SidePanelTabOptions = {},
): boolean {
  return false;
}

function initializeThreadSidePanelTabs(): void {
  initializeSidePanelRegistry();
  initializeThreadSidePanelState();
}

export {
  openThreadSidePanelTab as n,
  hasThreadSidePanelTab as r,
  initializeThreadSidePanelTabs as t,
};
