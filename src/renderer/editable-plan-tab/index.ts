import "@rchunk/rolldown-runtime";
import {
  C_ as initializeIconAssets,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  Nu as initializePlanIcon,
  Pu as planIconAsset,
  QI as initializeQueryRuntime,
  S_ as IconAsset,
  ZI as appScope,
  oZ as createSignalFamily,
  pZ as createSignal,
  rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  $en as conversationScope,
  Qen as initializeSourcesPanelModel,
  Zen as sidePanelKinds,
  _vt as initializeRightPanelState,
  gvt as getTabTarget,
  hvt as getPanelController,
  itn as initializeConversationScope,
} from "@rchunk/app-initial";

interface EditablePlanState {
  content: string;
  path: string;
  save: unknown;
}

interface EditablePlanScope {
  set<Value>(signal: unknown, parameter: unknown, value?: Value | ((current: Value | null) => Value | null)): void;
}

interface OpenEditablePlanInput extends Record<string, unknown> {
  content: string;
  conversationId: string;
  hostId: string;
  insertPosition?: unknown;
  key: string;
  path: string;
  revealAndFocus?: boolean;
  syncOpenTabs?: boolean;
  target?: string;
  title: string;
}

type OpenTextFileTab = (
  scope: EditablePlanScope,
  path: string,
  options: Record<string, unknown>,
) => boolean;

let jsx: ReturnType<typeof getJsxRuntime>;
let activeEditablePlanTab: unknown;
let editablePlanState: unknown;
let editablePlanContent: unknown;

function initializeEditablePlanState(): void {
  initializeSignalRuntime();
  initializeQueryRuntime();
  initializeConversationScope();
  activeEditablePlanTab = createSignal(conversationScope, null);
  editablePlanState = createSignalFamily(appScope, () => null);
  editablePlanContent = createDerivedFamily(
    appScope,
    (key: string, { get }) =>
      (get(editablePlanState, key) as EditablePlanState | null)?.content ?? null,
  );
}

function openEditablePlanTab(
  scope: EditablePlanScope,
  {
    revealAndFocus,
    content,
    conversationId,
    hostId,
    insertPosition,
    key,
    path,
    syncOpenTabs,
    target,
    title,
  }: OpenEditablePlanInput,
  openTextFileTab: OpenTextFileTab,
): boolean {
  const stateKey = `${hostId}:${conversationId}:${key}`;
  scope.set(editablePlanState, stateKey, { content, path, save: null });
  const opened = openTextFileTab(scope, path, {
    revealAndFocus,
    hostId,
    insertPosition,
    onContentChange: (nextContent: string) => {
      scope.set<EditablePlanState>(editablePlanState, stateKey, (current) =>
        current?.path === path ? { ...current, content: nextContent } : current);
    },
    onSaveChange: (save: unknown) => {
      scope.set<EditablePlanState>(editablePlanState, stateKey, (current) =>
        current?.path === path ? { ...current, save } : current);
    },
    plan: { conversationId, key, title },
    syncOpenTabs,
    tabId: sidePanelKinds.PLAN,
    target,
  });
  if (!opened) return false;
  const panelController = getPanelController(
    getTabTarget(scope, sidePanelKinds.PLAN) ?? "right",
  ) as {
    updateTab(
      scope: EditablePlanScope,
      tabId: string,
      options: Record<string, unknown>,
    ): void;
  };
  panelController.updateTab(
    scope,
    sidePanelKinds.PLAN,
    {
      icon: jsx.jsx(IconAsset, { className: "shrink-0", asset: planIconAsset }),
      title,
    },
  );
  scope.set(activeEditablePlanTab, { key, tabId: sidePanelKinds.PLAN });
  return true;
}

function initializeEditablePlanTab(): void {
  initializePlanIcon();
  initializeIconAssets();
  initializeRightPanelState();
  initializeSourcesPanelModel();
  initializeEditablePlanState();
  jsx = getJsxRuntime();
}

export {
  editablePlanContent as a,
  editablePlanState as i,
  openEditablePlanTab as n,
  initializeEditablePlanState as o,
  activeEditablePlanTab as r,
  initializeEditablePlanTab as t,
};
