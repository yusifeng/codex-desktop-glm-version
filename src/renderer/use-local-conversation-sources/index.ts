import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  HX as useSignalValue,
  K2 as initializeInternationalization,
  hq as isWebMcpServer,
  n4 as useCurrentAccount,
  wL as initializeUtilities,
  zX as useScopedSignalValue,
} from "@rchunk/app-shared";
import {
  $sn as initializeExternalResources,
  GEt as useExternalSourceProviders,
  HEt as initializeExternalSourceProviderQuery,
  ecn as externalSourceMetadata,
  ict as initializeConversationNavigation,
  uct as includeInternalSourcesSignal,
} from "@rchunk/app-initial";
import {
  a as isVisibleExternalSource,
  n as mergeExternalSources,
  r as initializeLocalConversationExternalResources,
} from "@rchunk/local-conversation-external-resources";
import {
  i as sourceLinksByThread,
  n as initializeLocalConversationSourcesSignals,
  t as allConversationTurnsForSources,
} from "@rchunk/local-conversation-sources-signals";
import {
  i as initializeLocalConversationWebMcpToolsModel,
  n as collectCompletedWebMcpCalls,
} from "@rchunk/local-conversation-webmcp-tools-model";
import {
  a as initializeSummaryPanelSourcesModel,
  i as buildExternalAndWebSearchSources,
  n as buildToolSources,
  r as getWebSearchSource,
  t as getFileSources,
} from "@rchunk/local-conversation-summary-panel-sources-model";

export interface LocalConversationSourcesResult {
  externalSources: Array<Record<string, unknown>>;
  fileSources: unknown[];
  toolSources: unknown[];
  webMcpCalls: unknown[];
  webSearchSource: unknown;
}

function getProviderIds(source: Record<string, unknown>): string[] {
  const provider = source.provider as { id?: string } | null | undefined;
  return provider?.id == null ? [] : [provider.id];
}

function turnUsesNonWebMcp(turn: { items: unknown[] }): boolean {
  return turn.items.some((item) => {
    const candidate = item as { server?: unknown; type?: string };
    return candidate.type === "mcpToolCall" && !isWebMcpServer(candidate.server);
  });
}

function useLocalConversationSources(
  conversationId: string | null,
  hostId: string,
): LocalConversationSourcesResult {
  const readSignalFamily = useSignalFamilyValue as unknown as (
    signal: unknown,
    parameter: unknown,
    options?: Record<string, unknown>,
  ) => unknown;
  const readScopedSignal = useScopedSignalValue as unknown as (
    signal: unknown,
    parameter: unknown,
  ) => unknown;
  const account = useCurrentAccount();
  const sourceOwner = conversationId == null ? null : { hostId, threadId: conversationId };
  const sourceLinks = readScopedSignal(sourceLinksByThread, sourceOwner);
  const includeInternalSources = useSignalValue(includeInternalSourcesSignal) === true;
  const turns =
    (readSignalFamily(allConversationTurnsForSources, conversationId) as unknown as Array<{
      items: unknown[];
    }> | null) ?? [];
  const sourceMetadata = useSignalValue(externalSourceMetadata);
  const needsProviders = turns.some(turnUsesNonWebMcp);
  const providerQuery = useExternalSourceProviders({ enabled: needsProviders, hostId }) as {
    data?: unknown[];
  };
  const providers = providerQuery.data ?? [];
  const metadataQuery = readSignalFamily(externalSourceMetadata, hostId, {
    enabled: needsProviders,
  }) as { data?: unknown };
  const { externalSources, webSearchSource } = buildExternalAndWebSearchSources(
    (mergeExternalSources(turns, providers, includeInternalSources, sourceLinks) as Array<
      Record<string, unknown>
    >).filter(isVisibleExternalSource),
    getWebSearchSource(turns),
  ) as {
    externalSources: Array<Record<string, unknown>>;
    webSearchSource: unknown;
  };
  const toolSources = buildToolSources(
    turns,
    providers,
    account,
    sourceMetadata,
    metadataQuery.data,
    new Set(externalSources.flatMap(getProviderIds)),
    includeInternalSources,
  ) as unknown[];

  return {
    externalSources,
    fileSources: getFileSources(turns) as unknown[],
    toolSources,
    webMcpCalls: collectCompletedWebMcpCalls(turns),
    webSearchSource,
  };
}

function initializeUseLocalConversationSources(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  initializeUtilities();
  initializeInternationalization();
  initializeConversationNavigation();
  initializeExternalSourceProviderQuery();
  initializeExternalResources();
  initializeLocalConversationExternalResources();
  initializeLocalConversationSourcesSignals();
  initializeLocalConversationWebMcpToolsModel();
  initializeSummaryPanelSourcesModel();
}

export { useLocalConversationSources as n, initializeUseLocalConversationSources as t };
