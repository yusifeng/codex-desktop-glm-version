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

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const chatChoice = chatChoiceChunk as Record<string, any>;
const migratedAccess = migratedAccessChunk as Record<string, any>;
const notices = noticesChunk as Record<string, any>;
const migratedPlugin = migratedPluginChunk as Record<string, any>;
const migrationDialog = migrationDialogChunk as Record<string, any>;

let jsx: any;
let MigrationDialog: any;
let initialized = false;
function initializeGptPluginMigrationBannerContent(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.FX?.();
  appInitial.Qgn?.();
  appInitial.Oln?.();
  appInitial.M6t?.();
  appInitial.rht?.();
  appShared.qm?.();
  appInitial.Vzt?.();
  appShared.QI?.();
  appInitial.ifn?.();
  appInitial.mN?.();
  appInitial.l1?.();
  chatChoice.n?.();
  appPrimary.Lp?.();
  migratedAccess.t?.();
  migratedPlugin.r?.();
  notices.i?.();
  jsx = appShared.I3?.();
  MigrationDialog =
    appShared.Jm?.(async () => ({
      default: migrationDialog.GptPluginMigrationDialog,
    })) ?? migrationDialog.GptPluginMigrationDialog;
  initialized = true;
}

type MigrationChoiceProps = {
  gizmoId: string;
  pluginId: string;
  gptName: string;
};

function MigratedPluginChoice({
  gizmoId,
  pluginId,
  gptName,
}: MigrationChoiceProps): unknown {
  const scope = appShared.LX?.(appShared.ZI);
  const location = appInitial.i_n?.() ?? { pathname: "/" };
  const navigate = appInitial.o_n?.() ?? (() => {});
  const accessQuery = appShared.BX?.(migratedAccess.n, pluginId) ?? {};
  let accessState = "denied";
  if (accessQuery.isPending || accessQuery.isFetching) accessState = "pending";
  else if (accessQuery.isError) accessState = "error";
  else if (accessQuery.data === true) accessState = "allowed";

  const onRetry = () => void accessQuery.refetch?.();
  const onUsePlugin = () => {
    if (accessState === "pending") return;
    if (accessState === "allowed") appInitial.u1?.(pluginId, navigate);
    else navigate("/plugins");
  };
  const onKeepUsingGpt = () =>
    appPrimary.Mp?.(scope, { gizmoId, visitKey: location.pathname });
  return jsx.jsx(chatChoice.t, {
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
  const scope = appShared.LX?.(appShared.ZI);
  const navigate = appInitial.o_n?.() ?? (() => {});
  const location = appInitial.i_n?.() ?? { pathname: "/" };
  const auth = appInitial.N6t?.() ?? {};
  const accountId = auth.accountId;
  const userId = auth.userId;
  const account = appInitial.uht?.(undefined, { preview: false })?.data;
  const resource = appShared.BX?.(appInitial.fN, gizmoId)?.data;
  const workspaceExperiment =
    appInitial.afn?.("2562735250")?.get?.("enabled", false) ?? false;
  const workspaceGate = appInitial.ofn?.("1355972088") ?? false;
  const isWorkspaceEligible =
    workspaceExperiment &&
    accountId != null &&
    account?.id === accountId &&
    account?.structure === "workspace" &&
    workspaceGate;
  const permissionsQuery =
    appShared.BX?.(appInitial.Dln, accountId ?? "", {
      enabled: isWorkspaceEligible,
    }) ?? {};
  const visit = { gizmoId, visitKey: location.pathname };
  const dismissed = appShared.BX?.(appPrimary.Ip, visit);
  const hasVisitedMigration = appShared.BX?.(appPrimary.Pp, visit);

  if (resource?.gizmo?.gizmo_type !== "gpt") return null;
  const gizmo = resource.gizmo;
  const pluginId = gizmo.migrated_plugin_id;

  if (
    isWorkspaceEligible &&
    !permissionsQuery.isError &&
    migratedAccess.o?.({
      resource,
      account,
      accountId,
      permissions: permissionsQuery.data?.permissions,
    })
  ) {
    const onKeepUsingGpt =
      pluginId && hasVisitedMigration
        ? () => appPrimary.Mp?.(scope, visit)
        : undefined;
    return jsx.jsx("div", {
      className: "mx-auto mb-3 w-full max-w-[var(--thread-content-max-width)]",
      children: jsx.jsx(notices.t, {
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
      : jsx.jsx(migratedPlugin.t, {
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
    migratedAccess.i?.(
      account,
      workspaceGate,
      permissionsQuery.data?.permissions,
    ) &&
    migratedAccess.r?.({
      resource,
      account,
      accountId,
      userId,
      enabled: true,
    });
  return jsx.jsx("div", {
    className: "mx-auto mb-3 w-full max-w-[var(--thread-content-max-width)]",
    children: canMigrate
      ? jsx.jsx(notices.n, {
          surface: "chat",
          onDismiss: () => appPrimary.Np?.(scope, visit),
          onMigrate: () =>
            appInitial.Uzt?.(scope, MigrationDialog, { resource }),
        })
      : jsx.jsx(notices.r, {
          currentGpt: true,
          onExplore: () => void navigate("/plugins"),
        }),
  });
}

initializeGptPluginMigrationBannerContent();
export { GptPluginMigrationBannerContent };
