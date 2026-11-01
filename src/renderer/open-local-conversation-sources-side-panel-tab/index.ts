import "@rchunk/rolldown-runtime";
import {
  H3 as initializeLazyComponents,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  V3 as preloadDynamicImport,
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

let jsx: ReturnType<typeof getJsxRuntime>;
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
  jsx = getJsxRuntime();
  initializeLazyComponents();
  SourcesPanel = createLazyComponent(
    async () => {
      const { LocalConversationSourcesSidePanelTab } = await preloadDynamicImport(
        async () => {
          const { LocalConversationSourcesSidePanelTab } = await import("@rchunk/local-conversation-sources-side-panel-tab-core");
          return { LocalConversationSourcesSidePanelTab };
        },
        [],
        import.meta.url,
      );
      return LocalConversationSourcesSidePanelTab;
    },
    { propagateLoadError: true },
  );
  SourcesThumbnail = createLazyComponent(
    async () => {
      const { RegisteredLocalSourcesThumbnail } = await preloadDynamicImport(
        async () => {
          const { RegisteredLocalSourcesThumbnail } = await import("@rchunk/registered-sources");
          return { RegisteredLocalSourcesThumbnail };
        },
        [],
        import.meta.url,
      );
      return RegisteredLocalSourcesThumbnail;
    },
    { propagateLoadError: true },
  );
}

function openLocalConversationSourcesSidePanelTab(
  scope: unknown,
  props: unknown,
  title: string,
  openerTabId?: string,
): void {
  openSourcesSidePanelTab(
    scope,
    sourcesPanelDefinition,
    props,
    title,
    openerTabId,
  );
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
