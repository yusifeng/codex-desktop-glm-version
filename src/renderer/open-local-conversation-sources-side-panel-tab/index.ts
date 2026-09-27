import "@rchunk/rolldown-runtime";
import {
  H3 as initializeLazyComponents,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  qm as initializePanelComponents,
} from "@rchunk/app-shared";
import {
  FDt as initializeSidePanelDefinitions,
  IDt as registerSidePanelTabType,
  Qen as initializeSourcesPanelModel,
  Zen as sidePanelKinds,
} from "@rchunk/app-initial";
import {
  n as openSourcesSidePanelTab,
  t as initializeOpenSourcesSidePanelTab,
} from "@rchunk/open-sources-side-panel-tab";

const jsx = getJsxRuntime();
let SourcesPanel: (props: Record<string, unknown>) => unknown;
let SourcesThumbnail: (props: Record<string, unknown>) => unknown;
let sourcesPanelDefinition: unknown;

function createSourcesPanelDefinition({
  open,
}: {
  open: (...arguments_: unknown[]) => unknown;
}): unknown {
  return registerSidePanelTabType(sidePanelKinds.SOURCES, SourcesPanel, {
    dropDestinations: ["left", "right", "bottom"],
    getId: () => sidePanelKinds.SOURCES,
    isAvailable: (scope: { value: { routeKind?: string } }) =>
      scope.value.routeKind === "local-thread",
    open,
    renderThumbnail: (
      scope: { conversationId: string; hostId: string },
      tab: { title: string },
    ) => jsx.jsx(SourcesThumbnail, {
      conversationId: scope.conversationId,
      hostId: scope.hostId,
      title: tab.title,
    }),
  });
}

function initializeSourcesPanelComponents(): void {
  initializeSidePanelDefinitions();
  initializePanelComponents();
  initializeSourcesPanelModel();
  initializeLazyComponents();
  SourcesPanel = createLazyComponent(
    async () => (await import("@rchunk/local-conversation-sources-side-panel-tab-core"))
      .LocalConversationSourcesSidePanelTab,
    { propagateLoadError: true },
  );
  SourcesThumbnail = createLazyComponent(
    async () => (await import("@rchunk/registered-sources"))
      .RegisteredLocalSourcesThumbnail,
    { propagateLoadError: true },
  );
}

function openLocalConversationSourcesSidePanelTab(
  scope: unknown,
  conversationId: string,
  hostId: string,
  options?: Record<string, unknown>,
): void {
  openSourcesSidePanelTab(scope, sourcesPanelDefinition, conversationId, hostId, options);
}

function initializeOpenLocalConversationSourcesSidePanelTab(): void {
  initializeSourcesPanelComponents();
  initializeOpenSourcesSidePanelTab();
  sourcesPanelDefinition = createSourcesPanelDefinition({
    open: openLocalConversationSourcesSidePanelTab,
  });
}

export {
  openLocalConversationSourcesSidePanelTab as n,
  initializeOpenLocalConversationSourcesSidePanelTab as t,
};
