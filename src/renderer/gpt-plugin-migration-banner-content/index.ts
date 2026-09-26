// gpt-plugin-migration-banner-content —— 自定义 GPT 迁移到插件后的公告内容与操作。
// 原版：app/webview/assets/banner-content-6fd3d18d582a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as chatChoiceChunk from "@rchunk/chat-choice-view";
import * as migratedAccessChunk from "@rchunk/migrated-plugin-access";
import * as noticesChunk from "@rchunk/gpt-plugin-migration-notices";
import * as migratedPluginChunk from "@rchunk/migrated-plugin-notice";
import * as migrationDialogChunk from "@rchunk/gpt-plugin-migration-dialog";
import type { LazyComponent } from "@rchunk/app-shared";

void runtimeChunk;

interface GptResource {
  gizmo: {
    current_user_permission?: {
      can_preview_business_agent_tools?: boolean | null;
    } | null;
    display: { name: string };
    gizmo_type: string;
    live_version?: number | null;
    migrated_plugin_id?: string | null;
  };
}

interface MigrationDialogProps extends Record<string, unknown> {
  resource: GptResource;
}

interface MigrationChoiceProps {
  gizmoId: string;
  pluginId: string;
  gptName: string;
}

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  Jm: createLazyComponent,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
  qm: initializeQueryRuntime,
} = appSharedChunk;
const {
  Dln: workspacePermissionsQuery,
  M6t: initializeAuthentication,
  N6t: useAuthentication,
  Oln: initializeNavigation,
  Qgn: initializeGptResources,
  Uzt: openDialog,
  Vzt: initializeDialogHost,
  afn: useExperiment,
  fN: gptResourceQuery,
  i_n: useLocation,
  ifn: initializeExperiments,
  l1: initializePluginNavigation,
  mN: initializeAccounts,
  o_n: useNavigate,
  ofn: useFeatureGate,
  rht: initializeAccountQuery,
  u1: openPlugin,
  uht: useAccountQuery,
} = appInitialChunk;
const {
  Ip: migrationDismissedSignal,
  Lp: initializeMigrationVisitState,
  Mp: keepUsingGptForVisit,
  Np: dismissMigrationForVisit,
  Pp: migrationVisitedSignal,
} = appPrimaryChunk;
const { n: initializeChatChoiceView, t: ChatChoiceView } = chatChoiceChunk;
const {
  i: accountCanUseWorkspacePlugins,
  n: pluginAccessQuery,
  o: shouldShowWorkspacePluginRetirement,
  r: canMigrateGpt,
  t: initializeMigratedPluginAccess,
} = migratedAccessChunk;
const {
  i: initializeMigrationNotices,
  n: MigrationNotice,
  r: ExplorePluginsNotice,
  t: WorkspacePluginsBlockedNotice,
} = noticesChunk;
const {
  r: initializeMigratedPluginNotice,
  t: MigratedPluginNotice,
} = migratedPluginChunk;
const MigrationDialogComponent =
  migrationDialogChunk.GptPluginMigrationDialog as LazyComponent<MigrationDialogProps>;

let jsx: ReturnType<typeof getJsxRuntime>;
let MigrationDialog: LazyComponent<MigrationDialogProps>;
let initialized = false;
function initializeGptPluginMigrationBannerContent(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeGptResources();
  initializeNavigation();
  initializeAuthentication();
  initializeAccountQuery();
  initializeQueryRuntime();
  initializeDialogHost();
  initializeSharedRuntime();
  initializeExperiments();
  initializeAccounts();
  initializePluginNavigation();
  initializeChatChoiceView();
  initializeMigrationVisitState();
  initializeMigratedPluginAccess();
  initializeMigratedPluginNotice();
  initializeMigrationNotices();
  jsx = getJsxRuntime();
  MigrationDialog = createLazyComponent<MigrationDialogProps>(
    async () => MigrationDialogComponent,
  );
  initialized = true;
}

