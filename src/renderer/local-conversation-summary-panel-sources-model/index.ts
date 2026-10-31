import "@rchunk/rolldown-runtime";
import {
  RI as initializeAttachmentUtilities,
  eU as getMcpAppId,
  hq as isWebMcpServer,
  wL as initializeUtilities,
} from "@rchunk/app-shared";
import { getPathBasename } from "../app-shared/runtime/get-path-basename";
import {
  Brn as formatMcpServerName,
  Drn as initializeMcpServerNames,
  Ern as findMatchingApp,
  Gdt as initializeFileSourceModel,
  Vrn as initializeAppMatching,
  Wdt as getMcpServerLogo,
  ZGt as createViewedLink,
  _hn as getAttachmentsFromMessageContent,
  dmn as collectInputAttachments,
  fmn as initializeAttachmentCollection,
  fnn as initializeAttachmentIdentity,
  hmn as initializeConversationItemUtilities,
  mmn as getAttachmentKey,
  pnn as projectMcpToolCall,
  vhn as initializeMcpCallProjection,
  wrn as initializeMcpProviderMetadata,
  yrn as computerUseProviderId,
} from "@rchunk/app-initial";
import { flattenConversationItems } from "../app-initial/runtime/flatten-conversation-items";
import {
  i as initializeMcpToolActivityLabels,
  t as getMcpToolActivityLabel,
  type McpToolIntl,
} from "@rchunk/mcp-tool-activity-label";
import {
  r as initializeLocalConversationExternalResources,
  t as getExternalResourceKey,
  type ExternalResource,
} from "@rchunk/local-conversation-external-resources";
import { t as getTrustedAnalyticsAppName } from "@rchunk/mcp-app-analytics";

interface ConversationTurn {
  items: unknown[];
  params: {
    attachments?: unknown[];
    input: unknown[];
  };
}

interface FileSource {
  fsPath?: string;
  label?: string;
  path?: string;
  [key: string]: unknown;
}

interface McpApp {
  appMetadata?: { firstPartyType?: string } | null;
  distributionChannel?: string;
  id: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  name: string;
  pluginDisplayNames?: string[];
}

interface McpToolCall {
  appContext?: { appName?: string; connectorId: string } | null;
  id: string;
  pluginId?: string;
  server: string;
  tool: string;
  type: string;
}

interface ToolActivity {
  calls: unknown[];
  label: string;
}

interface ToolSource {
  activities: ToolActivity[];
  id: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  mcpAppId?: string;
  name: string;
  pluginDisplayNames: string[];
  trustedAnalyticsAppName?: string;
}

interface ServerInfo {
  logoDarkUrl?: string | null;
  logoUrl?: string | null;
  name: string;
  title?: string | null;
}

interface ServerInfoQuery {
  data?: Array<{ name: string; serverInfo?: ServerInfo | null }>;
}

export interface ViewedLink {
  title?: string;
  url: string;
  [key: string]: unknown;
}

export interface WebSearchSource {
  queries: string[];
  queryCount: number;
  viewedLinks: ViewedLink[];
}

function normalizeServerName(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function buildServerMetadataMap(query?: ServerInfoQuery | null): Map<
  string,
  { logoUrl: string | null; logoUrlDark: string | null; name: string | null }
> {
  const metadata = new Map<
    string,
    { logoUrl: string | null; logoUrlDark: string | null; name: string | null }
  >();
  for (const entry of query?.data ?? []) {
    const serverInfo = entry.serverInfo;
    if (serverInfo == null) continue;
    const logo = getMcpServerLogo(serverInfo as unknown as Record<string, unknown>) as
      | { logoDarkUrl?: string | null; logoUrl?: string | null }
      | null;
    const name = serverInfo.title?.trim() || serverInfo.name.trim() || null;
    if (logo == null && name == null) continue;
    const value = {
      logoUrl: logo?.logoUrl ?? null,
      logoUrlDark: logo?.logoDarkUrl ?? null,
      name,
    };
    for (const alias of [entry.name, serverInfo.name]) {
      const key = normalizeServerName(alias);
      if (key.length > 0 && !metadata.has(key)) metadata.set(key, value);
    }
  }
  return metadata;
}

function collectFileSources(turns: ConversationTurn[]): FileSource[] {
  const sources: FileSource[] = [];
  const seen = new Set<string>();
  const addSources = (attachments: unknown[], input: unknown[]) => {
    const explicitSources = collectInputAttachments({ attachments, input }) as FileSource[];
    const localImages = input.flatMap((item) => {
      const candidate = item as { path?: string; type?: string };
      if (candidate.type !== "localImage" || candidate.path == null) return [];
      return [
        {
          label: (getPathBasename(candidate.path) as string) || candidate.path,
          path: candidate.path,
          fsPath: candidate.path,
        },
      ];
    });
    for (const source of [...explicitSources, ...localImages]) {
      const key = getAttachmentKey(source) as string;
      if (!seen.has(key)) {
        seen.add(key);
        sources.push(source);
      }
    }
  };

  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex -= 1) {
    const turn = turns[turnIndex];
    const items = flattenConversationItems(turn.items) as Array<Record<string, unknown>>;
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = items[itemIndex];
      if (item.type === "steeringUserMessage") {
        addSources((item.attachments as unknown[]) ?? [], item.input as unknown[]);
      } else if (item.type === "userMessage") {
        addSources(
          (item.attachments as unknown[] | undefined) ??
            (getAttachmentsFromMessageContent(item.content) as unknown[]),
          item.content as unknown[],
        );
      }
    }
    addSources(turn.params.attachments ?? [], turn.params.input);
  }
  return sources;
}

