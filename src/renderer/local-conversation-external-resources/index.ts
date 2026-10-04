import "@rchunk/rolldown-runtime";
import {
  RH as parseMcpResourceMetadata,
  wL as initializeUtilities,
} from "@rchunk/app-shared";
import {
  Brn as formatMcpServerName,
  Drn as initializeMcpServerNames,
  Ern as findMatchingApp,
  F9t as parseGoogleWorkspaceStructuredContent,
  I9t as initializeMcpResourceMetadata,
  M9t as getGoogleWorkspaceToolName,
  M_n as walkMarkdown,
  N9t as initializeGoogleWorkspaceTools,
  P9t as isGoogleWorkspaceToolCall,
  P_n as initializeMarkdownParser,
  Vrn as initializeAppMatching,
  j9t as getGoogleWorkspaceActivity,
  non as parseMarkdown,
  ton as initializeMarkdownLinks,
} from "@rchunk/app-initial";
import { flattenConversationItems } from "../app-initial/runtime/flatten-conversation-items";

export type ExternalResourceActivity = "provided" | "read" | "created" | "updated";

export interface ExternalResourceProvider {
  id: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  name: string;
  pluginDisplayNames: string[];
}

export interface ExternalResource extends Record<string, unknown> {
  activities: ExternalResourceActivity[];
  isSource: boolean;
  key: string;
  mimeType: string | null;
  openInitiator: "markdown_link_click" | "mcp_app_resource";
  provider: ExternalResourceProvider | null;
  title: string;
  url: string;
}

interface ResourceCandidate {
  activities: ExternalResourceActivity[];
  aliases: string[];
  key: string;
  mimeType: string | null;
  openInitiator: ExternalResource["openInitiator"];
  openInitiatorPriority: number;
  provider: ExternalResourceProvider | null;
  providerPriority: number;
  title: string;
  titlePriority: number;
  url: string;
}

interface MergedResource extends Omit<ResourceCandidate, "activities" | "aliases"> {
  activities: Set<ExternalResourceActivity>;
  aliases: Set<string>;
  activitiesByTurn: Map<number, Set<ExternalResourceActivity>>;
}

interface ConversationTurn {
  items: unknown[];
  params: { input?: unknown[] };
}

interface McpToolCall {
  appContext?: { appName?: string; connectorId: string } | null;
  error?: unknown;
  id?: string;
  pluginId?: string;
  result?: {
    _meta?: unknown;
    content?: Array<{ text?: string; type?: string }>;
    structuredContent?: unknown;
  } | null;
  server: string;
  status?: string;
  tool: string;
  type: string;
}

interface ProviderMatcher {
  identity: { id: string; name: string };
  matches(url: URL): boolean;
  getResourceKey(url: URL): string | null;
}

const PROVIDER_MATCHERS: ProviderMatcher[] = [
  {
    identity: { id: "google-drive", name: "Google Drive" },
    matches: (url) =>
      ["docs.google.com", "drive.google.com", "sheets.google.com", "slides.google.com"].includes(
        url.hostname,
      ),
    getResourceKey: (url) => {
      const documentMatch = url.pathname.match(
        /^\/(document|spreadsheets|presentation)\/d\/(?:e\/)?([^/]+)/u,
      );
      if (
        ["docs.google.com", "sheets.google.com", "slides.google.com"].includes(url.hostname) &&
        documentMatch != null
      ) {
        const kind = documentMatch[1] === "spreadsheets" ? "spreadsheet" : documentMatch[1];
        return `google:${kind}:${documentMatch[2]}`;
      }
      if (url.hostname !== "drive.google.com") return null;
      const id =
        url.pathname.match(/^\/(?:file\/d|drive\/folders)\/([^/]+)/u)?.[1] ??
        url.searchParams.get("id");
      return id == null || id.length === 0 ? null : `google:drive:${id}`;
    },
  },
  {
    identity: { id: "notion", name: "Notion" },
    matches: (url) =>
      url.hostname === "notion.so" ||
      url.hostname.endsWith(".notion.so") ||
      url.hostname === "app.notion.com",
    getResourceKey: (url) => {
      const id = Array.from(
        url.pathname.matchAll(/[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f-]{27}/giu),
      ).at(-1)?.[0];
      return id == null ? null : `notion:${id.replaceAll("-", "").toLowerCase()}`;
    },
  },
  {
    identity: { id: "linear", name: "Linear" },
    matches: (url) => url.hostname === "linear.app",
    getResourceKey: (url) => {
      const match = url.pathname.match(/^\/([^/]+)\/(issue|project|document)\/([^/]+)/u);
      return match == null
        ? null
        : `linear:${match[1]?.toLowerCase()}:${match[2]}:${match[3]?.toLowerCase()}`;
    },
  },
  {
    identity: { id: "figma", name: "Figma" },
    matches: (url) => url.hostname === "figma.com" || url.hostname.endsWith(".figma.com"),
    getResourceKey: (url) => {
      const key = url.pathname.match(/^\/(?:board|design|file|make|proto|slides)\/([^/]+)/u)?.[1];
      return key == null ? null : `figma:${key}`;
    },
  },
  {
    identity: { id: "github", name: "GitHub" },
    matches: (url) => url.hostname === "github.com" || url.hostname.endsWith(".github.com"),
    getResourceKey: () => null,
  },
];

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.username === "" && url.password === ""
        ? url
        : null
      : null;
  } catch {
    return null;
  }
}

