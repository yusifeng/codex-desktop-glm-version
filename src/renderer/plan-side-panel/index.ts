import "@rchunk/rolldown-runtime";
import {
  Q3 as logger,
  RI as joinPath,
  WK as joinWorkspacePath,
  Z3 as initializeErrors,
  wL as initializeUtilities,
  zU as isRemoteHost,
} from "@rchunk/app-shared";
import {
  Bst as initializePlanStorage,
  Dyt as activeHostId,
  Gvt as openSidePanelTab,
  HZt as initializeSidePanelRoutes,
  Qen as initializeSidePanelRegistry,
  Sg as planRouteKind,
  Vst as EditablePlanPanel,
  Wvt as initializeSidePanel,
  Zen as sidePanelTabIds,
  _cn as initializeWorkspaceFileState,
  bg as createPlanPanelDefinition,
  byt as initializePlanSidePanelState,
  mcn as codexHomeQuery,
  mnt as initializeConversationModel,
  pnt as appServices,
  xg as savedPlanRouteKind,
  yZt as hostRpcClient,
  yg as initializePlanRoutes,
} from "@rchunk/app-initial";
import {
  n as initializeTextFileStorage,
  r as readTextFile,
} from "@rchunk/text-file-storage";
import {
  i as editablePlanSaveController,
  n as openEditablePlanTab,
  o as initializeEditablePlanStorage,
  r as activeEditablePlan,
  t as initializeEditablePlanTab,
} from "@rchunk/editable-plan-tab";

export interface PlanDescriptor {
  content: string;
  conversationId: string;
  cwd?: string;
  hideCodeBlocks?: boolean;
  key: string;
  planKey?: string;
  title: string;
}

export interface PlanScope {
  get(signal: unknown, parameter?: unknown): unknown;
  set(signal: unknown, value: unknown): void;
  query: {
    getOrFetch(signal: unknown, input: unknown): Promise<unknown>;
  };
}

export interface OpenPlanPanelOptions {
  insertPosition?: unknown;
  revealAndFocus?: boolean;
  tabId?: string;
}

let planPanelDefinition: unknown;

function openPlanSidePanel(scope: PlanScope, plan: PlanDescriptor): void {
  const workspaceWrite = (
    appServices as {
      workspaceFiles?: {
        write?: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
      };
    }
  )?.workspaceFiles?.write;
  if (workspaceWrite != null) {
    const hostId = scope.get(activeHostId) as string;
    if (!isRemoteHost(hostId)) {
      void openEditablePlan(scope, plan, hostId)
        .then((result) => {
          if (result === "unavailable") openReadonlyPlan(scope, plan);
        })
        .catch((error: unknown) => {
          logger.warning("Failed to open editable plan", {
            safe: {},
            sensitive: { error },
          });
          openReadonlyPlan(scope, plan);
        });
      return;
    }
  }
  openReadonlyPlan(scope, plan);
}

async function openEditablePlan(
  scope: PlanScope,
  { content, conversationId, key, title }: PlanDescriptor,
  hostId: string,
): Promise<"opened" | "unavailable" | "unsaved"> {
  const workspaceWrite = (
    appServices as {
      workspaceFiles?: {
        write?: (input: Record<string, unknown>) => Promise<{
          outcome: string;
        }>;
      };
    }
  ).workspaceFiles?.write;
  if (workspaceWrite == null) return "unavailable";

  const activePlan = scope.get(activeEditablePlan) as { key: string } | null;
  if (activePlan != null && activePlan.key !== key) {
    const save = (
      scope.get(editablePlanSaveController, `${hostId}:${conversationId}:${activePlan.key}`) as
        | { save?: () => Promise<boolean> }
        | null
    )?.save;
    if (save != null && !(await save())) return "unsaved";
  }

  const { codexHome } = (await scope.query.getOrFetch(codexHomeQuery, { hostId })) as {
    codexHome: string;
  };
  const directory = joinWorkspacePath(codexHome, "plans", conversationId, key);
  const path = joinWorkspacePath(directory, "PLAN.md");
  await (
    scope.get(hostRpcClient, hostId) as {
      sendRequest(method: string, input: unknown): Promise<unknown>;
    }
  ).sendRequest("fs/createDirectory", { path: directory, recursive: true });
  const writeResult = await workspaceWrite({
    bytes: new TextEncoder().encode(content),
    hostId,
    ifMatch: "missing",
    path,
  });
  if (writeResult.outcome === "too-large") return "unavailable";

  const controllerId = `${hostId}:${conversationId}:${key}`;
  let resolvedContent = content;
  if (writeResult.outcome === "conflict") {
    const controller = scope.get(editablePlanSaveController, controllerId) as
      | { content: string; path: string }
      | null;
    resolvedContent =
      controller?.path === path
        ? controller.content
        : (await readTextFile({ filePath: path, hostId })).content;
  }
  return openEditablePlanTab(
    scope,
    { content: resolvedContent, conversationId, hostId, key, path, title },
    EditablePlanPanel,
  )
    ? "opened"
    : "unavailable";
}

function openReadonlyPlan(
  scope: PlanScope,
  {
    content,
    conversationId,
    cwd,
    hideCodeBlocks,
    key,
    planKey,
    title,
  }: PlanDescriptor,
  {
    revealAndFocus = true,
    insertPosition,
    tabId = sidePanelTabIds.PLAN,
  }: OpenPlanPanelOptions = {},
): unknown {
  scope.set(activeEditablePlan, { key, tabId });
  return openSidePanelTab(scope, planPanelDefinition, {
    revealAndFocus,
    defaultState: () => ({ planKey: key, scrollTop: 0 }),
    durableRoute:
      planKey == null
        ? undefined
        : { kind: savedPlanRouteKind, params: { planKey }, payloadVersion: 1 },
    id: tabId,
    insertPosition,
    onClose: (closingScope: PlanScope) => {
      const active = closingScope.get(activeEditablePlan) as { key?: string } | null;
      if (active?.key === key) closingScope.set(activeEditablePlan, null);
    },
    props: { content, conversationId, cwd, hideCodeBlocks, planKey: key },
    title,
  });
}

function initializePlanSidePanel(): void {
  initializeUtilities();
  initializeSidePanelRoutes();
  initializeSidePanel();
  initializeConversationModel();
  initializePlanSidePanelState();
  initializeWorkspaceFileState();
  initializePlanRoutes();
  initializePlanStorage();
  initializeTextFileStorage();
  initializeSidePanelRegistry();
  initializeErrors();
  initializeEditablePlanTab();
  initializeEditablePlanStorage();
  planPanelDefinition = createPlanPanelDefinition({ open: openReadonlyPlan });
  void joinPath;
  void planRouteKind;
}

export {
  openPlanSidePanel as n,
  openReadonlyPlan as r,
  initializePlanSidePanel as t,
};
