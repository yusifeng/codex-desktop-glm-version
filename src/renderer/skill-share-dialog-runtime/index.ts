import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/browser-skills-state";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface SkillRecord extends Record<string, unknown> {
  creator_id?: string;
  description?: string;
  id: string;
  name?: string;
}

interface ShareTarget { principal_id: string; principal_type: "group" | "user" }
interface ShareOption { id: string; label: string; secondaryLabel?: string; target: ShareTarget }
interface ShareDialogProps { onClose(): void; skill: SkillRecord }
interface DuplicateDialogProps { disabled?: boolean; onCancel(): void; onConfirm(): void; resolution: "FORCE_CREATE" | "UPDATE_EXISTING" }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function parseDuplicateResolution(error: unknown): "FORCE_CREATE" | "UPDATE_EXISTING" | null {
  if (!(error instanceof Error)) return null;
  try {
    const parsed = JSON.parse(error.message) as { detail?: { resolution?: string; updateable?: boolean } };
    if (parsed.detail?.resolution === "FORCE_CREATE" || parsed.detail?.resolution === "UPDATE_EXISTING") return parsed.detail.resolution;
    return parsed.detail?.updateable ? "UPDATE_EXISTING" : null;
  } catch { return null; }
}

function DuplicateSkillDialog({ disabled = false, onCancel, onConfirm, resolution }: DuplicateDialogProps): unknown {
  const replacing = resolution === "UPDATE_EXISTING";
  return jsx().jsx("dialog", { open: true, children: jsx().jsxs("form", { onSubmit: (event: { preventDefault(): void; stopPropagation(): void }) => { event.preventDefault(); event.stopPropagation(); onConfirm(); }, children: [jsx().jsx("h2", { children: "Skill already exists" }), jsx().jsx("p", { children: replacing ? "A skill with this name already exists. Replace the existing skill?" : "A skill with this name already exists. Create this skill anyway?" }), jsx().jsx("button", { type: "button", onClick: onCancel, children: "Cancel" }), jsx().jsx("button", { type: "submit", disabled, children: replacing ? "Replace existing" : "Create anyway" })] }) });
}

function SkillShareDialog({ onClose, skill }: ShareDialogProps): unknown {
  return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: `Share ${skill.name ?? "skill"}` }), skill.description == null ? null : jsx().jsx("p", { children: skill.description }), jsx().jsx("button", { type: "button", "aria-label": "Close", onClick: onClose, children: "Close" })] });
}

function groupToShareOption(group: { id: string; name: string }): ShareOption { return { id: `group:${group.id}`, label: group.name, target: { principal_type: "group", principal_id: group.id } }; }
function userToShareOption(user: { account_user_id: string; email?: string | null; name?: string | null }): ShareOption { return { id: `user:${user.account_user_id}`, label: user.name || user.email || user.account_user_id, secondaryLabel: user.email ?? undefined, target: { principal_type: "user", principal_id: user.account_user_id } }; }
function isFailedResponse(response: { success?: boolean }): boolean { return !response.success; }
function responseTarget<T extends { target: unknown }>(response: T): T["target"] { return response.target; }
async function trySkill(): Promise<boolean> { return false; }
async function downloadSkill(): Promise<void> {}
async function deleteSkill(): Promise<void> {}
async function uploadSkill(): Promise<{ status: "error"; reason: "unavailable" }> { return { status: "error", reason: "unavailable" }; }
function initializeSkillShareRuntime(): void {}

export {
  initializeSkillShareRuntime as a,
  groupToShareOption as c,
  trySkill as d,
  uploadSkill as f,
  downloadSkill as i,
  parseDuplicateResolution as l,
  initializeSkillShareRuntime as n,
  trySkill as o,
  deleteSkill as r,
  DuplicateSkillDialog as s,
  SkillShareDialog as t,
  initializeSkillShareRuntime as u,
};
