import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, n4 as useIntl, type JsxRuntime } from "@rchunk/app-shared";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import "@rchunk/chatgpt-tasks-runtime";
import "@rchunk/computer-use-native-app-metadata";
import { i as initializeMcpToolActivityLabels, t as formatToolActivityLabel } from "@rchunk/mcp-tool-activity-label";
import { n as openAutomationSidePanelTab, t as initializeOpenAutomationSidePanelTab } from "@rchunk/open-automation-side-panel-tab";
import "@rchunk/presentation";
import { n as initializeToolActivityDisclosure } from "@rchunk/tool-activity-disclosure";
import "@rchunk/webmcp-tool-calls";

interface ContentAnnotations { audience?: string[]; lastModified?: string; priority?: number }
type McpContentBlock =
  | { annotations?: ContentAnnotations; data: string; mimeType: string; type: "audio" | "image" }
  | { annotations?: ContentAnnotations; name?: string; title?: string; type: "resource_link"; uri: string }
  | { resource: { annotations?: ContentAnnotations; blob?: string; mimeType?: string; text?: string; uri: string }; type: "embedded_resource" }
  | { annotations?: ContentAnnotations; text: string; type: "text" }
  | { raw: unknown; type: "unknown" };
interface ToolResult { content?: McpContentBlock[]; error?: string; raw?: unknown; structuredContent?: unknown; type: "error" | "success" }
interface ToolItem {
  appContext?: { actionName?: string; appName?: string; connectorId: string } | null;
  automaticApprovalReviews?: unknown[];
  callId: string;
  completed?: boolean;
  durationMs?: number;
  invocation: { arguments?: unknown; server?: string | null; tool: string };
  invocationResourceUri?: string | null;
  isMcpAppWidgetSuperseded?: boolean;
  pluginId?: string | null;
  result?: ToolResult | null;
  source?: { backend?: string; kind?: string } | null;
  threadId?: string;
}
interface ToolItemContentProps {
  conversationId?: string;
  expandedContentOnly?: boolean;
  hostId?: string;
  hideTextBlocksWithStructuredContent?: boolean;
  item: ToolItem;
  loadRemoteLogos?: boolean;
  matchingApp?: { id: string; name: string; pluginDisplayNames?: string[] } | null;
  onExpand?(): void;
  renderMcpApps?: boolean;
  shouldAutoExpandMcpApp?: boolean;
  summary?: string | null;
  summaryIcon?: unknown;
  toolActivityTurnKey?: string;
}
interface IntlShape { formatMessage(descriptor: { defaultMessage: string; description?: string; id?: string }, values?: Record<string, unknown>): string }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function safeStringify(value: unknown, spacing = 2): string {
  try { return JSON.stringify(value, (_key, nested) => typeof nested === "bigint" ? `${nested.toString()}n` : nested, spacing) ?? "null"; }
  catch { return ""; }
}
function annotationText(annotations?: ContentAnnotations): string | null {
  if (annotations == null) return null;
  const values: string[] = [];
  if (annotations.audience?.length) values.push(`audience=${annotations.audience.join(", ")}`);
  if (annotations.priority != null) values.push(`priority=${String(annotations.priority)}`);
  if (annotations.lastModified != null) values.push(`lastModified=${annotations.lastModified}`);
  return values.length === 0 ? null : values.join("; ");
}
function annotationLine(annotations?: ContentAnnotations): string | null {
  const value = annotationText(annotations);
  return value == null ? null : `Annotations: ${value}`;
}
function structuredTextContent(content?: McpContentBlock[]): string | null {
  if (content?.length !== 1) return null;
  const [block] = content;
  if (block.type !== "text" || block.annotations != null) return null;
  const value = block.text.trim();
  if (value[0] !== "{" && value[0] !== "[") return null;
  try { return safeStringify(JSON.parse(value)); } catch { return null; }
}