function buildToolSource(
  call: McpToolCall,
  matchingApp: McpApp | null,
  serverMetadata: Map<
    string,
    { logoUrl: string | null; logoUrlDark: string | null; name: string | null }
  >,
): ToolSource {
  const normalizedServer = normalizeServerName(call.server);
  const overrideId = normalizedServer === "computer-use" ? computerUseProviderId : null;
  if (matchingApp != null) {
    return {
      id: overrideId ?? matchingApp.id,
      name: matchingApp.name,
      pluginDisplayNames: matchingApp.pluginDisplayNames ?? [],
      logoUrl: matchingApp.logoUrl,
      logoUrlDark: matchingApp.logoUrlDark,
      activities: [],
      trustedAnalyticsAppName: getTrustedAnalyticsAppName(
        matchingApp as unknown as Record<string, unknown>,
      ),
    };
  }
  if (call.appContext != null) {
    return {
      id: overrideId ?? call.appContext.connectorId,
      name: call.appContext.appName ?? call.appContext.connectorId,
      pluginDisplayNames: [],
      logoUrl: null,
      logoUrlDark: null,
      activities: [],
    };
  }
  const metadata = serverMetadata.get(normalizedServer);
  return {
    id: overrideId ?? call.pluginId ?? `mcp-server:${call.server}`,
    name: metadata?.name ?? formatMcpServerName(call.server),
    pluginDisplayNames: [],
    logoUrl: metadata?.logoUrl ?? null,
    logoUrlDark: metadata?.logoUrlDark ?? null,
    activities: [],
  };
}

function collectToolSources(
  turns: ConversationTurn[],
  apps: McpApp[],
  intl: McpToolIntl,
  knownMcpAppIds?: Set<string> | null,
  serverInfoQuery?: ServerInfoQuery | null,
  excludedProviderIds?: Set<string> | null,
  includeInternal = false,
): ToolSource[] {
  const sources: ToolSource[] = [];
  const sourcesById = new Map<string, ToolSource>();
  const serverMetadata = buildServerMetadataMap(serverInfoQuery);
  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex -= 1) {
    const turn = turns[turnIndex];
    const items = flattenConversationItems(turn.items) as McpToolCall[];
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const call = items[itemIndex];
      if (
        call.type !== "mcpToolCall" ||
        isWebMcpServer(call.server) ||
        normalizeServerName(call.server) === "plugin-runtime"
      ) {
        continue;
      }
      const matchingApp = findMatchingApp({
        appContext: call.appContext,
        apps,
        functionName: `${call.server}__${call.tool}`,
        serverName: call.server,
        toolName: call.tool,
      }) as unknown as McpApp | null;
      const candidate = buildToolSource(call, matchingApp, serverMetadata);
      if (excludedProviderIds?.has(candidate.id) === true) continue;
      const appId = getMcpAppId(call.id) as string;
      const knownAppId = knownMcpAppIds?.has(appId) === true ? appId : undefined;
      const projectedCall = projectMcpToolCall(
        turn as unknown as Record<string, unknown>,
        call as unknown as Record<string, unknown>,
      );
      const activityLabel = getMcpToolActivityLabel({
        appContext: call.appContext,
        completed: (projectedCall as { completed?: boolean }).completed,
        intl,
        matchingApp,
        serverName: call.server,
        toolArguments: undefined,
        toolName: call.tool,
      }) as string;
      const existing = sourcesById.get(candidate.id);
      if (existing != null) {
        const activity = existing.activities.find(({ label }) => label === activityLabel);
        if (activity == null) existing.activities.push({ calls: [projectedCall], label: activityLabel });
        else activity.calls.push(projectedCall);
        if (existing.mcpAppId == null && knownAppId != null) existing.mcpAppId = knownAppId;
        continue;
      }
      if (knownAppId != null) candidate.mcpAppId = knownAppId;
      candidate.activities.push({ calls: [projectedCall], label: activityLabel });
      sourcesById.set(candidate.id, candidate);
      sources.push(candidate);
    }
  }
  void includeInternal;
  return sources;
}

