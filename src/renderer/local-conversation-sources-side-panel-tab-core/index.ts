import "@rchunk/rolldown-runtime";
import {
  $d as CodeBlock,
  A_ as GlobeIcon,
  HF as analyticsClient,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  LX as useScope,
  S_ as IconAsset,
  UF as sourceSectionType,
  Y2 as FormattedMessage,
  fI as initializeIntlRuntime,
  n4 as useIntl,
  qT as externalLinkAsset,
} from "@rchunk/app-shared";
import {
  $en as routeScope,
  Dlt as AppLogo,
  G3 as hostMessageBridge,
  Oft as openExternalLink,
  W3 as DefaultAppIcon,
  bS as sourcePanelComponents,
  mmn as attachmentKey,
  n0 as initializeFavicon,
  t0 as Favicon,
  tn as webMcpEnabledSignal,
  xpn as logSourcesPanelExpansion,
} from "@rchunk/app-initial";
import { n as initializeFilePreviewIcon, t as ArtifactFilePreviewIcon } from "@rchunk/artifact-file-preview-icon";
import {
  i as initializeWebMcpToolsModel,
  r as groupWebMcpCallsByTool,
  t as hostnameFromUrl,
} from "@rchunk/local-conversation-webmcp-tools-model";
import {
  i as initializeExternalResourceIcon,
  n as initializeKnownAppIcon,
  r as knownAppIdForToolSource,
  t as ExternalResourceIcon,
} from "@rchunk/local-conversation-external-resource-icon";
import { n as useLocalConversationSources, t as initializeLocalConversationSources } from "@rchunk/use-local-conversation-sources";
import { n as initializeToolActivityDisclosure, t as ToolActivityDisclosure } from "@rchunk/tool-activity-disclosure";
import { n as initializeMcpToolItemContent, t as McpToolItemContent } from "@rchunk/mcp-tool-item-content";

interface WebMcpCall extends Record<string, unknown> {
  inputJson?: string | null;
  inputTruncated?: boolean;
  kind: string;
  outputJson?: string | null;
  outputTruncated?: boolean;
  sourceHostname?: string | null;
}

interface WebMcpCallGroup { calls: WebMcpCall[]; name: string; }
interface FileSource extends Record<string, unknown> { fsPath?: string; label: string; path?: string; }
interface ExternalSource extends Record<string, unknown> {
  activities: Array<"created" | "provided" | "read" | "updated">;
  key: string;
  openInitiator?: string;
  provider?: { name: string } | null;
  title: string;
  url: string;
}
interface McpCall extends Record<string, unknown> { callId: string; }
interface ToolActivity { calls: McpCall[]; label: string; }
interface ToolSource extends Record<string, unknown> {
  activities: ToolActivity[];
  id: string;
  logoUrl?: string;
  logoUrlDark?: string;
  mcpAppId?: string | null;
  name: string;
  pluginDisplayNames: string[];
  trustedAnalyticsAppName?: string;
}
interface WebSearchSource {
  queryCount: number;
  queries: string[];
  viewedLinks: Array<{ label: string; url: string }>;
}
interface SourceCollection {
  externalSources: ExternalSource[];
  fileSources: FileSource[];
  toolSources: ToolSource[];
  webMcpCalls: WebMcpCall[];
  webSearchSource?: WebSearchSource | null;
}
interface LocalConversationSourcesSidePanelTabProps {
  conversationId: string;
  getImagePreviewSrc?(path: string): string | null | undefined;
  hostId: string;
  onOpenFile?(source: FileSource): void;
  onOpenImage?(source: FileSource, previewSrc: string): void;
  onOpenMcpApp?(appId: string): void;
}
interface SourcesPanelRegistry {
  Body?: (props: { children?: unknown }) => unknown;
  Item?: (props: Record<string, unknown>) => unknown;
  SourceDetails: (props: Record<string, unknown>) => unknown;
  SourcesSidePanel: (props: { children?: unknown }) => unknown;
  SourcesSidePanelList: (props: { children?: unknown; label: string }) => unknown;
}

const SourcesUi = sourcePanelComponents as unknown as SourcesPanelRegistry;

function prettyJson(value: string): string {
  try { return JSON.stringify(JSON.parse(value), null, 2); }
  catch { return value; }
}

function callHasDetails(call: WebMcpCall): boolean {
  return (call.kind === "invokeTool" && call.inputJson != null) || call.outputJson != null;
}