function normalizeUrl(url: URL): string {
  const normalized = new URL(url);
  normalized.hash = "";
  if (normalized.pathname.length > 1) {
    normalized.pathname = normalized.pathname.replace(/\/$/u, "");
  }
  return normalized.href;
}

function getProviderMatcher(url: URL): ProviderMatcher | null {
  return PROVIDER_MATCHERS.find((matcher) => matcher.matches(url)) ?? null;
}

function getProviderIdentity(url: URL): ExternalResourceProvider | null {
  const identity = getProviderMatcher(url)?.identity;
  return identity == null
    ? null
    : { ...identity, pluginDisplayNames: [], logoUrl: null, logoUrlDark: null };
}

function getUrlResourceKey(url: URL): string | null {
  return getProviderMatcher(url)?.getResourceKey(url) ?? null;
}

function getExternalResourceKey(value: string): string | null {
  const url = parseHttpUrl(value);
  return url == null ? null : (getUrlResourceKey(url) ?? `url:${normalizeUrl(url)}`);
}

function titleFromUrl(url: URL): string {
  return `${url.host.replace(/^www\./u, "")}${url.pathname === "/" ? "" : url.pathname}`;
}

function buildCandidate({
  activities,
  mimeType,
  provider = null,
  providerResourceId,
  providerScope,
  title,
  titlePriority = 0,
  url: value,
}: {
  activities: ExternalResourceActivity[];
  mimeType?: string | null;
  provider?: ExternalResourceProvider | null;
  providerResourceId?: string;
  providerScope?: string;
  title?: string | null;
  titlePriority?: number;
  url: string;
}): ResourceCandidate | null {
  const url = parseHttpUrl(value);
  if (url == null) return null;
  const normalizedKey = `url:${normalizeUrl(url)}`;
  const canonicalKey =
    getUrlResourceKey(url) ??
    (providerResourceId == null || providerScope == null
      ? normalizedKey
      : `provider:${providerScope}:${providerResourceId}`);
  const aliases = [canonicalKey, normalizedKey];
  const providerKey =
    providerResourceId == null || providerScope == null
      ? null
      : `provider:${providerScope}:${providerResourceId}`;
  if (providerKey != null && canonicalKey !== providerKey) aliases.push(providerKey);
  const resolvedProvider = provider ?? getProviderIdentity(url);
  const trimmedTitle = title?.trim();
  return {
    activities,
    aliases,
    key: canonicalKey,
    mimeType: mimeType?.trim() || null,
    openInitiator: provider == null ? "markdown_link_click" : "mcp_app_resource",
    openInitiatorPriority: provider == null ? 1 : 2,
    provider: resolvedProvider,
    providerPriority: provider == null ? (resolvedProvider == null ? 0 : 1) : 2,
    title: trimmedTitle || titleFromUrl(url),
    titlePriority: trimmedTitle == null || trimmedTitle.length === 0 ? 0 : titlePriority,
    url: url.href,
  };
}

function extractMarkdownLinks(text: string): Array<{ label: string | null; url: string }> {
  const links: Array<{ label: string | null; url: string }> = [];
  const markdownPattern = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/giu;
  const seenRanges: Array<[number, number]> = [];
  for (const match of text.matchAll(markdownPattern)) {
    const label = match[1]?.trim();
    links.push({ label: label === "" || label === match[2] ? null : label ?? null, url: match[2] });
    seenRanges.push([match.index, match.index + match[0].length]);
  }
  for (const match of text.matchAll(/https?:\/\/[^\s<>)\]]+/giu)) {
    if (seenRanges.some(([start, end]) => match.index >= start && match.index < end)) continue;
    links.push({ label: null, url: match[0] });
  }
  return links;
}

