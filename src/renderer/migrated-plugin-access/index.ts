// migrated-plugin-access —— GPT 迁移为插件时的资格、权限与目标插件访问查询。
// 原版：app/webview/assets/migrated-plugin-access-912829d71f23.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;

type MigrationEligibility = {
  resource: any;
  account: any;
  accountId: string | null;
  userId: string | null;
  enabled: boolean;
  allowMigrated?: boolean;
};

function isLiveGptResource({ gizmo }: any): boolean {
  return (
    gizmo.gizmo_type === "gpt" &&
    gizmo.current_user_permission?.can_preview_business_agent_tools == null &&
    (gizmo.live_version ?? 0) > 0
  );
}

function canMigrateGpt({
  resource,
  account,
  accountId,
  userId,
  enabled,
  allowMigrated = false,
}: MigrationEligibility): boolean {
  const { gizmo } = resource;
  if (
    !enabled ||
    accountId == null ||
    account?.id !== accountId ||
    !isLiveGptResource(resource) ||
    (!allowMigrated && gizmo.migrated_plugin_id != null) ||
    (gizmo.workspace_id ?? null) !==
      (account.structure === "workspace" ? account.id : null)
  )
    return false;
  const ownerId =
    account.structure === "personal" ? userId : account.account_user_id;
  if (gizmo.author.user_id === ownerId)
    return (
      gizmo.current_user_permission?.can_view_config === true &&
      gizmo.current_user_permission.can_write === true
    );
  return (
    account.structure === "workspace" &&
    (account.account_user_role === "account-owner" ||
      account.account_user_role === "account-admin") &&
    gizmo.share_recipient !== "private" &&
    gizmo.current_user_permission?.can_read === true
  );
}

function accountCanUseWorkspacePlugins(
  account: any,
  workspaceGate: boolean,
  permissions?: string[],
): boolean {
  return account == null
    ? false
    : account.structure === "personal" ||
        !workspaceGate ||
        permissions?.includes("chatgpt.workspace_plugins.use") === true;
}

function shouldShowWorkspacePluginRetirement({
  resource,
  account,
  accountId,
  permissions,
}: {
  resource: any;
  account: any;
  accountId: string | null;
  permissions?: string[];
}): boolean {
  return (
    account?.structure === "workspace" &&
    account.id === accountId &&
    resource.gizmo.workspace_id === account.id &&
    resource.gizmo.author.user_id === account.account_user_id &&
    isLiveGptResource(resource) &&
    permissions != null &&
    !permissions.includes("chatgpt.workspace_plugins.use")
  );
}

let pluginAccessQuery: any;
let initialized = false;
function initializeMigratedPluginAccess(): void {
  if (initialized) return;
  appShared.FX?.();
  appInitial.G6t?.();
  appInitial.Sun?.();
  appInitial.K3t?.();
  appInitial.p4t?.();
  appShared.QI?.();
  appInitial.pdn?.();
  pluginAccessQuery = appShared.QX?.(
    appShared.ZI,
    (pluginId: string, { get }: { get: (atom: unknown) => unknown }) => {
      const accountId = get(appInitial.K6t);
      const userId = get(appInitial._un);
      return {
        enabled: accountId != null && userId != null,
        queryKey: [
          "plugins",
          "gpt-migration-access",
          pluginId,
          accountId,
          userId,
        ],
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const { results } = await appInitial.udn.safePost(
            "/ps/plugins/batch",
            {
              requestBody: { plugin_ids: [pluginId] },
              additionalHeaders: appInitial.G3t("chatgpt"),
              signal: appInitial.f4t(signal),
            },
          );
          return results.some(
            ({ plugin }: any) =>
              plugin.id === pluginId &&
              plugin.status === "ENABLED" &&
              plugin.installation_policy !== "NOT_AVAILABLE",
          );
        },
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        retry: false,
      };
    },
  );
  initialized = true;
}

function initializeMigratedPluginAccessTypes(): void {}

initializeMigratedPluginAccess();
export {
  initializeMigratedPluginAccessTypes as a,
  accountCanUseWorkspacePlugins as i,
  pluginAccessQuery as n,
  shouldShowWorkspacePluginRetirement as o,
  canMigrateGpt as r,
  initializeMigratedPluginAccess as t,
};
