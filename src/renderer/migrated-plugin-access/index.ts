// migrated-plugin-access —— GPT 迁移为插件时的资格、权限与目标插件访问查询。
// 原版：app/webview/assets/migrated-plugin-access-912829d71f23.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type {
  DerivedScopedSignalContext,
  ScopedQueryFamily,
} from "@rchunk/app-shared";

void runtimeChunk;

interface GptPermissions {
  can_preview_business_agent_tools?: boolean | null;
  can_read?: boolean;
  can_view_config?: boolean;
  can_write?: boolean;
}

interface GptResource {
  gizmo: {
    author: { user_id: string };
    current_user_permission?: GptPermissions | null;
    gizmo_type: string;
    live_version?: number | null;
    migrated_plugin_id?: string | null;
    share_recipient?: string | null;
    workspace_id?: string | null;
  };
}

interface Account {
  account_user_id?: string | null;
  account_user_role?: string | null;
  id: string;
  structure: "personal" | "workspace" | string;
}

interface MigrationEligibility {
  resource: GptResource;
  account: Account | null;
  accountId: string | null;
  userId: string | null;
  enabled: boolean;
  allowMigrated?: boolean;
}

interface PluginBatchResponse {
  results: Array<{
    plugin: {
      id: string;
      installation_policy: string;
      status: string;
    };
  }>;
}

interface AppInitialBindings {
  G3t(product: string): Record<string, string>;
  G6t(): void;
  K3t(): void;
  K6t: unknown;
  Sun(): void;
  _un: unknown;
  f4t(signal: AbortSignal): AbortSignal;
  p4t(): void;
  pdn(): void;
  udn: {
    safePost<Result>(
      path: string,
      options: {
        additionalHeaders: Record<string, string>;
        requestBody: { plugin_ids: string[] };
        signal: AbortSignal;
      },
    ): Promise<Result>;
  };
}

const {
  G3t: getProductHeaders,
  G6t: initializeGptResources,
  K3t: initializeAccountState,
  K6t: accountIdSignal,
  Sun: initializeGptPermissions,
  _un: userIdSignal,
  f4t: normalizeAbortSignal,
  p4t: initializePluginState,
  pdn: initializeWorkspaceSubscriptions,
  udn: appApiClient,
} = appInitialChunk as unknown as AppInitialBindings;
const {
  FX: initializeMaitaiRuntime,
  QI: initializeQueryBridge,
  QX: createQueryFamily,
  ZI: AppScope,
} = appSharedChunk;

function isLiveGptResource({ gizmo }: GptResource): boolean {
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
  account: Account | null | undefined,
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
  resource: GptResource;
  account: Account | null;
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

let pluginAccessQuery: ScopedQueryFamily<
  Record<string, unknown>,
  string,
  boolean
>;
let initialized = false;
function initializeMigratedPluginAccess(): void {
  if (initialized) return;
  initializeMaitaiRuntime();
  initializeGptResources();
  initializeGptPermissions();
  initializeAccountState();
  initializePluginState();
  initializeQueryBridge();
  initializeWorkspaceSubscriptions();
  pluginAccessQuery = createQueryFamily<
    Record<string, unknown>,
    string,
    boolean
  >(
    AppScope,
    (
      pluginId: string,
      { get }: DerivedScopedSignalContext<Record<string, unknown>>,
    ) => {
      const accountId = get<string | null>(accountIdSignal);
      const userId = get<string | null>(userIdSignal);
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
          const { results } = await appApiClient.safePost<PluginBatchResponse>(
            "/ps/plugins/batch",
            {
              requestBody: { plugin_ids: [pluginId] },
              additionalHeaders: getProductHeaders("chatgpt"),
              signal: normalizeAbortSignal(signal),
            },
          );
          return results.some(
            ({ plugin }) =>
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