function collectTextResources(
  content: unknown,
  includePages: boolean,
  labelCache?: WeakMap<object, unknown>,
): ResourceCandidate[] {
  if (!Array.isArray(content)) return [];
  const resources: ResourceCandidate[] = [];
  for (const item of content) {
    if (typeof item !== "object" || item == null || (item as { type?: string }).type !== "text") {
      continue;
    }
    const textItem = item as { text: string };
    let links = labelCache?.get(item) as ReturnType<typeof extractMarkdownLinks> | undefined;
    if (links == null) {
      links = extractMarkdownLinks(textItem.text);
      labelCache?.set(item, links);
    }
    for (const link of links) {
      const candidate = buildCandidate({
        activities: ["provided"],
        title: link.label,
        titlePriority: link.label == null ? 0 : 1,
        url: link.url,
      });
      if (candidate != null && (includePages || !candidate.url.startsWith("page://"))) {
        resources.push(candidate);
      }
    }
  }
  return resources;
}

function getProviderForToolCall(
  call: McpToolCall,
  apps: unknown[],
): ExternalResourceProvider {
  const matchingApp = findMatchingApp({
    appContext: call.appContext,
    apps,
    functionName: `${call.server}__${call.tool}`,
    serverName: call.server,
    toolName: call.tool,
  }) as unknown as ExternalResourceProvider | null;
  return matchingApp == null
    ? {
        id: call.appContext?.connectorId ?? call.pluginId ?? `mcp-server:${call.server}`,
        name:
          call.appContext?.appName ??
          call.appContext?.connectorId ??
          formatMcpServerName(call.server),
        pluginDisplayNames: [],
        logoUrl: null,
        logoUrlDark: null,
      }
    : {
        id: matchingApp.id,
        name: matchingApp.name,
        pluginDisplayNames: matchingApp.pluginDisplayNames ?? [],
        logoUrl: matchingApp.logoUrl,
        logoUrlDark: matchingApp.logoUrlDark,
      };
}

function getToolCallCandidates(call: McpToolCall, apps: unknown[]): ResourceCandidate[] {
  const provider = getProviderForToolCall(call, apps);
  const metadata = call.result?._meta == null ? null : parseMcpResourceMetadata(call.result._meta);
  if (
    metadata != null &&
    typeof metadata === "object" &&
    (metadata as { status?: string }).status !== "absent"
  ) {
    const parsed = metadata as {
      resources?: Array<{
        activities: ExternalResourceActivity[];
        id?: string;
        mimeType?: string;
        title?: string;
        url: string;
      }>;
      status?: string;
    };
    if (parsed.status === "invalid") return [];
    return (parsed.resources ?? []).flatMap((resource) => {
      const candidate = buildCandidate({
        activities: resource.activities,
        mimeType: resource.mimeType,
        provider,
        providerResourceId: resource.id,
        providerScope: call.pluginId ?? provider.id,
        title: resource.title,
        titlePriority: 2,
        url: resource.url,
      });
      return candidate == null ? [] : [candidate];
    });
  }

  if (isGoogleWorkspaceToolCall(call as unknown as Record<string, unknown>)) {
    const toolName = getGoogleWorkspaceToolName(call.tool);
    const activity = getGoogleWorkspaceActivity(toolName);
    const resource = parseGoogleWorkspaceStructuredContent(call.result?.structuredContent) as
      | { mimeType?: string; title?: string; urls?: string[] }
      | null;
    if (resource == null || resource.urls?.[0] == null || activity === "unknown") return [];
    const candidate = buildCandidate({
      activities: [activity === "read" ? "read" : "updated"],
      mimeType: resource.mimeType,
      provider,
      title: resource.title,
      titlePriority: 2,
      url: resource.urls[0],
    });
    return candidate == null ? [] : [candidate];
  }
  return [];
}

