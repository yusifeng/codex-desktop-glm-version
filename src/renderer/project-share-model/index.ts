import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";

interface Capabilities extends Record<string, boolean | undefined> {
  can_delete?: boolean; can_export?: boolean; can_read?: boolean; can_share?: boolean;
  can_view_config?: boolean; can_write?: boolean;
}
type ShareSubject =
  | { capabilities: Capabilities; type: 1; user_email?: string; user_id: string; user_name?: string }
  | { capabilities: Capabilities; group_id: string; group_name?: string; type: 2 }
  | { capabilities: Capabilities; type: 3 }
  | { capabilities: Capabilities; type: 4 }
  | { capabilities: Capabilities; type: 10; user_email: string };
interface Project {
  gizmo: {
    author: { user_id: string };
    current_user_permission?: { can_read?: boolean; can_share?: boolean; can_write?: boolean };
    gizmo_snorlax_type?: unknown;
    id: string;
    share_recipient: string;
    sharing?: { subjects: ShareSubject[] };
    short_url?: string;
  };
}
interface Account {
  account_user_id: string;
  account_user_role?: string;
  plan_type?: string;
  structure?: string;
}
interface WorkspacePolicy { beta_settings?: { project_sharing?: boolean }; permissions?: string[] }

function i(project: Project): string {
  return new URL(`/g/${encodeURIComponent(project.gizmo.short_url || project.gizmo.id)}/project`, "https://chatgpt.com").toString();
}

function r(project: Project | null | undefined, account: Account | null | undefined, policy?: WorkspacePolicy | null): { canInvite: boolean; canListWorkspaceMembers: boolean; canManage: boolean; canOpen: boolean; canShareWorkspaceLink: boolean } {
  const workspace = account?.structure === "workspace";
  const available = account != null && (!workspace || policy != null);
  const permissions = policy?.permissions;
  const sharingAllowed = available && (!workspace || (permissions == null ? policy?.beta_settings?.project_sharing === true : permissions.includes("chatgpt.workspace.project.share")));
  const canWrite = available && project?.gizmo.current_user_permission?.can_write === true && (!workspace || permissions == null || permissions.includes("chatgpt.workspace.project.crud"));
  const alreadyShared = project != null && (project.gizmo.share_recipient !== "private" || (project.gizmo.sharing?.subjects.length ?? 0) > 0);
  const canShare = project?.gizmo.current_user_permission?.can_share === true && (sharingAllowed || (workspace && alreadyShared));
  const isAuthor = account != null && project?.gizmo.author.user_id.split("__")[0] === account.account_user_id.split("__")[0];
  return {
    canOpen: available && project?.gizmo.current_user_permission?.can_read === true && project.gizmo.gizmo_snorlax_type == null && (!workspace || alreadyShared || sharingAllowed),
    canInvite: canWrite && sharingAllowed && (workspace || canShare),
    canManage: available && isAuthor && canWrite && canShare,
    canShareWorkspaceLink: available && workspace && (permissions == null || permissions.includes("chatgpt.workspace.project.share_workspace")),
    canListWorkspaceMembers: available && workspace && (account?.account_user_role === "account-owner" || account?.account_user_role === "account-admin" || permissions?.includes("chatgpt.workspace.member.role.view") === true || account?.plan_type !== "enterprise"),
  };
}

function n(subjects: readonly ShareSubject[]): "link" | "private" | "workspace_link" {
  return subjects.some((subject) => subject.type === 4) ? "link" : subjects.some((subject) => subject.type === 3) ? "workspace_link" : "private";
}
function c(subject: ShareSubject): string {
  switch (subject.type) {
    case 1: return `user:${subject.user_id.split("__")[0]}`;
    case 2: return `group:${subject.group_id}`;
    case 10: return `email:${subject.user_email.trim().toLowerCase()}`;
    case 3:
    case 4: return `visibility:${subject.type}`;
  }
}
function s(subject: ShareSubject): string | undefined {
  switch (subject.type) {
    case 1: return subject.user_name || subject.user_email || subject.user_id;
    case 2: return subject.group_name || subject.group_id;
    case 10: return subject.user_email;
    default: return undefined;
  }
}
function l(subject: ShareSubject, accountId?: string): Record<string, unknown> {
  switch (subject.type) {
    case 1: return { type: "user", user_id: accountId != null && !subject.user_id.includes("__") ? `${subject.user_id}__${accountId}` : subject.user_id, capabilities: subject.capabilities };
    case 2: return { type: "group", group_id: subject.group_id, capabilities: subject.capabilities };
    case 10: return { type: "email", user_email: subject.user_email, capabilities: subject.capabilities };
    case 3: return { type: "workspace_link", capabilities: subject.capabilities };
    case 4: return { type: "link", capabilities: subject.capabilities };
  }
}
function o(previous: readonly ShareSubject[], next: readonly ShareSubject[]): boolean {
  const visibilityLevel = { private: 0, workspace_link: 1, link: 2 } as const;
  if (visibilityLevel[n(next)] > visibilityLevel[n(previous)]) return true;
  const previousByKey = new Map(previous.map((subject) => [c(subject), subject]));
  return next.some((subject) => {
    const old = previousByKey.get(c(subject));
    if (old == null) return subject.type !== 3 && subject.type !== 4;
    return Object.entries(subject.capabilities).some(([capability, enabled]) => enabled === true && old.capabilities[capability] !== true);
  });
}

const t = {
  chat: { can_read: true, can_view_config: true, can_write: false, can_delete: false, can_export: false, can_share: false },
  edit: { can_read: true, can_view_config: true, can_write: true, can_delete: false, can_export: false, can_share: false },
} as const;
function a(): void {}
export { a, c, i, l, n, o, r, s, t };
