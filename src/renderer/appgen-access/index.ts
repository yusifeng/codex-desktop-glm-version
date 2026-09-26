// appgen-access —— Site 分享访问策略的规范化、统计与变更请求构造。
// 原版：app/webview/assets/appgen-access-50974c702eaf.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appInitial = appInitialChunk as Record<string, any>;
let uniqueValues: (values: any[]) => any[];

function isOwner(accessPolicy: any): boolean {
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
}) {
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

function uniqueGroupIds(groups: any[]): string[] {
  return Array.from(new Set(groups.map((group) => group.id)));
}

function buildGroupChanges({
  accessGroups,
  knownAccessGroups,
  existingGroups,
  removedGroups,
  selectedGroups,
}: {
  accessGroups: any[];
  knownAccessGroups: any[];
  existingGroups: any[];
  removedGroups: any[];
  selectedGroups: any[];
}) {
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
}: any) {
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

function summarizeAccessPolicy(accessPolicy: any) {
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

function isEmptyRestrictedAccess({ accessMode, groupCount, userCount }: any) {
  return (
    (accessMode === "admins_only" || accessMode === "custom") &&
    groupCount === 0 &&
    userCount === 0
  );
}

function buildRemoveUserRequest(accessPolicy: any, accountUserId: string) {
  return {
    allowed_user_emails: compactUnique(
      accessPolicy.allowed_users
        .filter((user: any) => user.account_user_id !== accountUserId)
        .map((user: any) => user.email),
    ),
  };
}

function buildRemoveGroupRequest({
  accessGroups,
  accessPolicy,
  group,
  knownAccessGroups,
}: any) {
  return {
    allowed_user_emails: compactUnique(
      accessPolicy.allowed_users.map((user: any) => user.email),
    ),
    ...buildGroupChanges({
      accessGroups,
      knownAccessGroups,
      existingGroups: accessPolicy.allowed_groups.filter(
        (candidate: any) => candidate.id !== group.id,
      ),
      removedGroups: [group],
      selectedGroups: [],
    }),
  };
}

function initializeAppgenAccess(): void {
  const loaded = appInitial.z2t();
  uniqueValues = loaded?.default ?? loaded;
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
