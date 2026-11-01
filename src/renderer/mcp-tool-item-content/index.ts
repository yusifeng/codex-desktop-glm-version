import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, n4 as useIntl, type JsxRuntime } from "@rchunk/app-shared";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as chatgptTasksRuntime from "@rchunk/chatgpt-tasks-runtime";
import "@rchunk/computer-use-native-app-metadata";
import { i as initializeMcpToolActivityLabels, t as formatToolActivityLabel } from "@rchunk/mcp-tool-activity-label";
import { n as openAutomationSidePanelTab, t as initializeOpenAutomationSidePanelTab } from "@rchunk/open-automation-side-panel-tab";
import "@rchunk/presentation";
import { n as initializeToolActivityDisclosure, t as ToolActivityDisclosure } from "@rchunk/tool-activity-disclosure";
import { n as initializeWebMcpToolCalls, t as webMcpCallsFromMetadata } from "@rchunk/webmcp-tool-calls";

interface ContentAnnotations { audience?: string[]; lastModified?: string; priority?: number }
type McpContentBlock =
  | { annotations?: ContentAnnotations; data: string; mimeType: string; type: "audio" | "image" }
  | { annotations?: ContentAnnotations; name?: string; title?: string; type: "resource_link"; uri: string }
  | { resource: { annotations?: ContentAnnotations; blob?: string; mimeType?: string; text?: string; uri: string }; type: "embedded_resource" }
  | { annotations?: ContentAnnotations; text: string; type: "text" }
  | { raw: unknown; type: "unknown" };
