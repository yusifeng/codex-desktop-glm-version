// appgen-access —— Site 分享访问策略的规范化、统计与变更请求构造。
// 原版：app/webview/assets/appgen-access-50974c702eaf.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const { z2t: loadUniqueValues } = appInitialChunk;

type UniqueValues = <Value>(values: readonly Value[]) => Value[];

export interface AppgenAccessGroup extends Record<string, unknown> {
  id: string;
  source?: "tenant" | "workspace" | string;
}

export interface AppgenAccessUser extends Record<string, unknown> {
  account_user_id: string;
  email?: string | null;
}

export interface AppgenAccessPolicy extends Record<string, unknown> {
  access_mode: string;
  allowed_account_user_ids: string[];
  allowed_editors?: AppgenAccessUser[];
  allowed_groups?: AppgenAccessGroup[];
  allowed_tenant_group_ids: string[];
  allowed_users?: AppgenAccessUser[];
  allowed_workspace_group_ids: string[];
  current_user_role?: string;
  external_visitor_count?: number;
}

export interface AppgenEditableAccessPolicy extends AppgenAccessPolicy {
  allowed_groups: AppgenAccessGroup[];
  allowed_users: AppgenAccessUser[];
}

export interface AppgenAccessSummary {
  accessMode: string;
  groupCount: number;
  userCount: number;
}

export interface AppgenAccessModeOption {
  disabled: boolean;
  value: string;
}

export interface AppgenAccessUpdate extends Record<string, unknown> {
  allowed_tenant_group_ids?: string[];
  allowed_user_emails?: string[];
  allowed_workspace_group_ids?: string[];
  editor_changes?: {
    add_editor_account_user_ids?: string[];
    remove_editor_account_user_ids?: string[];
  };
}

export interface BuildAppgenAccessUpdateInput {
  accessGroups: AppgenAccessGroup[];
  allowedUserEmails: Array<string | null | undefined>;
  canManageInvitees: boolean;
  editorAccountUserIds?: string[];
  existingGroups: AppgenAccessGroup[];
  knownAccessGroups: AppgenAccessGroup[];
  removedEditorAccountUserIds?: string[];
  selectedGroups: AppgenAccessGroup[];
}

interface BuildGroupChangesInput {
  accessGroups: AppgenAccessGroup[];
  existingGroups: AppgenAccessGroup[];
  knownAccessGroups: AppgenAccessGroup[];
  removedGroups: AppgenAccessGroup[];
  selectedGroups: AppgenAccessGroup[];
}

let uniqueValues: UniqueValues;

function isOwner(
  accessPolicy: { current_user_role?: string } | null | undefined,
): boolean {
  return accessPolicy?.current_user_role === "owner";
}

function buildAccessModeOptions({
  availableAccessModes,
  currentAccessMode,
  isWorkspaceAccount,
}: {
  availableAccessModes?: string[] | null;
  currentAccessMode: string;
  isWorkspaceAccount: boolean;
}): AppgenAccessModeOption[] {
  const modes =
    availableAccessModes ??
    (isWorkspaceAccount ? ["workspace_all", "custom"] : []);
  const options = modes.map((value) => ({ disabled: false, value }));
  return modes.some((value) => value === currentAccessMode)
    ? options
    : [...options, { disabled: true, value: currentAccessMode }];
}

function compactUnique(values: Array<string | null | undefined>): string[] {
  return uniqueValues(
    values.flatMap((value) => (value == null ? [] : [value])),
  );
}

function uniqueGroupIds(groups: AppgenAccessGroup[]): string[] {
  return Array.from(new Set(groups.map((group) => group.id)));
}

function buildGroupChanges({
  accessGroups,
  knownAccessGroups,
  existingGroups,
  removedGroups,
  selectedGroups,
}: BuildGroupChangesInput): AppgenAccessUpdate {
  const groupsById = new Map(
    [...knownAccessGroups, ...accessGroups].map((group) => [group.id, group]),
  );
  const canonicalExisting = existingGroups.flatMap((group) => {
    const canonical = groupsById.get(group.id);
    return canonical == null ? [] : [canonical];
  });
  const canonicalRemoved = removedGroups.flatMap((group) => {
    const canonical = groupsById.get(group.id);
    return canonical == null ? [] : [canonical];
  });
  const allowedGroups = [...canonicalExisting, ...selectedGroups];
  const changedGroups = [...selectedGroups, ...canonicalRemoved];
  const workspaceChanged = changedGroups.some(
    (group) => group.source === "workspace",
  );
  const tenantChanged = changedGroups.some(
    (group) => group.source === "tenant",
  );
  return {
    ...(workspaceChanged
      ? {
          allowed_workspace_group_ids: uniqueGroupIds(
            allowedGroups.filter((group) => group.source === "workspace"),
          ),
        }
      : {}),
    ...(tenantChanged
      ? {
          allowed_tenant_group_ids: uniqueGroupIds(
            allowedGroups.filter((group) => group.source === "tenant"),
          ),
        }
      : {}),
  };
}

