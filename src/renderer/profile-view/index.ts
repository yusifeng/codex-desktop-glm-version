import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/model-and-reasoning-effort-translations";
import "@rchunk/codex-pet-assets";
import "@rchunk/document-title";
import "@rchunk/twitter-logo";
import "@rchunk/use-avatar-options";
import "@rchunk/appgen-project-row";
import "@rchunk/showcase-items";
import "@rchunk/plus-sm-icon";
import "@rchunk/reddit-logo";
import "@rchunk/plugin-showcase-skill-details";
import "@rchunk/profile-site-details";
import "@rchunk/profile-showcase-editor";
import "@rchunk/profile-plugin-details";
import "@rchunk/profile-share-dialog-content";

export interface ProfileStat { key: "currentStreakDays" | "longestStreakDays" | "longestTaskDurationMs" | "peakTokens" | "totalTextTokens" | string; label?: string; value: number }
export interface ProfileShowcaseItem { id: string; kind: "app" | "plugin" | "site" | "skill" | string; title: string; description?: string; url?: string }
export interface ProfileViewProps { Layout?: (props: { children?: unknown }) => unknown; activities?: readonly { id: string; label: string; timestamp?: string }[]; avatarId?: string | null; error?: Error | null; isOwnProfile?: boolean; isProfileV2Enabled?: boolean; onAvatarChanged?(avatarId: string): void; onEditShowcase?(): void; onOpenShowcaseItem?(item: ProfileShowcaseItem): void; onUsernameChanged?(username: string): void; showcase?: readonly ProfileShowcaseItem[]; stats?: readonly ProfileStat[]; today?: Date | string; username?: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function formatProfileError(error: Error): string { const details = Object.fromEntries(Object.entries(error)); if (Object.keys(details).length === 0) return error.stack ?? error.message; try { return JSON.stringify({ name: error.name, message: error.message, stack: error.stack, ...details }, null, 2); } catch { return error.message; } }
function formatStat(stat: ProfileStat): string { if (stat.key === "longestTaskDurationMs") { const minutes = Math.max(0, Math.round(stat.value / 60000)); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`; } if (stat.key === "currentStreakDays" || stat.key === "longestStreakDays") return `${stat.value} day${stat.value === 1 ? "" : "s"}`; return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(stat.value); }
function ProfileView(props: ProfileViewProps): unknown {
  const content = jsx().jsxs("section", { "data-profile-v2-enabled": props.isProfileV2Enabled ?? true, "data-today": props.today instanceof Date ? props.today.toISOString() : props.today, children: [
    jsx().jsxs("header", { children: [jsx().jsx("h1", { children: props.username ? `${props.username}'s profile` : "Profile" }), props.avatarId ? jsx().jsx("button", { type: "button", "data-avatar-id": props.avatarId, onClick: () => props.onAvatarChanged?.(props.avatarId!), children: props.avatarId }) : null] }),
    props.onUsernameChanged ? jsx().jsx("label", { children: ["Username", jsx().jsx("input", { value: props.username ?? "", onChange: (event: { currentTarget: { value: string } }) => props.onUsernameChanged?.(event.currentTarget.value) })] }) : null,
    jsx().jsx("dl", { children: (props.stats ?? []).map(stat => jsx().jsxs("div", { children: [jsx().jsx("dt", { children: stat.label ?? stat.key }), jsx().jsx("dd", { "data-raw-value": stat.value, children: formatStat(stat) })] }, stat.key)) }),
    (props.activities ?? []).length ? jsx().jsx("ol", { children: props.activities!.map(activity => jsx().jsxs("li", { children: [activity.label, activity.timestamp ? jsx().jsx("time", { dateTime: activity.timestamp, children: activity.timestamp }) : null] }, activity.id)) }) : jsx().jsx("p", { "data-empty-activity": true, children: "No recent activity" }),
    props.isProfileV2Enabled === false ? null : jsx().jsxs("section", { "aria-label": "Showcase", children: [jsx().jsx("h2", { children: "Showcase" }), (props.showcase ?? []).length ? jsx().jsx("ul", { children: props.showcase!.map(item => jsx().jsxs("li", { "data-showcase-kind": item.kind, children: [jsx().jsx("button", { type: "button", onClick: () => props.onOpenShowcaseItem?.(item), children: item.title }), item.description ? jsx().jsx("p", { children: item.description }) : null] }, item.id)) }) : jsx().jsx("p", { children: props.isOwnProfile ? "Nothing in showcase yet" : `${props.username ?? "This user"} hasn't added anything to their showcase yet` }), props.isOwnProfile && props.onEditShowcase ? jsx().jsx("button", { type: "button", onClick: props.onEditShowcase, children: "Edit showcase" }) : null] }),
    props.error ? jsx().jsx("pre", { role: "alert", children: formatProfileError(props.error) }) : null,
  ] });
  return props.Layout ? jsx().jsx(props.Layout, { children: content }) : content;
}
function initializeProfileView(): void { void jsx(); }
export { initializeProfileView as n, ProfileView as t };