function MigratedPluginChoice({
  gizmoId,
  pluginId,
  gptName,
}: MigrationChoiceProps): unknown {
  const scope = useSignalScope(applicationScope);
  const location = useLocation();
  const navigate = useNavigate();
  const accessQuery = useSignalFamilyValue(pluginAccessQuery, pluginId);
  let accessState: "allowed" | "denied" | "error" | "pending" = "denied";
  if (accessQuery.isPending || accessQuery.isFetching) accessState = "pending";
  else if (accessQuery.isError) accessState = "error";
  else if (accessQuery.data === true) accessState = "allowed";

  const onRetry = () => void accessQuery.refetch();
  const onUsePlugin = () => {
    if (accessState === "pending") return;
    if (accessState === "allowed") openPlugin(pluginId, navigate);
    else navigate("/plugins");
  };
  const onKeepUsingGpt = () =>
    keepUsingGptForVisit(scope, { gizmoId, visitKey: location.pathname });
  return jsx.jsx(ChatChoiceView, {
    gptName,
    accessState,
    onRetry,
    onUsePlugin,
    onKeepUsingGpt,
  });
}

function GptPluginMigrationBannerContent({
  gizmoId,
}: {
  gizmoId: string;
}): unknown {
  initializeGptPluginMigrationBannerContent();
  const scope = useSignalScope(applicationScope);
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId, userId } = useAuthentication();
  const account = useAccountQuery(undefined, { preview: false }).data;
  const resource = useSignalFamilyValue(gptResourceQuery, gizmoId).data;
  const workspaceExperiment = useExperiment("2562735250").get(
    "enabled",
    false,
  );
  const workspaceGate = useFeatureGate("1355972088");
  const isWorkspaceEligible =
    workspaceExperiment &&
    accountId != null &&
    account?.id === accountId &&
    account.structure === "workspace" &&
    workspaceGate;
  const permissionsQuery = useSignalFamilyValue(
    workspacePermissionsQuery,
    accountId ?? "",
    { enabled: isWorkspaceEligible },
  );
  const visit = { gizmoId, visitKey: location.pathname };
  const dismissed = useSignalFamilyValue(migrationDismissedSignal, visit);
  const hasVisitedMigration = useSignalFamilyValue(migrationVisitedSignal, visit);

  if (resource?.gizmo.gizmo_type !== "gpt") return null;
  const gizmo = resource.gizmo;
  const pluginId = gizmo.migrated_plugin_id;

  if (
    isWorkspaceEligible &&
    !permissionsQuery.isError &&
    shouldShowWorkspacePluginRetirement({
      resource,
      account,
      accountId,
      permissions: permissionsQuery.data?.permissions,
    })
  ) {
    const onKeepUsingGpt =
      pluginId && hasVisitedMigration
        ? () => keepUsingGptForVisit(scope, visit)
        : undefined;
    return jsx.jsx("div", {
      className: "mx-auto mb-3 w-full max-w-[var(--thread-content-max-width)]",
      children: jsx.jsx(WorkspacePluginsBlockedNotice, {
        surface: pluginId ? "migrated" : "gpt",
        onKeepUsingGpt,
      }),
    });
  }

  if (pluginId) {
    return hasVisitedMigration
      ? jsx.jsx(MigratedPluginChoice, {
          gizmoId,
          pluginId,
          gptName: gizmo.display.name,
        })
      : jsx.jsx(MigratedPluginNotice, {
          pluginId,
          gptName: gizmo.display.name,
        });
  }

  if (
    account == null ||
    account.id !== accountId ||
    gizmo.current_user_permission?.can_preview_business_agent_tools != null ||
    (gizmo.live_version ?? 0) <= 0 ||
    dismissed ||
    (isWorkspaceEligible && permissionsQuery.isPending)
  )
    return null;

  const canMigrate =
    workspaceExperiment &&
    accountCanUseWorkspacePlugins(
      account,
      workspaceGate,
      permissionsQuery.data?.permissions,
    ) &&
    canMigrateGpt({
      resource,
      account,
      accountId,
      userId,
      enabled: true,
    });
  return jsx.jsx("div", {
    className: "mx-auto mb-3 w-full max-w-[var(--thread-content-max-width)]",
    children: canMigrate
      ? jsx.jsx(MigrationNotice, {
          surface: "chat",
          onDismiss: () => dismissMigrationForVisit(scope, visit),
          onMigrate: () => openDialog(scope, MigrationDialog, { resource }),
        })
      : jsx.jsx(ExplorePluginsNotice, {
          currentGpt: true,
          onExplore: () => void navigate("/plugins"),
        }),
  });
}

initializeGptPluginMigrationBannerContent();
export { GptPluginMigrationBannerContent };
