import "@rchunk/rolldown-runtime";
import {
  Cg as initializeBackgroundTerminalPanel,
  Dg as initializeBackgroundTerminalModel,
  Eg as getBackgroundTerminalTabId,
  Gvt as openSidePanelTab,
  Tg as backgroundTerminalRouteKind,
  Wvt as initializeSidePanel,
  wg as createSidePanelDefinition,
} from "@rchunk/app-initial";

export interface BackgroundTerminal {
  command: string;
  id: string;
}

export interface OpenBackgroundTerminalOptions {
  backgroundTerminal: BackgroundTerminal;
  conversationId: string;
  fallbackTitle: string;
  insertPosition?: unknown;
  revealAndFocus?: boolean;
  scope: unknown;
  tabId?: string;
}

let backgroundTerminalPanelDefinition: unknown;

function openLocalConversationBackgroundTerminalTab({
  scope,
  revealAndFocus = true,
  backgroundTerminal,
  conversationId,
  fallbackTitle,
  insertPosition,
  tabId,
}: OpenBackgroundTerminalOptions): unknown {
  const id = tabId ?? getBackgroundTerminalTabId(conversationId, backgroundTerminal.id);
  return openSidePanelTab(scope, backgroundTerminalPanelDefinition, {
    revealAndFocus,
    durableRoute: {
      kind: backgroundTerminalRouteKind,
      params: { terminalId: backgroundTerminal.id },
      payloadVersion: 1,
    },
    id,
    insertPosition,
    props: { conversationId, terminalId: backgroundTerminal.id },
    title: backgroundTerminal.command.length > 0 ? backgroundTerminal.command : fallbackTitle,
  });
}

function initializeOpenLocalConversationBackgroundTerminalTab(): void {
  initializeSidePanel();
  initializeBackgroundTerminalPanel();
  initializeBackgroundTerminalModel();
  backgroundTerminalPanelDefinition = createSidePanelDefinition({
    open: openLocalConversationBackgroundTerminalTab,
  });
}

export {
  openLocalConversationBackgroundTerminalTab as n,
  initializeOpenLocalConversationBackgroundTerminalTab as t,
};