function ContentBlock({ block }: { block: McpContentBlock }): unknown {
  switch (block.type) {
    case "image": {
      const annotation = annotationLine(block.annotations);
      return jsx().jsxs("div", { children: [jsx().jsx("img", { alt: "Image returned by tool", src: `data:${block.mimeType};base64,${block.data}` }), annotation == null ? null : jsx().jsx("p", { children: annotation })] });
    }
    case "audio": {
      const annotation = annotationLine(block.annotations);
      return jsx().jsxs("div", { children: [jsx().jsx("audio", { controls: true, preload: "metadata", src: `data:${block.mimeType};base64,${block.data}` }), annotation == null ? null : jsx().jsx("p", { children: annotation })] });
    }
    case "resource_link": {
      const annotation = annotationLine(block.annotations);
      return jsx().jsxs("div", { children: [jsx().jsx("div", { children: `Read ${block.title ?? block.name ?? block.uri}` }), annotation == null ? null : jsx().jsx("div", { children: annotation })] });
    }
    case "embedded_resource": {
      const content = block.resource.text ?? block.resource.blob ?? "";
      const annotation = annotationText(block.resource.annotations);
      return jsx().jsxs("div", { children: [
        jsx().jsxs("div", { children: [jsx().jsx("strong", { children: "URI" }), " ", block.resource.uri] }),
        block.resource.mimeType == null ? null : jsx().jsxs("div", { children: [jsx().jsx("strong", { children: "MIME type" }), " ", block.resource.mimeType] }),
        annotation == null ? null : jsx().jsxs("div", { children: [jsx().jsx("strong", { children: "Annotations" }), " ", annotation] }),
        content === "" ? null : jsx().jsxs("div", { children: [jsx().jsx("strong", { children: "Content" }), jsx().jsx("pre", { children: content })] }),
      ] });
    }
    case "unknown": return jsx().jsx("pre", { children: safeStringify(block.raw) });
    case "text": {
      const content = [block.text, annotationLine(block.annotations)].filter(value => value != null).join("\n");
      return jsx().jsxs("div", { children: [jsx().jsx("div", { children: "plaintext" }), jsx().jsx("pre", { children: content })] });
    }
  }
}

function resolvePluginLogo({ pluginId, plugins, serverName }: { pluginId?: string | null; plugins: Array<{ composerIconPath?: string; logoPath?: string; plugin: { id: string; name?: string } }>; serverName?: string | null }): { alt: string; logoUrl?: string } | null { if (!pluginId || serverName === "codex_apps") return null; const plugin = plugins.find(candidate => candidate.plugin.id === pluginId); return plugin == null ? null : { alt: plugin.plugin.name ?? plugin.plugin.id, logoUrl: plugin.composerIconPath ?? plugin.logoPath }; }
function RemoteToolLogo({ fallback, item }: { fallback?: unknown; hostId?: string; item: ToolItem; loadRemoteLogos?: boolean }): unknown { return jsx().jsx("span", { "aria-label": item.invocation.server ?? "tool", children: fallback ?? "◈" }); }
interface AutomationSummary { id: string; isEnabled?: boolean; nextRunAt?: string | null; scheduleLabel?: string | null; title: string }
function AutomationItem({ automation, onOpen }: { automation: AutomationSummary; onOpen?(id: string): void }): unknown {
  const scope = (sharedChunk as any).LX?.((sharedChunk as any).ZI);
  return jsx().jsxs("button", { type: "button", onClick: () => {
    if (onOpen != null) onOpen(automation.id);
    else if (scope != null) openAutomationSidePanelTab({ scope, automationId: automation.id, title: automation.title });
  }, children: [automation.title, automation.scheduleLabel ? ` · ${automation.scheduleLabel}` : "", automation.isEnabled === false ? " · Disabled" : ""] });
}
function AutomationList({ automations, conversationId, onOpen }: { automations: AutomationSummary[]; conversationId?: string; onOpen?(id: string): void }): unknown {
  return jsx().jsxs("section", { "aria-label": "Scheduled tasks", children: [conversationId == null || automations.length === 0 ? null : jsx().jsx(TrackTaskView, { conversationId }), automations.slice(0, 5).map(item => jsx().jsx(AutomationItem, { automation: item, onOpen }, item.id))] });
}

