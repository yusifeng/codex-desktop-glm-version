import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  sZ as createDerivedSignal,
} from "@rchunk/app-shared";
import {
  $en as conversationScope,
  Wvt as initializeSidePanelRuntime,
  avt as workspaceView,
  itn as initializeConversationScope,
  mpn as internationalization,
  ppn as initializeWorkspaceView,
  qvt as workspaceTabs,
  rvt as initializeWorkspaceTabs,
} from "@rchunk/app-initial";

interface MessageFormatter {
  formatMessage(descriptor: {
    defaultMessage: string;
    description: string;
    id: string;
  }): string;
}

interface SignalReader {
  get(signal: unknown): unknown;
}

let chatViewControlLabel: unknown;
let fullViewControlLabel: unknown;

function initializeViewControlLabels(): void {
  initializeSignalRuntime();
  initializeSidePanelRuntime();
  initializeWorkspaceView();
  initializeConversationScope();
  initializeWorkspaceTabs();
  const derive = createDerivedSignal as unknown as (
    scope: unknown,
    compute: (reader: SignalReader) => string,
  ) => unknown;

  chatViewControlLabel = derive(conversationScope, ({ get }) => {
    const intl = get(internationalization) as MessageFormatter;
    if (get(workspaceView) === "chat") {
      const tabs = get(
        (workspaceTabs as { tabIds$: unknown }).tabIds$,
      ) as unknown[];
      return tabs.length === 0
        ? intl.formatMessage({
            id: "threadWorkspace.layout.newTab",
            defaultMessage: "New tab",
            description:
              "Creates a content tab in the selected layout when there are no tabs",
          })
        : intl.formatMessage({
            id: "threadWorkspace.layout.showTabs",
            defaultMessage: "Show tabs",
            description:
              "Restores the content tabs in the selected full or split layout",
          });
    }
    return intl.formatMessage({
      id: "threadWorkspace.layout.hideTabs",
      defaultMessage: "Hide tabs",
      description: "Hides the content tabs and leaves Chat visible",
    });
  });

  fullViewControlLabel = derive(conversationScope, ({ get }) => {
    const intl = get(internationalization) as MessageFormatter;
    if (get(workspaceView) === "full") {
      return intl.formatMessage({
        id: "threadWorkspace.layout.exitFullView",
        defaultMessage: "Exit full view",
        description:
          "Restores the content tabs beside Chat in split view",
      });
    }
    const tabs = get(
      (workspaceTabs as { tabIds$: unknown }).tabIds$,
    ) as unknown[];
    return tabs.length === 0
      ? intl.formatMessage({
          id: "threadWorkspace.layout.newTabInFullView",
          defaultMessage: "New tab in full view",
          description: "Creates a content tab that fills the workspace",
        })
      : intl.formatMessage({
          id: "threadWorkspace.layout.enterFullView",
          defaultMessage: "Enter full view",
          description:
            "Expands the active content tab to fill the workspace",
        });
  });
}

export {
  fullViewControlLabel as n,
  chatViewControlLabel as r,
  initializeViewControlLabels as t,
};