function WebMcpCalls(props: { calls: WebMcpCall[] }): unknown {
  const runtime = getJsxRuntime();
  const groups = groupWebMcpCallsByTool(props.calls) as unknown as WebMcpCallGroup[];
  return runtime.jsx("ul", {
    className: "flex flex-col gap-1",
    children: groups.map((group) => {
      const detailedCalls = group.calls.filter(callHasDetails);
      return runtime.jsx("li", {
        children: runtime.jsx(ToolActivityDisclosure, {
          icon: null,
          indentContent: false,
          status: "completed",
          summary: runtime.jsx(FormattedMessage, {
            id: "codex.localConversation.sources.panel.toolUseCount",
            defaultMessage: "{name} {count, plural, one {once} other {# times}}",
            values: { count: group.calls.length, name: group.name },
          }),
          children: detailedCalls.length === 0 ? null : runtime.jsx("ul", {
            className: "flex flex-col gap-2",
            children: detailedCalls.map((call, index) => runtime.jsxs("li", {
              className: "flex min-w-0 flex-col gap-2",
              children: [
                call.kind !== "invokeTool" || call.inputJson == null ? null : runtime.jsx(CodeBlock, {
                  content: prettyJson(call.inputJson), language: "json",
                  title: call.inputTruncated ? "Input (truncated)" : "Input",
                }),
                call.outputJson == null ? null : runtime.jsx(CodeBlock, {
                  content: prettyJson(call.outputJson), language: "json",
                  title: call.outputTruncated ? "Result (truncated)" : "Result",
                }),
              ],
            }, `${group.name}:${index}`)),
          }),
        }),
      }, group.name);
    }),
  });
}

function ActivityLabel(props: { activity: ExternalSource["activities"][number] }): unknown {
  const messages = { created: "Created during the chat", provided: "Provided in the conversation", read: "Read during the chat", updated: "Updated during the chat" };
  return getJsxRuntime().jsx(FormattedMessage, {
    id: `codex.localConversation.sources.panel.activity.${props.activity}`,
    defaultMessage: messages[props.activity],
  });
}

function McpCallContent(props: {
  conversationId: string; expandedContentOnly?: boolean; hostId: string; item: McpCall;
  onExpand?(): void; summary?: unknown;
}): unknown {
  return getJsxRuntime().jsx(McpToolItemContent, {
    ...props,
    hideTextBlocksWithStructuredContent: true,
    loadRemoteLogos: false,
    renderMcpApps: false,
    summaryIcon: null,
  });
}

function sourceName(source: ToolSource): string {
  return source.name.trim() || source.pluginDisplayNames.join(", ");
}