function ResultContent({ businessFailed, hideTextBlocksWithStructuredContent, result }: { businessFailed: boolean; hideTextBlocksWithStructuredContent?: boolean; result: ToolResult }): unknown {
  if (result.type === "error" || businessFailed) return jsx().jsx("pre", { children: result.error ?? "Tool failed" });
  let structured = result.structuredContent == null ? null : safeStringify(result.structuredContent);
  let content = result.structuredContent != null && hideTextBlocksWithStructuredContent
    ? result.content?.filter(block => block.type !== "text")
    : result.content;
  const singleJsonText = structuredTextContent(content);
  if (singleJsonText != null && (structured == null || singleJsonText === structured)) {
    content = [];
    structured ??= singleJsonText;
  }
  const renderedContent = content?.length ? content.map((block, index) => jsx().jsx(ContentBlock, { block }, index)) : [];
  if (structured != null) return jsx().jsxs("div", { children: [...renderedContent, jsx().jsx("pre", { children: structured }, "structured-content")] });
  if (renderedContent.length) return jsx().jsx("div", { children: renderedContent });
  if (result.raw != null) return jsx().jsx("pre", { children: typeof result.raw === "string" ? result.raw : safeStringify(result.raw) });
  return null;
}
function ToolItemContent(props: ToolItemContentProps): unknown {
  const item = props.item;
  const completed = item.completed === true;
  const intl = useIntl() as IntlShape;
  const businessFailed = item.result != null && typeof (initialChunk as any).uXt === "function"
    ? Boolean((initialChunk as any).uXt({ result: item.result, isCodexAppsServer: item.invocation.server === "codex_apps" }))
    : item.result?.type === "error";
  const label = props.summary ?? formatToolActivityLabel({ appContext: item.appContext, completed, intl, matchingApp: props.matchingApp, serverName: item.invocation.server, source: item.source, toolArguments: item.invocation.arguments, toolName: item.invocation.tool, toolResult: item.result });
  const status = businessFailed ? "error" : completed ? "success" : "active";
  return jsx().jsxs("section", { "aria-label": label, "data-tool-status": status, children: [
    jsx().jsxs("header", { children: [jsx().jsx(RemoteToolLogo, { fallback: props.summaryIcon, hostId: props.hostId, item, loadRemoteLogos: props.loadRemoteLogos }), jsx().jsx("strong", { children: label })] }),
    props.expandedContentOnly ? null : jsx().jsx("button", { type: "button", onClick: props.onExpand, children: "Details" }),
    item.result == null ? null : jsx().jsx(ResultContent, { businessFailed, hideTextBlocksWithStructuredContent: props.hideTextBlocksWithStructuredContent, result: item.result }),
  ] });
}
function TrackTaskView(_props?: { conversationId?: string }): null { return null; }
function initializeTrackTaskView(): void { void jsx(); }
function initializeResolvePluginLogo(): void {}
function initializePluginLogoRuntime(): void { void jsx(); }
function initializeAutomationItem(): void { initializeOpenAutomationSidePanelTab(); void jsx(); }
function initializeAutomationList(): void { initializeAutomationItem(); initializeTrackTaskView(); void jsx(); }
function initializeRemoteToolLogo(): void { void jsx(); }
function initializeToolItemContent(): void {
  for (const dependency of [(sharedChunk as any).$3, (sharedChunk as any).FX, (sharedChunk as any).h4,
    (sharedChunk as any).K2, (sharedChunk as any).QI, (sharedChunk as any).Zh]) {
    if (typeof dependency === "function") dependency();
  }
  initializeMcpToolActivityLabels();
  initializeToolActivityDisclosure();
  initializeRemoteToolLogo();
  initializeAutomationList();
  void jsx();
}
export { TrackTaskView as a, initializeAutomationItem as c, resolvePluginLogo as d, initializePluginLogoRuntime as f, initializeAutomationList as i, RemoteToolLogo as l, initializeToolItemContent as n, initializeTrackTaskView as o, AutomationList as r, AutomationItem as s, ToolItemContent as t, initializeRemoteToolLogo as u };
