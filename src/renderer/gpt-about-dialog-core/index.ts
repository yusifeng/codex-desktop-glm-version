import "@rchunk/rolldown-runtime";
import "@rchunk/gpt-plugin-retirement";
import "@rchunk/gpt-report-menu-item";
import "@rchunk/card-tile";
import "@rchunk/migrated-plugin-access";
import "@rchunk/gpt-plugin-migration-notices";
import "@rchunk/gpt-plugin-migration-dialog";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface GptResource { gizmo?: { author?: { display_name?: string }; display?: { description?: string; name?: string; profile_picture_url?: string }; id?: string; tags?: string[]; [key: string]: unknown }; [key: string]: unknown }
interface GptAboutDialogProps { onClose(): void; onDelete?(): void; onReport?(): void; open?: boolean; resource: GptResource }
const jsx = getJsxRuntime();
function getGptId(resource: GptResource): string | null { return typeof resource.gizmo?.id === "string" ? resource.gizmo.id : null; }
function getGptName(resource: GptResource): string { return resource.gizmo?.display?.name?.trim() || "GPT"; }
function getGptDescription(resource: GptResource): string { return resource.gizmo?.display?.description?.trim() || ""; }
function getGptAuthor(resource: GptResource): string | null { return resource.gizmo?.author?.display_name?.trim() || null; }
function hasGptTag(resource: GptResource, tag: string): boolean { return resource.gizmo?.tags?.includes(tag) ?? false; }
function selectGptField(resource: GptResource, key: string, fallback: unknown): unknown { return resource.gizmo?.[key] ?? fallback; }
function buildGptSubtitle(resource: GptResource, prefix?: string, suffix?: string): string { return [prefix, getGptAuthor(resource), suffix].filter(Boolean).join(" · "); }
function GptAboutDialog({ resource, onClose, onDelete, onReport, open = true }: GptAboutDialogProps): unknown {
  if (!open) return null;
  const name = getGptName(resource);
  const image = resource.gizmo?.display?.profile_picture_url;
  return jsx.jsxs("dialog", { open: true, children: [image ? jsx.jsx("img", { src: image, alt: "" }) : null, jsx.jsx("h2", { children: name }), getGptAuthor(resource) ? jsx.jsx("p", { children: `By ${getGptAuthor(resource)}` }) : null, jsx.jsx("p", { children: getGptDescription(resource) }), jsx.jsxs("footer", { children: [onReport ? jsx.jsx("button", { type: "button", onClick: onReport, children: "Report" }) : null, onDelete ? jsx.jsx("button", { type: "button", onClick: onDelete, children: "Delete" }) : null, jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" })] })] });
}
function initializeGptAboutDialog(): void { initializeApiClient(); }
export { buildGptSubtitle as a, initializeApiClient as c, getGptName as i, initializeGptAboutDialog as n, getGptAuthor as o, selectGptField as r, hasGptTag as s, GptAboutDialog as t };
void getGptId;
