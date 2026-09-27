import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/plugin-skill-preview";
import "@rchunk/showcase-items";

export interface ShowcaseSkill { description?: string; enabled?: boolean; files?: Record<string, unknown>; id: string; name?: string; permissions?: { can_read?: boolean }; safetyStatus?: "blocked" | "needs-review" | null; [key: string]: unknown }
export interface PluginShowcaseSkillDetailsProps { item: { description?: string; pin: { artifact_id: string }; title?: string }; onClose(): void; onInstall?(skill: ShowcaseSkill): Promise<void> | void; skill?: ShowcaseSkill | null; skillsAccess?: boolean }
let jsx: JsxRuntime;
function PluginShowcaseSkillDetails(props: PluginShowcaseSkillDetailsProps): unknown {
  const runtime = ensureJsx();
  if (props.skillsAccess === false) return runtime.jsx("dialog", { open: true, children: runtime.jsx("div", { role: "alert", children: "Skills aren't available for this account" }) });
  if (props.skill == null) return runtime.jsx("dialog", { open: true, children: runtime.jsx("div", { "aria-busy": true, children: "Loading skill…" }) });
  const skill = props.skill;
  const installed = skill.enabled === true;
  const readableFile = preferredSkillFile(skill.files ?? {});
  return runtime.jsxs("dialog", { open: true, onClose: props.onClose, children: [runtime.jsx("h1", { children: skill.name ?? props.item.title ?? skill.id }), runtime.jsx("p", { children: skill.description ?? props.item.description }), skill.safetyStatus == null ? null : runtime.jsx("div", { role: "alert", children: skill.safetyStatus === "blocked" ? "This skill is blocked by its safety review" : "Review this skill's files before approving it for use" }), readableFile == null || skill.permissions?.can_read === false ? runtime.jsx("p", { role: "status", children: "Unable to load skill contents." }) : runtime.jsx("div", { "data-skill-file": readableFile }), runtime.jsx("button", { type: "button", disabled: installed || skill.safetyStatus != null, onClick: () => props.onInstall?.(skill), children: installed ? "Installed" : "Install skill" })] });
}
function preferredSkillFile(files: Record<string, unknown>): string | null { const paths = Object.keys(files).sort(); return paths.find((path) => path === "SKILL.md") ?? paths.find((path) => path.endsWith("/SKILL.md")) ?? null; }
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { PluginShowcaseSkillDetails };