function buildAccessUpdate({
  accessGroups,
  allowedUserEmails,
  canManageInvitees,
  editorAccountUserIds = [],
  existingGroups,
  knownAccessGroups,
  removedEditorAccountUserIds = [],
  selectedGroups,
}: BuildAppgenAccessUpdateInput): AppgenAccessUpdate {
  return {
    ...(canManageInvitees && {
      allowed_user_emails: compactUnique(allowedUserEmails),
      ...buildGroupChanges({
        accessGroups,
        knownAccessGroups,
        existingGroups,
        removedGroups: [],
        selectedGroups,
      }),
    }),
    ...((editorAccountUserIds.length > 0 ||
      removedEditorAccountUserIds.length > 0) && {
      editor_changes: {
        ...(editorAccountUserIds.length > 0 && {
          add_editor_account_user_ids: uniqueValues(editorAccountUserIds),
        }),
        ...(removedEditorAccountUserIds.length > 0 && {
          remove_editor_account_user_ids: uniqueValues(
            removedEditorAccountUserIds,
          ),
        }),
      },
    }),
  };
}

function summarizeAccessPolicy(
  accessPolicy: AppgenAccessPolicy | null | undefined,
): AppgenAccessSummary {
  if (accessPolicy == null) {
    return { accessMode: "admins_only", groupCount: 0, userCount: 0 };
  }
  const primaryUserId = accessPolicy.allowed_account_user_ids[0];
  const userIds = new Set(accessPolicy.allowed_account_user_ids.slice(1));
  for (const editor of accessPolicy.allowed_editors ?? []) {
    if (editor.account_user_id !== primaryUserId) {
      userIds.add(editor.account_user_id);
    }
  }
  return {
    accessMode: accessPolicy.access_mode,
    groupCount:
      accessPolicy.allowed_tenant_group_ids.length +
      accessPolicy.allowed_workspace_group_ids.length,
    userCount: userIds.size + (accessPolicy.external_visitor_count ?? 0),
  };
}

function isEmptyRestrictedAccess({
  accessMode,
  groupCount,
  userCount,
}: AppgenAccessSummary): boolean {
  return (
    (accessMode === "admins_only" || accessMode === "custom") &&
    groupCount === 0 &&
    userCount === 0
  );
}

function buildRemoveUserRequest(
  accessPolicy: AppgenEditableAccessPolicy,
  accountUserId: string,
): AppgenAccessUpdate {
  return {
    allowed_user_emails: compactUnique(
      accessPolicy.allowed_users
        .filter((user) => user.account_user_id !== accountUserId)
        .map((user) => user.email),
    ),
  };
}

function buildRemoveGroupRequest({
  accessGroups,
  accessPolicy,
  group,
  knownAccessGroups,
}: {
  accessGroups: AppgenAccessGroup[];
  accessPolicy: AppgenEditableAccessPolicy;
  group: AppgenAccessGroup;
  knownAccessGroups: AppgenAccessGroup[];
}): AppgenAccessUpdate {
  return {
    allowed_user_emails: compactUnique(
      accessPolicy.allowed_users.map((user) => user.email),
    ),
    ...buildGroupChanges({
      accessGroups,
      knownAccessGroups,
      existingGroups: accessPolicy.allowed_groups.filter(
        (candidate) => candidate.id !== group.id,
      ),
      removedGroups: [group],
      selectedGroups: [],
    }),
  };
}

function initializeAppgenAccess(): void {
  const loaded = loadUniqueValues();
  uniqueValues = typeof loaded === "function" ? loaded : loaded.default;
}

export {
  buildRemoveGroupRequest as a,
  isEmptyRestrictedAccess as c,
  buildAccessUpdate as i,
  buildAccessModeOptions as n,
  buildRemoveUserRequest as o,
  summarizeAccessPolicy as r,
  initializeAppgenAccess as s,
  isOwner as t,
};
