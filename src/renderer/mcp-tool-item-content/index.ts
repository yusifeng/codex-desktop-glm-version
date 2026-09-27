import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-tasks-runtime";
import "@rchunk/computer-use-native-app-metadata";
import { i as initializeMcpToolActivityLabels, t as formatToolActivityLabel } from "@rchunk/mcp-tool-activity-label";
import "@rchunk/open-automation-side-panel-tab";
import "@rchunk/presentation";
import "@rchunk/tool-activity-disclosure";
import "@rchunk/webmcp-tool-calls";

interface ToolItem { appContext?: { actionName?: string; appName?: string; connectorId: string } | null; callId: string; invocation: { arguments?: unknown; server?: string | null; tool: string }; result?: { error?: string; raw?: unknown; type: "error" | "success" } | null; threadId?: string }
interface ToolItemContentProps { expandedContentOnly?: boolean; hostId?: string; item: ToolItem; matchingApp?: { id: string; name: string; pluginDisplayNames?: string[] } | null; onExpand?(): void; summary?: string | null }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function resolvePluginLogo({ pluginId, plugins, serverName }: { pluginId?: string | null; plugins: Array<{ composerIconPath?: string; logoPath?: string; plugin: { id: string; name?: string } }>; serverName?: string | null }): { alt: string; logoUrl?: string } | null { if (!pluginId || serverName === "codex_apps") return null; const plugin = plugins.find(candidate => candidate.plugin.id === pluginId); return plugin == null ? null : { alt: plugin.plugin.name ?? plugin.plugin.id, logoUrl: plugin.composerIconPath ?? plugin.logoPath }; }
function RemoteToolLogo({ fallback, item }: { fallback?: unknown; item: ToolItem }): unknown { return jsx().jsx("span", { "aria-label": item.invocation.server ?? "tool", children: fallback ?? "◈" }); }
function AutomationItem({ automation, onOpen }: { automation: { id: string; isEnabled?: boolean; nextRunAt?: string | null; scheduleLabel?: string | null; title: string }; onOpen?(id: string): void }): unknown { return jsx().jsxs("button", { type: "button", onClick: () => onOpen?.(automation.id), children: [automation.title, automation.scheduleLabel ? ` · ${automation.scheduleLabel}` : "", automation.isEnabled === false ? " · Disabled" : ""] }); }
function AutomationList({ automations, onOpen }: { automations: Array<{ id: string; isEnabled?: boolean; nextRunAt?: string | null; scheduleLabel?: string | null; title: string }>; onOpen?(id: string): void }): unknown { return jsx().jsx("section", { "aria-label": "Scheduled tasks", children: automations.slice(0, 5).map(item => jsx().jsx(AutomationItem, { automation: item, onOpen }, item.id)) }); }
function ToolItemContent(props: ToolItemContentProps): unknown { const item = props.item; const completed = item.result != null; const label = props.summary ?? formatToolActivityLabel({ appContext: item.appContext, completed, intl: { formatMessage: descriptor => descriptor.defaultMessage }, matchingApp: props.matchingApp, serverName: item.invocation.server, toolArguments: item.invocation.arguments, toolName: item.invocation.tool, toolResult: item.result }); const content = item.result?.type === "error" ? item.result.error ?? "Tool failed" : item.result?.raw ?? null; return jsx().jsxs("section", { "aria-label": label, "data-tool-status": item.result?.type ?? "active", children: [jsx().jsxs("header", { children: [jsx().jsx(RemoteToolLogo, { item }), jsx().jsx("strong", { children: label })] }), props.expandedContentOnly ? null : jsx().jsx("button", { type: "button", onClick: props.onExpand, children: "Details" }), content == null ? null : jsx().jsx("pre", { children: typeof content === "string" ? content : JSON.stringify(content, null, 2) })] }); }
function TrackTaskView(): null { return null; }
function initializeToolItemContent(): void { initializeMcpToolActivityLabels(); void jsx(); }
export { TrackTaskView as a, initializeToolItemContent as c, resolvePluginLogo as d, initializeToolItemContent as f, initializeToolItemContent as i, RemoteToolLogo as l, initializeToolItemContent as n, initializeToolItemContent as o, AutomationList as r, AutomationItem as s, ToolItemContent as t, initializeToolItemContent as u };