function SourcesPanel(props: LocalConversationSourcesSidePanelTabProps & SourceCollection): unknown {
  const runtime = getJsxRuntime();
  const scope = useScope(routeScope);
  const intl = useIntl();
  const webMcpEnabled = useSignalValue(webMcpEnabledSignal);
  const webMcpCallsByHost = new Map<string, WebMcpCall[]>();
  if (webMcpEnabled) {
    for (const call of props.webMcpCalls) {
      if (call.sourceHostname == null) continue;
      const calls = webMcpCallsByHost.get(call.sourceHostname) ?? [];
      calls.push(call);
      webMcpCallsByHost.set(call.sourceHostname, calls);
    }
  }
  const files = props.fileSources.map((source) => {
    const path = source.fsPath || source.path || source.label;
    const previewSrc = props.getImagePreviewSrc?.(path) ?? null;
    const onOpen = previewSrc != null && props.onOpenImage != null
      ? () => props.onOpenImage?.(source, previewSrc)
      : props.onOpenFile == null ? undefined : () => props.onOpenFile?.(source);
    return runtime.jsx(SourcesUi.SourceDetails, {
      icon: runtime.jsx(ArtifactFilePreviewIcon, { getImagePreviewSrc: props.getImagePreviewSrc, iconClassName: "icon-sm", path }),
      label: source.label, meta: path, onOpen,
      children: runtime.jsx(FormattedMessage, { id: "codex.localConversation.sources.panel.fileAttached", defaultMessage: "Attached to the conversation" }),
    }, attachmentKey(source));
  });
  const external = props.externalSources.map((source) => {
    const hostname = hostnameFromUrl(source.url);
    const relatedCalls = hostname == null || source.title !== hostname ? [] : (webMcpCallsByHost.get(hostname) ?? []);
    if (hostname != null && source.title === hostname) webMcpCallsByHost.delete(hostname);
    return runtime.jsxs(SourcesUi.SourceDetails, {
      icon: runtime.jsx(ExternalResourceIcon, { resource: source }),
      label: source.title,
      meta: source.activities.includes("provided") ? undefined : source.provider == null ? source.url : `${source.provider.name} · ${source.url}`,
      onOpen: (event: unknown) => openExternalLink({ event, href: source.url, initiator: (source.openInitiator ?? "open_in_browser_bridge") as "open_in_browser_bridge" }),
      children: [runtime.jsx("ul", { children: source.activities.map((activity) => runtime.jsx("li", { children: runtime.jsx(ActivityLabel, { activity }) }, activity)) }), relatedCalls.length === 0 ? null : runtime.jsx(WebMcpCalls, { calls: relatedCalls })],
    }, source.key);
  });
  const unclaimedWebMcpCalls = Array.from(webMcpCallsByHost, ([hostname, calls]) => runtime.jsx(SourcesUi.SourceDetails, {
    icon: runtime.jsx(Favicon, { className: "icon-sm shrink-0", href: `https://${hostname}` }),
    label: hostname,
    children: runtime.jsx(WebMcpCalls, { calls }),
  }, hostname));
  const tools = props.toolSources.map((source) => runtime.jsx(SourcesUi.SourceDetails, {
    icon: runtime.jsx(AppLogo, { alt: "", fallback: runtime.jsx(DefaultAppIcon, {}), knownAppId: knownAppIdForToolSource(source), logoDarkUrl: source.logoUrlDark, logoUrl: source.logoUrl }),
    label: sourceName(source),
    onOpen: source.mcpAppId == null || props.onOpenMcpApp == null ? undefined : () => props.onOpenMcpApp?.(source.mcpAppId as string),
    children: runtime.jsx("ul", { children: source.activities.flatMap((activity) => {
      if (activity.calls.length === 0) return [];
      const summary = runtime.jsx(FormattedMessage, { id: "codex.localConversation.sources.panel.toolUseCount", defaultMessage: "{name} {count, plural, one {once} other {# times}}", values: { count: activity.calls.length, name: activity.label } });
      const onExpand = (): void => logSourcesPanelExpansion(scope, analyticsClient, { sectionType: sourceSectionType.CODEX_SOURCES_SECTION_TYPE_MCP_TOOL_CALLS, appName: source.trustedAnalyticsAppName, itemCount: activity.calls.length });
      if (activity.calls.length === 1) return activity.calls.map((call) => runtime.jsx("li", { children: runtime.jsx(McpCallContent, { conversationId: props.conversationId, hostId: props.hostId, item: call, onExpand, summary }) }, call.callId));
      return [runtime.jsx("li", { children: runtime.jsx(ToolActivityDisclosure, { icon: null, indentContent: false, onExpand, status: "completed", summary, children: runtime.jsx("ul", { children: activity.calls.map((call) => runtime.jsx("li", { children: runtime.jsx(McpCallContent, { conversationId: props.conversationId, expandedContentOnly: true, hostId: props.hostId, item: call }) }, call.callId)) }) }) }, activity.label)];
    }) }),
  }, source.id));
  const webSearch = props.webSearchSource == null ? null : runtime.jsx(SourcesUi.SourceDetails, {
    icon: runtime.jsx(GlobeIcon, { "aria-hidden": true, className: "icon-sm shrink-0" }),
    label: intl.formatMessage({ id: "codex.localConversation.sources.webSearch", defaultMessage: "Web search" }),
    children: runtime.jsxs("ul", { children: [
      props.webSearchSource.queryCount === 0 ? null : runtime.jsx("li", { children: runtime.jsx(ToolActivityDisclosure, { icon: null, indentContent: false, status: "completed", summary: `${props.webSearchSource.queryCount} searches`, children: runtime.jsx("ul", { children: props.webSearchSource.queries.map((query) => runtime.jsx("li", { children: query }, query)) }) }) }),
      props.webSearchSource.viewedLinks.length === 0 ? null : runtime.jsx("li", { children: runtime.jsx(ToolActivityDisclosure, { icon: null, indentContent: false, status: "completed", summary: `${props.webSearchSource.viewedLinks.length} opened pages`, children: runtime.jsx("ul", { children: props.webSearchSource.viewedLinks.map((link) => runtime.jsx("li", { children: runtime.jsxs("button", { title: link.url, type: "button", onClick: (event: unknown) => openExternalLink({ event, href: link.url, initiator: "open_in_browser_bridge" }), children: [runtime.jsx(IconAsset, { asset: externalLinkAsset }), link.label] }) }, link.url)) }) }) }),
    ] }),
  });
  const label = intl.formatMessage({ id: "codex.localConversation.sources.panel.listLabel", defaultMessage: "Sources" });
  return runtime.jsx(SourcesUi.SourcesSidePanel, { children: runtime.jsxs(SourcesUi.SourcesSidePanelList, { label, children: [files, external, unclaimedWebMcpCalls, tools, webSearch] }) });
}

function LocalConversationSourcesSidePanelTab(props: LocalConversationSourcesSidePanelTabProps): unknown {
  const sources = useLocalConversationSources(props.conversationId, props.hostId) as unknown as SourceCollection;
  return getJsxRuntime().jsx(SourcesPanel, { ...props, ...sources });
}

let initialized = false;
function initializeSourcesPanel(): void {
  if (initialized) return;
  initialized = true;
  initializeIntlRuntime(); initializeFilePreviewIcon(); initializeFavicon();
  initializeMcpToolItemContent(); initializeToolActivityDisclosure(); initializeKnownAppIcon();
  initializeExternalResourceIcon(); initializeWebMcpToolsModel(); initializeLocalConversationSources();
  void hostMessageBridge;
}

initializeSourcesPanel();
export { LocalConversationSourcesSidePanelTab };