function mergeCandidate(target: MergedResource, candidate: ResourceCandidate, turnIndex: number): void {
  for (const alias of candidate.aliases) target.aliases.add(alias);
  for (const activity of candidate.activities) target.activities.add(activity);
  const turnActivities = target.activitiesByTurn.get(turnIndex) ?? new Set();
  for (const activity of candidate.activities) turnActivities.add(activity);
  target.activitiesByTurn.set(turnIndex, turnActivities);
  if (candidate.titlePriority > target.titlePriority) {
    target.title = candidate.title;
    target.titlePriority = candidate.titlePriority;
  }
  if (target.mimeType == null && candidate.mimeType != null) target.mimeType = candidate.mimeType;
  if (candidate.providerPriority > target.providerPriority) {
    target.provider = candidate.provider;
    target.providerPriority = candidate.providerPriority;
  }
  if (candidate.openInitiatorPriority > target.openInitiatorPriority) {
    target.openInitiator = candidate.openInitiator;
    target.openInitiatorPriority = candidate.openInitiatorPriority;
  }
}

function collectExternalResources(
  turns: ConversationTurn[],
  apps: unknown[] = [],
  includePages = false,
  labelCache?: WeakMap<object, unknown>,
): ExternalResource[] {
  const merged: MergedResource[] = [];
  const addCandidate = (candidate: ResourceCandidate, turnIndex: number) => {
    const matches = merged.filter((resource) =>
      candidate.aliases.some((alias) => resource.aliases.has(alias)),
    );
    let target = matches[0];
    if (target == null) {
      target = {
        ...candidate,
        aliases: new Set(candidate.aliases),
        activities: new Set(candidate.activities),
        activitiesByTurn: new Map([[turnIndex, new Set(candidate.activities)]]),
      };
      merged.push(target);
      return;
    }
    mergeCandidate(target, candidate, turnIndex);
    for (const duplicate of matches.slice(1)) {
      mergeCandidate(target, {
        ...duplicate,
        aliases: [...duplicate.aliases],
        activities: [...duplicate.activities],
      }, turnIndex);
      merged.splice(merged.indexOf(duplicate), 1);
    }
  };

  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex -= 1) {
    const turn = turns[turnIndex];
    const items = flattenConversationItems(turn.items) as Array<Record<string, unknown>>;
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = items[itemIndex];
      if (item.type === "userMessage") {
        for (const candidate of collectTextResources(item.content, includePages, labelCache)) {
          addCandidate(candidate, turnIndex);
        }
      } else if (item.type === "steeringUserMessage") {
        for (const candidate of collectTextResources(item.input, includePages, labelCache)) {
          addCandidate(candidate, turnIndex);
        }
      } else if (
        item.type === "webSearch" &&
        ((item.action as { type?: string } | null)?.type === "openPage" ||
          (item.action as { type?: string } | null)?.type === "findInPage")
      ) {
        const url = (item.action as { url?: string }).url;
        if (url != null) {
          const candidate = buildCandidate({ activities: ["read"], url });
          if (candidate != null) addCandidate(candidate, turnIndex);
        }
      } else if (
        item.type === "mcpToolCall" &&
        item.status === "completed" &&
        item.error == null &&
        item.result != null
      ) {
        for (const candidate of getToolCallCandidates(item as unknown as McpToolCall, apps)) {
          addCandidate(candidate, turnIndex);
        }
      }
    }
    for (const candidate of collectTextResources(turn.params.input, includePages, labelCache)) {
      addCandidate(candidate, turnIndex);
    }
  }

  const activityOrder: ExternalResourceActivity[] = ["provided", "read", "created", "updated"];
  return merged.map((resource) => ({
    key: resource.key,
    url: resource.url,
    title: resource.title,
    mimeType: resource.mimeType,
    activities: activityOrder.filter((activity) => resource.activities.has(activity)),
    isSource: Array.from(resource.activitiesByTurn.values()).some(
      (activities) =>
        activities.has("provided") || (activities.has("read") && !activities.has("created")),
    ),
    provider: resource.provider,
    openInitiator: resource.openInitiator,
  }));
}

function isExternalSource(resource: ExternalResource): boolean {
  return resource.isSource;
}

function isWrittenExternalResource(resource: ExternalResource): boolean {
  return resource.activities.includes("created") || resource.activities.includes("updated");
}

function initializeLocalConversationExternalResources(): void {
  initializeMarkdownParser();
  initializeUtilities();
  initializeAppMatching();
  initializeMcpServerNames();
  initializeMarkdownLinks();
  initializeMcpResourceMetadata();
  initializeGoogleWorkspaceTools();
  void parseMarkdown;
  void walkMarkdown;
}

export {
  isExternalSource as a,
  isWrittenExternalResource as i,
  collectExternalResources as n,
  initializeLocalConversationExternalResources as r,
  getExternalResourceKey as t,
};