interface ToolResult { content?: McpContentBlock[]; error?: string; raw?: unknown; structuredContent?: unknown; type: "error" | "success" }
interface WebMcpCall { description?: string; inputJson?: string; inputTruncated?: true; kind: "invokeTool" | "listTools"; name: string; outputJson?: string; outputTruncated?: true; readOnlyHint?: boolean; sourceHostname?: string; title?: string }
interface ToolItem {
  appContext?: { actionName?: string; appName?: string; connectorId: string } | null;
  automaticApprovalReviews?: unknown[];
  callId: string;
  completed?: boolean;
  durationMs?: number;
  invocation: { arguments?: unknown; server?: string | null; tool: string };
  invocationResourceUri?: string | null;
  isMcpAppWidgetSuperseded?: boolean;
  mcpAppUi?: { preferredModelDisplayMode?: string | null } | null;
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
  widgetStatePersistence?: unknown;
  widgetOnly?: boolean;
}
interface IntlShape { formatMessage(descriptor: { defaultMessage: string; description?: string; id?: string }, values?: Record<string, unknown>): string }
interface McpAppResource {
  blob?: string;
  heightHint?: number | null;
  html?: string;
  mimeType?: string;
  minFrameHeight?: number | null;
  prefersBorder?: boolean;
  text?: string;
  uri: string;
}
interface McpAppCatalogEntry { connectorId?: string | null; kind?: string; resourceUri?: string | null; uri?: string | null }
interface McpAppRuntimeState {
  appId: string;
  catalogError: unknown;
  catalogPending: boolean;
  presentation: "fallback" | "inline" | "launcher" | "pending";
  refetch(): void;
  renderData: unknown;
  resource: McpAppResource | null;
  resourceError: unknown;
  resourcePending: boolean;
  resourceUri: string | null;
}

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
function record(value: unknown): Record<string, unknown> | null { return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function resultMetadata(result?: ToolResult | null): Record<string, unknown> | null {
  const raw = record(result?.raw);
  return record(raw?._meta) ?? record(record(result?.structuredContent)?._meta);
}
function mcpAppResourceUri(item: ToolItem): string | null {
  if (item.invocationResourceUri?.trim()) return item.invocationResourceUri.trim();
  const metadata = resultMetadata(item.result);
  for (const key of ["openai/outputTemplate", "ui/resourceUri", "mcp/resourceUri", "resourceUri"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
function browserPageUrl(item: ToolItem): string | null {
  const metadata = resultMetadata(item.result);
  for (const key of ["openai/pageUrl", "pageUrl", "sourceUrl"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  }
  return null;
}

function optionalCall<T>(candidate: unknown, ...args: unknown[]): T | undefined {
  return typeof candidate === "function" ? (candidate as (...values: unknown[]) => T)(...args) : undefined;
}
function queryValue<T>(descriptor: unknown, input: unknown, options?: unknown): { data?: T; error?: unknown; isFetching?: boolean; isPending?: boolean } {
  const useQuery = (sharedChunk as any).BX;
  if (typeof useQuery !== "function" || descriptor == null) return {};
  try { return useQuery(descriptor, input, options) ?? {}; } catch { return {}; }
}
function signalValue<T>(descriptor: unknown, input: unknown, options?: unknown): T | undefined {
  const useSignal = (sharedChunk as any).BX;
  if (typeof useSignal !== "function" || descriptor == null) return undefined;
  try { return useSignal(descriptor, input, options) as T; } catch { return undefined; }
}
function resourceFromResult(result: ToolResult | null | undefined, uri: string): McpAppResource | null {
  for (const block of result?.content ?? []) {
    if (block.type !== "embedded_resource" || block.resource.uri !== uri) continue;
    return { uri, mimeType: block.resource.mimeType, text: block.resource.text, blob: block.resource.blob };
  }
  return null;
}
function normalizeResource(value: unknown, fallbackUri: string): McpAppResource | null {
  const source = record(value);
  if (source == null) return null;
  const resource = record(source.resource) ?? source;
  const uri = typeof resource.uri === "string" ? resource.uri : fallbackUri;
  const text = typeof resource.text === "string" ? resource.text : undefined;
  const blob = typeof resource.blob === "string" ? resource.blob : undefined;
  const mimeType = typeof resource.mimeType === "string" ? resource.mimeType : undefined;
  const html = typeof source.html === "string" ? source.html : mimeType?.includes("html") ? text : undefined;
  return {
    uri, text, blob, mimeType, html,
    heightHint: typeof source.heightHint === "number" ? source.heightHint : null,
    minFrameHeight: typeof source.minFrameHeight === "number" ? source.minFrameHeight : null,
    prefersBorder: typeof source.prefersBorder === "boolean" ? source.prefersBorder : undefined,
  };
}
function catalogResource(data: unknown, item: ToolItem, descriptorOnly: boolean, catalogPending: boolean, registeredResourceUri: string | null, toolResult: unknown): { isPending: boolean; resourceUri: string | null } {
  const exactResolver = (initialChunk as any).aXt;
  if (typeof exactResolver === "function") {
    try {
      const resolved = exactResolver({
        item,
        mcpServerStatuses: data,
        descriptorOnly,
        toolResult,
        isCatalogPending: catalogPending,
        registeredResourceUri,
      });
      if (resolved != null) return {
        isPending: resolved.isPending === true,
        resourceUri: typeof resolved.resourceUri === "string" ? resolved.resourceUri : null,
      };
    } catch { /* fall through to the recovered semantic resolver */ }
  }
  const direct = mcpAppResourceUri(item);
  if (direct != null) return { isPending: false, resourceUri: direct };
  const entries = Array.isArray(data) ? data : Array.isArray(record(data)?.resources) ? record(data)!.resources as unknown[] : [];
  const server = item.invocation.server;
  const tool = item.invocation.tool;
  for (const value of entries) {
    const entry = record(value) as McpAppCatalogEntry | null;
    if (entry == null) continue;
    const entryRecord = value as Record<string, unknown>;
    if (entryRecord.server != null && entryRecord.server !== server) continue;
    if (entryRecord.tool != null && entryRecord.tool !== tool) continue;
    const uri = entry.resourceUri ?? entry.uri;
    if (typeof uri === "string" && uri.trim()) return { isPending: false, resourceUri: uri.trim() };
  }
  return { isPending: catalogPending, resourceUri: null };
}
function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  const object = record(value);
  return typeof object?.message === "string" ? object.message : typeof value === "string" ? value : "Unable to load app";
}
function resourceValidation(resource: McpAppResource | null, renderData: unknown): "error" | "ok" | "too-large" {
  if (resource == null) return "ok";
  const exactValidation = optionalCall<{ kind?: string }>((initialChunk as any).Ect, { data: renderData, error: null, isLoading: false }, (initialChunk as any).Cct ?? ["inline", "fullscreen", "pip"]);
  if (exactValidation?.kind === "too-large" || exactValidation?.kind === "error") return exactValidation.kind;
  const payload = resource.html ?? resource.text ?? resource.blob ?? "";
  return payload.length > 1_000_000 ? "too-large" : "ok";
}

function useMcpAppRuntime(item: ToolItem, props: ToolItemContentProps, enabled: boolean): McpAppRuntimeState {
  const appId = optionalCall<string>((sharedChunk as any).eU, item.callId) ?? item.callId;
  const registered = signalValue<Record<string, any>>((initialChunk as any).act, appId);
  const registeredResourceUri = typeof registered?.content?.mcpAppScope?.originResourceUri === "string"
    ? registered.content.mcpAppScope.originResourceUri
    : null;
  const liveToolResult = item.result?.raw ?? registered?.content?.toolResult ?? null;
  const threadId = signalValue<string>((initialChunk as any).NU, { hostId: props.hostId, conversationId: props.conversationId });
  const queryInput = {
    appContext: item.appContext,
    hostId: props.hostId,
    invocationResourceUri: item.invocationResourceUri,
    server: item.invocation.server,
    threadId: threadId ?? item.threadId ?? props.conversationId,
    tool: item.invocation.tool,
  };
  const catalog = queryValue<unknown>((initialChunk as any).PU, queryInput, { enabled });
  const target = signalValue<McpAppCatalogEntry>((initialChunk as any).FU, queryInput, { enabled });
  const resolvedResource = enabled
    ? catalogResource(catalog.data, item, props.conversationId?.startsWith("chatgpt:") === true, catalog.isPending === true || catalog.isFetching === true, registeredResourceUri, liveToolResult)
    : { isPending: false, resourceUri: null };
  const resourceUri = resolvedResource.resourceUri;
  const exactResourceHook = (initialChunk as any).LU;
  let resourceQuery: { data?: unknown; error?: unknown; isFetching?: boolean; isPending?: boolean; refetch?: (options?: unknown) => unknown } = {};
  if (typeof exactResourceHook === "function") {
    try {
      resourceQuery = exactResourceHook({
        connectorId: target?.connectorId ?? null,
        connectorTarget: target?.kind === "target" ? target : null,
        hostId: props.hostId,
        originCallId: item.invocation.server === "codex_apps" && item.appContext != null ? item.callId : null,
        server: item.invocation.server, threadId: props.conversationId,
        uri: resourceUri,
        enabled: enabled && resourceUri != null && !resolvedResource.isPending
          && !(item.completed === true && item.result == null && liveToolResult == null)
          && (item.invocation.server !== "codex_apps" || item.appContext == null || item.completed === true),
      }) ?? {};
    } catch { resourceQuery = {}; }
  }
  const embedded = resourceUri == null ? null : resourceFromResult(item.result, resourceUri);
  const queriedResource = record(resourceQuery.data)?.resource ?? resourceQuery.data;
  const parsedResource = optionalCall<unknown>((initialChunk as any).EU, queriedResource);
  const resource = resourceUri == null ? null : normalizeResource(resourceQuery.data, resourceUri) ?? embedded;
  const renderData = parsedResource ?? resource;
  let presentation: McpAppRuntimeState["presentation"] = "fallback";
  if (resourceUri != null && (resolvedResource.isPending || resourceQuery.isPending || resourceQuery.isFetching) && resource == null) presentation = "pending";
  else if (resourceUri != null && resource != null) {
    const exactMode = optionalCall<{ kind?: string }>((initialChunk as any).TU, {
      hasResourceError: resourceQuery.error != null,
      isResourceLoading: false,
      isDilEnabled: false,
      renderData,
      resourceUri,
      shouldRenderMcpApp: enabled,
    });
    const kind = exactMode?.kind;
    presentation = kind === "launcher" || kind === "inline" || kind === "pending" ? kind : "inline";
  } else if (resourceUri != null && resourceQuery.error == null && catalog.error == null) presentation = "launcher";
  return {
    appId,
    catalogError: catalog.error,
    catalogPending: catalog.isPending === true || catalog.isFetching === true,
    presentation,
    refetch: () => { resourceQuery.refetch?.({ cancelRefetch: false }); },
    renderData,
    resource,
    resourceError: resourceQuery.error,
    resourcePending: resourceQuery.isPending === true || resourceQuery.isFetching === true,
    resourceUri,
  };
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

function AutomaticApprovalReviews({ reviews }: { reviews: unknown[] }): unknown {
  return jsx().jsx("aside", { "data-automatic-approval-reviews": true, children: reviews.map((review, index) => jsx().jsx("pre", { children: typeof review === "string" ? review : safeStringify(review) }, index)) });
}
function WebMcpOutput({ call, fallbackPageUrl }: { call: WebMcpCall; fallbackPageUrl: string | null }): unknown {
  const sourceUrl = call.sourceHostname == null ? fallbackPageUrl : `https://${call.sourceHostname}`;
  const title = call.kind === "listTools" ? "Listed website tools" : call.title ?? sentenceLabel(call.name);
  const details = safeStringify({ name: call.name, title: call.title, description: call.description, website: call.sourceHostname, readOnlyHint: call.readOnlyHint, input: call.inputJson, inputTruncated: call.inputTruncated });
  return jsx().jsxs("section", { "data-webmcp-call": call.kind, children: [
    jsx().jsxs("header", { children: [sourceUrl == null ? null : jsx().jsx("a", { href: sourceUrl, children: sourceUrl }), jsx().jsx("strong", { children: title })] }),
    jsx().jsx("pre", { children: details }),
    call.outputJson == null ? null : jsx().jsx("pre", { children: call.outputJson }),
  ] });
}
function sentenceLabel(value: string): string { const text = value.replace(/[_-]+/g, " ").trim(); return text ? text[0].toUpperCase() + text.slice(1) : "Tool"; }
function McpAppWidget({ appName, state }: { appName: string; state: McpAppRuntimeState }): unknown {
  const resource = state.resource;
  const payload = resource?.html ?? resource?.text ?? (resource?.blob == null ? null : `data:${resource.mimeType ?? "text/html"};base64,${resource.blob}`);
  const exactRenderer = (initialChunk as any).WH;
  if (typeof exactRenderer === "function") {
    return jsx().jsx(exactRenderer, {
      hostDisplayModes: ["inline", "fullscreen", "pip"],
      inlineSurface: state.presentation === "inline" ? "card" : "standalone",
      mcpAppId: state.appId,
      onRetryResourceRead: state.refetch,
      pluginName: appName,
      presentation: state.presentation,
      resource: { data: state.renderData, error: state.resourceError, isLoading: state.resourcePending },
      showLoadingStatus: false,
    });
  }
  void payload;
  return null;
}
function McpAppSurface({ appName, expanded, loading, onOpen, state }: { appName: string; expanded: boolean; loading: boolean; onOpen(): void; state: McpAppRuntimeState }): unknown {
  const error = state.resourceError ?? state.catalogError;
  const validation = resourceValidation(state.resource, state.renderData);
  const pending = loading || state.catalogPending || state.resourcePending || state.presentation === "pending";
  const lifecycle = typeof (initialChunk as any).IH === "function"
    ? jsx().jsx((initialChunk as any).IH, { isInlineRequested: expanded && state.presentation === "inline", mcpAppId: state.appId })
    : null;
  let body: unknown = null;
  if (pending) body = jsx().jsx("div", { role: "status", "data-mcp-app-pending": true, children: `Opening ${appName}` });
  else if (expanded && error != null) body = jsx().jsxs("div", { role: "alert", "data-mcp-app-error": true, children: [errorMessage(error), jsx().jsx("button", { type: "button", onClick: state.refetch, children: "Retry" })] });
  else if (expanded && validation === "too-large") body = jsx().jsx("div", { role: "alert", "data-mcp-app-too-large": true, children: "This app is too large to display." });
  else if (expanded && validation === "error") body = jsx().jsxs("div", { role: "alert", "data-mcp-app-error": true, children: ["Unable to display this app.", jsx().jsx("button", { type: "button", onClick: state.refetch, children: "Retry" })] });
  else if ((expanded || state.presentation === "launcher") && state.resource != null) body = jsx().jsx("div", { "data-mcp-app-widget": true, children: jsx().jsx(McpAppWidget, { appName, state }) });
  else if (expanded) body = jsx().jsxs("div", { role: "alert", "data-mcp-app-error": true, children: ["App resource is unavailable.", jsx().jsx("button", { type: "button", onClick: state.refetch, children: "Retry" })] });
  return jsx().jsxs("section", {
    "data-mcp-app-card": state.presentation === "inline" || undefined,
    "data-mcp-app-presentation": state.presentation,
    "data-mcp-app-resource-uri": state.resourceUri,
    "data-mcp-app-state": pending ? "pending" : expanded ? "open" : "launcher",
    children: [lifecycle, jsx().jsx("button", { type: "button", "aria-expanded": expanded, onClick: onOpen, children: pending ? `Opening ${appName}` : expanded ? appName : `Open ${appName}` }), body],
  });
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
  const canRenderMcpApp = props.renderMcpApps !== false && item.isMcpAppWidgetSuperseded !== true && !businessFailed;
  const appRuntime = useMcpAppRuntime(item, props, canRenderMcpApp);
  const resourceUri = appRuntime.resourceUri;
  const react = (sharedChunk as any).e6?.();
  const [expanded, setExpanded] = react?.useState?.(props.shouldAutoExpandMcpApp === true) ?? [props.shouldAutoExpandMcpApp === true, () => undefined];
  const [opening, setOpening] = react?.useState?.(false) ?? [false, () => undefined];
  const recipient = typeof (sharedChunk as any).LX === "function" ? (sharedChunk as any).LX((initialChunk as any).kht) : null;
  const toggle = (): void => { if (!expanded) props.onExpand?.(); setOpening(true); setExpanded(!expanded); setOpening(false); };
  const raw = record(item.result?.raw);
  const metadata = resultMetadata(item.result);
  const webCalls = item.source?.kind === "browserUse" ? webMcpCallsFromMetadata(metadata ?? raw?._meta) as WebMcpCall[] : [];
  const resultBody = item.result == null ? null : jsx().jsx(ResultContent, { businessFailed, hideTextBlocksWithStructuredContent: props.hideTextBlocksWithStructuredContent, result: item.result });
  const reviews = item.automaticApprovalReviews?.length ? jsx().jsx(AutomaticApprovalReviews, { reviews: item.automaticApprovalReviews }) : null;
  const appName = props.matchingApp?.name ?? item.appContext?.appName ?? item.invocation.server ?? "app";
  if (props.widgetOnly === true) {
    const PersistentWidget = (sharedChunk as any).Xf;
    if (resourceUri == null || typeof PersistentWidget !== "function") return null;
    const toolResult = item.result?.raw ?? (item.result?.type === "error"
      ? { content: [{ type: "text", text: item.result.error }], structuredContent: { error: item.result.error } }
      : item.result);
    return jsx().jsx(PersistentWidget, {
      conversationId: props.conversationId,
      hostDisplayModes: (initialChunk as any).Cct ?? ["inline", "fullscreen", "pip"],
      hostId: props.hostId,
      hostedInThreadScrollLayout: true,
      legacyPreferredDisplayMode: item.mcpAppUi?.preferredModelDisplayMode,
      lifetime: "thread",
      mcpAppId: appRuntime.appId,
      mcpAppScope: {
        appContext: item.appContext,
        invocationResourceUri: item.invocationResourceUri,
        originCallId: item.invocation.server === "codex_apps" && item.appContext != null ? item.callId : null,
        originResourceUri: resourceUri,
        originTool: item.invocation.tool,
      },
      openOnRegistration: props.shouldAutoExpandMcpApp === true,
      recipient,
      resource: { data: appRuntime.renderData, error: appRuntime.resourceError, isLoading: appRuntime.resourcePending || appRuntime.catalogPending },
      resourceIdentity: null,
      resourceUri,
      server: item.invocation.server,
      title: `${item.invocation.server ?? "MCP"} ${item.invocation.tool}`,
      toolArguments: item.invocation.arguments,
      toolResult,
      widgetStatePersistence: props.widgetStatePersistence,
    });
  }
  const appSurface = resourceUri == null ? null : jsx().jsx(McpAppSurface, { appName, expanded, loading: opening, state: appRuntime, onOpen: toggle });
  const appValidation = resourceValidation(appRuntime.resource, appRuntime.renderData);
  const canDisplayApp = resourceUri != null
    && appRuntime.resourceError == null
    && appRuntime.catalogError == null
    && appValidation === "ok"
    && (appRuntime.resource != null || appRuntime.resourcePending || appRuntime.catalogPending)
    && typeof (initialChunk as any).WH === "function";
  const details = canDisplayApp ? appSurface : resultBody;
  const disclosure = props.expandedContentOnly ? details : jsx().jsx(ToolActivityDisclosure as any, { defaultExpanded: completed === false, icon: jsx().jsx(RemoteToolLogo, { fallback: props.summaryIcon, hostId: props.hostId, item, loadRemoteLogos: props.loadRemoteLogos }), status: status === "active" ? "running" : status === "error" ? "error" : "complete", summary: label, onExpand: props.onExpand, children: jsx().jsxs(jsx().Fragment, { children: [reviews, details] }) });
  return jsx().jsxs(jsx().Fragment, { children: [
    jsx().jsx("div", { "aria-label": label, "data-tool-status": status, "data-tool-activity-turn-key": props.toolActivityTurnKey, children: disclosure }),
    ...webCalls.map((call, index) => jsx().jsx(WebMcpOutput, { call, fallbackPageUrl: browserPageUrl(item) }, `${item.callId}:webmcp:${index}:${call.name}`)),
  ] });
}
let trackTaskViewedSignal: unknown;
function TrackTaskView(props: { conversationId?: string }): null {
  const taskOpenDestinations = (chatgptTasksRuntime as any).a ?? {};
  const taskEvent = (chatgptTasksRuntime as any).n;
  const taskEventTypes = (chatgptTasksRuntime as any).r ?? {};
  const react = (sharedChunk as any).e6?.();
  const scope = typeof (sharedChunk as any).LX === "function"
    ? (sharedChunk as any).LX((initialChunk as any).$en)
    : null;
  const route = typeof (initialChunk as any).i_n === "function"
    ? (initialChunk as any).i_n()
    : null;
  react?.useEffect?.(() => {
    if (
      props.conversationId == null
      || scope?.value?.routeKind !== "chatgpt-thread"
      || typeof scope.watch !== "function"
    ) return;
    const currentConversationId = scope.value.conversationId;
    return scope.watch((state: any) => {
      const taskConversationId = state.get?.((initialChunk as any).wVt, props.conversationId);
      if (
        taskConversationId == null
        || taskConversationId !== state.get?.((initialChunk as any).wVt, currentConversationId)
      ) return;
      const identity = { conversationId: taskConversationId, locationKey: route?.key };
      if (trackTaskViewedSignal != null && state.get?.(trackTaskViewedSignal, identity)) return;
      if (trackTaskViewedSignal != null) state.set?.(trackTaskViewedSignal, identity, true);
      const submitTaskEvent = (initialChunk as any).xpn;
      if (typeof submitTaskEvent === "function") {
        submitTaskEvent(scope, taskEvent, {
          conversationId: taskConversationId,
          eventKind: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_CONVERSATION_WITH_TASK_VIEWED,
          openDestination: taskOpenDestinations.CHATGPT_TASKS_OPEN_DESTINATION_CONVERSATION,
        });
      }
    });
  }, [props.conversationId, route?.key, scope]);
  return null;
}
function initializeTrackTaskView(): void {
  (chatgptTasksRuntime as any).s?.();
  for (const initializer of [
    (sharedChunk as any).$3,
    (sharedChunk as any).V4,
    (sharedChunk as any).K2,
    (sharedChunk as any).gL,
    (initialChunk as any).Qgn,
    (initialChunk as any).ypn,
    (initialChunk as any).itn,
    (initialChunk as any).uHt,
  ]) if (typeof initializer === "function") initializer();
  if (trackTaskViewedSignal == null && typeof (sharedChunk as any).rZ === "function") {
    trackTaskViewedSignal = (sharedChunk as any).rZ((initialChunk as any).$en, () => false);
  }
  void jsx();
}
function initializeResolvePluginLogo(): void {}
function initializePluginLogoRuntime(): void { void jsx(); }
function initializeAutomationItem(): void { initializeOpenAutomationSidePanelTab(); void jsx(); }
function initializeAutomationList(): void { initializeAutomationItem(); initializeTrackTaskView(); void jsx(); }
function initializeRemoteToolLogo(): void { void jsx(); }
let toolItemContentInitialized = false;
function initializeToolItemContent(): void {
  if (toolItemContentInitialized) return;
  toolItemContentInitialized = true;
  for (const dependency of [
    (sharedChunk as any).$3, (sharedChunk as any).Wi, (sharedChunk as any).cT, (sharedChunk as any).ww,
    (sharedChunk as any).ai, (sharedChunk as any).gL, (sharedChunk as any).h4, (sharedChunk as any).a$,
    (sharedChunk as any).FX, (sharedChunk as any).wL, (initialChunk as any).Vrn, (sharedChunk as any).e6,
    (sharedChunk as any).K2, (initialChunk as any).pXt, (initialChunk as any).en, (initialChunk as any).oqt,
    (initialChunk as any).h1, (initialChunk as any).Olt, (sharedChunk as any).Zh, (sharedChunk as any).ef,
    (sharedChunk as any).Of, (sharedChunk as any).zh, (sharedChunk as any).Ph, (initialChunk as any).n0,
    (sharedChunk as any).C_, (initialChunk as any).Gat, (sharedChunk as any).sm, (sharedChunk as any).c_,
    (initialChunk as any).T6t, (sharedChunk as any).Bg, (initialChunk as any).QB, (initialChunk as any).kU,
    (initialChunk as any).qH, (initialChunk as any).DU, (initialChunk as any).GH, (initialChunk as any).Oct,
    (initialChunk as any).ict, (initialChunk as any).i4t, (initialChunk as any).E4t, (initialChunk as any).IU,
    (initialChunk as any).$2t, (initialChunk as any).Rht, (initialChunk as any).itn, (initialChunk as any).ifn,
    (sharedChunk as any).tp, (sharedChunk as any).Z3, (initialChunk as any).aat, (initialChunk as any).MU,
    (initialChunk as any).Zdt, (initialChunk as any).wrn, (initialChunk as any).jit, (initialChunk as any).kit,
    (initialChunk as any).lXt, (initialChunk as any).Vat, (initialChunk as any).Dit, (initialChunk as any).Fit,
    (initialChunk as any).Nit, (sharedChunk as any).QI,
  ]) {
    if (typeof dependency === "function") dependency();
  }
  initializeMcpToolActivityLabels();
  initializeToolActivityDisclosure();
  initializeWebMcpToolCalls();
  initializeRemoteToolLogo();
  initializeAutomationList();
  void jsx();
}
export { TrackTaskView as a, initializeAutomationItem as c, resolvePluginLogo as d, initializePluginLogoRuntime as f, initializeAutomationList as i, RemoteToolLogo as l, initializeToolItemContent as n, initializeTrackTaskView as o, AutomationList as r, AutomationItem as s, ToolItemContent as t, initializeRemoteToolLogo as u };
