import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
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

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;

function getProviderIds(source: Record<string, unknown>): string[] {
  const provider = source.provider as { id?: string } | null | undefined;
  return provider == null ? [] : [provider.id as string];
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
  const cache = compilerRuntime.c(13);
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
  let sourceOwner: { hostId: string; threadId: string } | null;
  if (cache[0] !== conversationId || cache[1] !== hostId) {
    sourceOwner = conversationId == null ? null : { hostId, threadId: conversationId };
    cache[0] = conversationId;
    cache[1] = hostId;
    cache[2] = sourceOwner;
  } else {
    sourceOwner = cache[2] as typeof sourceOwner;
  }
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

  let fileSources: unknown[];
  if (cache[3] === turns) {
    fileSources = cache[4] as unknown[];
  } else {
    fileSources = getFileSources(turns) as unknown[];
    cache[3] = turns;
    cache[4] = fileSources;
  }
  let webMcpCalls: unknown[];
  if (cache[5] === turns) {
    webMcpCalls = cache[6] as unknown[];
  } else {
    webMcpCalls = collectCompletedWebMcpCalls(turns);
    cache[5] = turns;
    cache[6] = webMcpCalls;
  }
  let result: LocalConversationSourcesResult;
  if (
    cache[7] !== externalSources ||
    cache[8] !== fileSources ||
    cache[9] !== webMcpCalls ||
    cache[10] !== toolSources ||
    cache[11] !== webSearchSource
  ) {
    result = {
      externalSources,
      fileSources,
      toolSources,
      webMcpCalls,
      webSearchSource,
    };
    cache[7] = externalSources;
    cache[8] = fileSources;
    cache[9] = webMcpCalls;
    cache[10] = toolSources;
    cache[11] = webSearchSource;
    cache[12] = result;
  } else {
    result = cache[12] as LocalConversationSourcesResult;
  }
  return result;
}

function initializeUseLocalConversationSources(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
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