function collectWebSearchSource(turns: ConversationTurn[]): WebSearchSource | null {
  let foundWebSearch = false;
  let queryCount = 0;
  const queries: string[] = [];
  const viewedLinks: ViewedLink[] = [];
  const seenQueries = new Set<string>();
  const seenLinks = new Set<string>();
  const addQuery = (value: string) => {
    const query = value.trim();
    if (query.length === 0) return;
    queryCount += 1;
    if (!seenQueries.has(query)) {
      seenQueries.add(query);
      queries.push(query);
    }
  };
  const addLink = (url: string) => {
    const link = createViewedLink({ url }) as ViewedLink | null;
    if (link != null && !seenLinks.has(link.url)) {
      seenLinks.add(link.url);
      viewedLinks.push(link);
    }
  };

  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex -= 1) {
    const items = flattenConversationItems(turns[turnIndex].items) as Array<
      Record<string, unknown>
    >;
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = items[itemIndex];
      if (item.type !== "webSearch") continue;
      foundWebSearch = true;
      const action = item.action as
        | { queries?: string[]; query?: string; type: string; url?: string }
        | null;
      if (action == null) addQuery(item.query as string);
      else if (action.type === "search") {
        const actionQueries =
          action.queries == null || action.queries.length === 0 ? [action.query] : action.queries;
        for (const query of actionQueries) if (query != null) addQuery(query);
      } else if (action.type === "openPage" || action.type === "findInPage") {
        if (action.url != null) addLink(action.url);
      } else addQuery(item.query as string);
    }
  }
  return foundWebSearch ? { queries, queryCount, viewedLinks } : null;
}

function reconcileExternalAndWebSearchSources(
  externalSources: ExternalResource[],
  webSearchSource: WebSearchSource | null,
): { externalSources: ExternalResource[]; webSearchSource: WebSearchSource | null } {
  if (webSearchSource == null) return { externalSources, webSearchSource: null };
  const viewedKeys = new Set(
    webSearchSource.viewedLinks.flatMap(({ url }) => {
      const key = getExternalResourceKey(url);
      return key == null ? [] : [key];
    }),
  );
  const filteredExternalSources = externalSources.filter(
    (source) =>
      !(
        source.provider == null &&
        source.activities.length === 1 &&
        source.activities[0] === "read" &&
        viewedKeys.has(source.key)
      ),
  );
  const externalKeys = new Set(filteredExternalSources.map(({ key }) => key));
  const reconciledWebSearchSource = {
    ...webSearchSource,
    viewedLinks: webSearchSource.viewedLinks.filter(({ url }) => {
      const key = getExternalResourceKey(url);
      return key == null || !externalKeys.has(key);
    }),
  };
  return {
    externalSources: filteredExternalSources,
    webSearchSource:
      reconciledWebSearchSource.queryCount === 0 &&
      reconciledWebSearchSource.viewedLinks.length === 0
        ? null
        : reconciledWebSearchSource,
  };
}

function initializeSummaryPanelSourcesModel(): void {
  initializeUtilities();
  initializeAppMatching();
  initializeConversationItemUtilities();
  initializeMcpCallProjection();
  initializeAttachmentCollection();
  initializeAttachmentIdentity();
  initializeMcpToolActivityLabels();
  initializeMcpServerNames();
  initializeFileSourceModel();
  initializeMcpProviderMetadata();
  initializeAttachmentUtilities();
  initializeLocalConversationExternalResources();
}

export {
  initializeSummaryPanelSourcesModel as a,
  reconcileExternalAndWebSearchSources as i,
  collectToolSources as n,
  collectWebSearchSource as r,
  collectFileSources as t,
};
