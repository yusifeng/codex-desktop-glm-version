import "@rchunk/rolldown-runtime";
import {
  C_ as initializeIconAssets,
  I3 as getJsxRuntime,
  S_ as IconAsset,
  Xi as sourcesIconAsset,
  Yi as initializeSourcesIcon,
} from "@rchunk/app-shared";
import {
  Gvt as openSidePanelTab,
  Qen as initializeSourcesPanelModel,
  Wvt as initializeSidePanelRuntime,
  Zen as sidePanelKinds,
  _vt as initializeRightPanelState,
  gvt as getTabTarget,
} from "@rchunk/app-initial";

let jsx: ReturnType<typeof getJsxRuntime>;

function openSourcesSidePanelTab(
  scope: unknown,
  definition: unknown,
  props: unknown,
  title: string,
  openerTabId?: string,
  trailingContent?: unknown,
): void {
  const target = getTabTarget(scope, sidePanelKinds.SOURCES)
    ?? (openerTabId == null ? null : getTabTarget(scope, openerTabId))
    ?? "right";
  openSidePanelTab(scope, definition, {
    revealAndFocus: true,
    icon: jsx.jsx(IconAsset, {
      className: "shrink-0",
      "aria-hidden": false,
      asset: sourcesIconAsset,
    }),
    id: sidePanelKinds.SOURCES,
    kind: sidePanelKinds.SOURCES,
    openerTabId,
    props,
    target,
    title,
    trailingContent,
  });
}

function initializeOpenSourcesSidePanelTab(): void {
  initializeSourcesIcon();
  initializeSidePanelRuntime();
  initializeIconAssets();
  initializeRightPanelState();
  initializeSourcesPanelModel();
  jsx = getJsxRuntime();
}

export {
  openSourcesSidePanelTab as n,
  initializeOpenSourcesSidePanelTab as t,
};
