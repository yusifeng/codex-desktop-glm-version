import "@rchunk/rolldown-runtime";
import {
  BI as normalizeArtifactPath,
  FX as initializeSignalRuntime,
  HI as joinPath,
  OK as normalizeUrl,
  PK as isHttpUrl,
  QI as initializeQueryRuntime,
  RI as initializePathUtilities,
  ZI as appScope,
  hq as isWebMcpServer,
  iW as normalizeFilePath,
  l3 as initializeDeepEqual,
  rZ as createScopedSignalFamily,
  wL as initializeUtilities,
} from "@rchunk/app-shared";
import { getPathBasename } from "../app-shared/runtime/get-path-basename";
import {
  A9t as isProjectlessOutputResource,
  D9t as isWorkspaceResource,
  E9t as initializeArtifactParser,
  Fut as initializeTurnArtifacts,
  Grn as stripAssistantMetadata,
  H9t as isGeneratedImageResource,
  HEt as externalSourceProvidersQuery,
  HZt as initializeConversationScope,
  Hnn as initializeArtifactExtraction,
  Knn as initializeArtifactKeys,
  Krn as initializeArtifactTypes,
  MEt as externalSourceProviderQuery,
  Put as collectTurnArtifacts,
  T9t as parseArtifacts,
  V9t as initializeGeneratedImages,
  arn as initializeConversationHelpers,
  bQt as projectlessOutputDirectory,
  ein as initializeArtifactUrls,
  fnn as initializeConversationProjection,
  i$t as conversationMode,
  irn as getTurnArtifactPaths,
  k9t as initializeArtifactMarkdown,
  lQt as latestConversationTurn,
  mnn as projectConversationTurn,
  tin as isHeartbeatAutomationTurn,
  yhn as getArtifactScanContent,
} from "@rchunk/app-initial";
import { flattenConversationItems } from "../app-initial/runtime/flatten-conversation-items";
import {
  gf as initializeAppgenArtifactLinks,
  hf as extractAppgenLinks,
} from "@rchunk/app-primary";
import {
  i as isWrittenExternalResource,
  n as collectExternalResources,
  r as initializeLocalConversationExternalResources,
  t as getExternalResourceKey,
  type ExternalResource,
} from "@rchunk/local-conversation-external-resources";
import {
  n as initializeLocalConversationSourcesSignals,
  r as priorConversationTurns,
} from "@rchunk/local-conversation-sources-signals";

export type ConversationArtifact =
  | { path: string; producedAtMs?: number; type: "file" }
  | { imageGenerationItemId: string; path: string; producedAtMs?: number; type: "generated-image" }
  | { producedAtMs?: number; resource: ExternalResource; type: "external-resource" }
  | { producedAtMs?: number; type: "google-drive"; url: string; [key: string]: unknown }
  | { producedAtMs?: number; projectId: string; type: "appgen-app"; url?: string; [key: string]: unknown }
  | { producedAtMs?: number; target: string; type: "website" };

interface ConversationTurn {
  items: Array<Record<string, unknown>>;
  params: {
    collaborationMode?: unknown;
    cwd?: string | null;
    input: Array<Record<string, unknown>>;
  };
  status: string;
  turnId?: string;
  turnStartedAtMs?: number;
}

interface CollectArtifactOptions {
  apps?: unknown[];
  includeGeneratedImages?: boolean;
  includePages?: boolean;
  projectlessOutputDirectory?: string | null;
}

const GENERATED_IMAGE_FILENAME =
  /^(?:ig_[a-f0-9]{32,}|exec-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})\.(?:avif|gif|jpeg|jpg|png|webp)$/iu;

function isGeneratedImageFilename(path: string): boolean {
  return GENERATED_IMAGE_FILENAME.test(getPathBasename(path));
}

function getArtifactKey(artifact: ConversationArtifact): string {
  switch (artifact.type) {
    case "file":
    case "generated-image":
      return `path:${normalizeArtifactPath(artifact.path)}`;
    case "external-resource":
      return artifact.resource.key;
    case "google-drive":
      return getExternalResourceKey(artifact.url) ?? `google-drive:${artifact.url}`;
    case "appgen-app":
      return `appgen-app:${artifact.projectId}`;
    case "website":
      return isHttpUrl(artifact.target)
        ? `url:${normalizeUrl(artifact.target)}`
        : `path:${normalizeArtifactPath(artifact.target)}`;
  }
}

function mergeArtifactGroups(groups: ConversationArtifact[][]): ConversationArtifact[] {
  const artifacts: ConversationArtifact[] = [];
  const indexByKey = new Map<string, number>();
  for (const group of groups) {
    for (const artifact of group) {
      const key = getArtifactKey(artifact);
      const existingIndex = indexByKey.get(key);
      if (existingIndex != null) {
        const existing = artifacts[existingIndex];
        if (
          (existing?.type === "file" && artifact.type === "generated-image") ||
          (existing?.type === "appgen-app" &&
            existing.url == null &&
            artifact.type === "appgen-app" &&
            artifact.url != null)
        ) {
          artifacts[existingIndex] = artifact;
        }
        continue;
      }
      indexByKey.set(key, artifacts.length);
      artifacts.push(artifact);
    }
  }
  return artifacts;
}

function getAssistantArtifactContent(turn: ConversationTurn): unknown {
  for (let index = turn.items.length - 1; index >= 0; index -= 1) {
    const item = turn.items[index];
    if (item?.type !== "agentMessage") continue;
    const stripped = stripAssistantMetadata(item.text, false) as { content: string; removed: boolean };
    if (stripped.removed && stripped.content.length === 0) return null;
    return (getArtifactScanContent({
      content: stripped.content,
      isHeartbeatAutomationTurn: isHeartbeatAutomationTurn(
        turn as unknown as Record<string, unknown>,
      ),
    }) as { artifactScanContent: unknown }).artifactScanContent;
  }
  return null;
}

function collectTurnLocalArtifacts(
  turn: ConversationTurn,
  projectlessDirectory: string | null,
  includeGeneratedImages: boolean,
): ConversationArtifact[] {
  const status = turn.status === "completed" ? "complete" : turn.status;
  const cwd = turn.params.cwd == null ? null : normalizeFilePath(turn.params.cwd);
  const artifacts: ConversationArtifact[] = [];
  const indexByKey = new Map<string, number>();
  const add = (artifact: ConversationArtifact) => {
    const key = getArtifactKey(artifact);
    const existingIndex = indexByKey.get(key);
    if (existingIndex == null) {
      indexByKey.set(key, artifacts.length);
      artifacts.push(artifact);
      return;
    }
    const existing = artifacts[existingIndex];
    if (
      (existing?.type === "file" || existing?.type === "generated-image") &&
      (artifact.type === "website" || artifact.type === "generated-image")
    ) {
      artifacts[existingIndex] = artifact;
    }
  };

  const imageItems = includeGeneratedImages ? turn.items.slice().reverse() : turn.items;
  for (const item of imageItems) {
    if (
      item.type === "imageGeneration" &&
      typeof item.src === "string" &&
      isGeneratedImageResource(item.src) &&
      !isWorkspaceResource({ cwd, resourcePath: item.src }) &&
      (includeGeneratedImages ||
        isProjectlessOutputResource({ cwd, projectlessOutputDirectory: projectlessDirectory, resourcePath: item.src }))
    ) {
      const path = cwd == null ? item.src : joinPath(cwd, item.src);
      add(includeGeneratedImages
        ? { type: "generated-image", imageGenerationItemId: String(item.id), path }
        : { type: "file", path });
    }
  }
  if (status !== "complete") return artifacts;

  const parsed = parseArtifacts({
    assistantContent: getAssistantArtifactContent(turn),
    includeAppgenResources: true,
    projectlessOutputDirectory: projectlessDirectory,
    turn: {
      artifacts: getTurnArtifactPaths(turn),
      collaborationMode: turn.params.collaborationMode ?? null,
      cwd,
      items: ((projectConversationTurn as unknown as (
        turn: Record<string, unknown>,
        requests: unknown,
        options: Record<string, unknown>,
      ) => { items: unknown[] })(
        turn as unknown as Record<string, unknown>,
        [],
        { includeTurnDiff: false },
      )).items,
      status,
    },
  }) as Array<Record<string, unknown>>;
  for (const artifact of parsed) {
    switch (artifact.type) {
      case "file":
        add({ type: "file", path: cwd == null ? String(artifact.path) : joinPath(cwd, String(artifact.path)) });
        break;
      case "google-drive":
      case "appgen-app":
        add(artifact as unknown as ConversationArtifact);
        break;
      case "website": {
        const target = String(artifact.target);
        add({ type: "website", target: isHttpUrl(target) || cwd == null ? target : joinPath(cwd, target) });
        break;
      }
    }
  }
  const inputItems = [
    ...turn.params.input,
    ...turn.items.flatMap((item) => item.type === "userMessage" ? (item.content as Array<Record<string, unknown>>) : []),
  ];
  for (const item of inputItems) {
    if (item.type !== "text") continue;
    for (const app of extractAppgenLinks(String(item.text)) as Array<Record<string, unknown>>) {
      artifacts.push({ ...app, type: "appgen-app" } as unknown as ConversationArtifact);
    }
  }
  return artifacts;
}

function collectArtifactGroups(
  turns: ConversationTurn[],
  {
    apps,
    includeGeneratedImages = false,
    includePages = false,
    projectlessOutputDirectory: outputDirectory = null,
  }: CollectArtifactOptions = {},
): ConversationArtifact[][] {
  const canonicalExternalResources = apps == null
    ? null
    : new Map(
        collectExternalResources(turns, apps, includePages)
          .filter(isWrittenExternalResource)
          .map((resource) => [resource.key, resource]),
      );
  const groups: ConversationArtifact[][] = [];
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    const externalArtifacts = apps == null || canonicalExternalResources == null
      ? []
      : collectExternalResources([turn], apps, includePages)
          .filter(isWrittenExternalResource)
          .map((resource) => ({
            type: "external-resource" as const,
            resource: canonicalExternalResources.get(resource.key) ?? resource,
          }));
    groups.push(
      [...externalArtifacts, ...collectTurnLocalArtifacts(turn, outputDirectory, includeGeneratedImages)]
        .map((artifact) => turn.turnStartedAtMs == null
          ? artifact
          : { ...artifact, producedAtMs: turn.turnStartedAtMs }),
    );
  }
  return groups;
}

function collectConversationArtifacts(
  turns: ConversationTurn[],
  options: CollectArtifactOptions = {},
): ConversationArtifact[] {
  return mergeArtifactGroups(collectArtifactGroups(turns, options));
}

function filterExistingArtifacts(
  artifacts: ConversationArtifact[],
  existingPaths: Iterable<string> | null,
): ConversationArtifact[] {
  if (existingPaths == null) return artifacts;
  const normalizedPaths = new Set(Array.from(existingPaths, normalizeArtifactPath));
  return artifacts.filter((artifact) => {
    switch (artifact.type) {
      case "file":
      case "generated-image":
        return normalizedPaths.has(normalizeArtifactPath(artifact.path));
      default:
        return true;
    }
  });
}

function turnHasNonWebMcpCall(turn: ConversationTurn): boolean {
  return (flattenConversationItems(turn.items) as Array<Record<string, unknown>>).some(
    (item) => item.type === "mcpToolCall" && !isWebMcpServer(item.server),
  );
}

let artifactsWithExternalResources: unknown;
let localArtifacts: unknown;

function initializeLocalConversationArtifactsSignals(): void {
  initializeSignalRuntime();
  initializeUtilities();
  initializeConversationScope();
  initializeTurnArtifacts();
  initializeQueryRuntime();
  initializeArtifactModel();
  initializeLocalConversationSourcesSignals();

  const allArtifacts = createScopedSignalFamily(
    appScope,
    ({ conversationId, hostId }: { conversationId: string; hostId: string }, { get }: { get(signal: unknown, parameter: unknown): unknown }) => {
      const turns = (get(priorConversationTurns, conversationId) as ConversationTurn[] | null) ?? [];
      const latest = get(latestConversationTurn, conversationId) as ConversationTurn | null;
      const combined = latest == null ? turns : [...turns, latest];
      const needsProviders = combined.some(turnHasNonWebMcpCall);
      const apps = needsProviders
        ? ((get(externalSourceProviderQuery, hostId) as { data?: unknown[] })?.data ?? [])
        : undefined;
      return collectConversationArtifacts(combined, {
        apps,
        includeGeneratedImages: get(conversationMode, conversationId) === "projectless",
        projectlessOutputDirectory: get(projectlessOutputDirectory, conversationId) as string | null,
      });
    },
    { isEqual: Object.is },
  );
  artifactsWithExternalResources = allArtifacts;
  localArtifacts = createScopedSignalFamily(
    appScope,
    ({ conversationId }: { conversationId: string }, { get }: { get(signal: unknown, parameter: unknown): unknown }) => {
      const turns = (get(priorConversationTurns, conversationId) as ConversationTurn[] | null) ?? [];
      const latest = get(latestConversationTurn, conversationId) as ConversationTurn | null;
      return collectConversationArtifacts(latest == null ? turns : [...turns, latest], {
        includeGeneratedImages: false,
        projectlessOutputDirectory: get(projectlessOutputDirectory, conversationId) as string | null,
      });
    },
  );
  void externalSourceProvidersQuery;
}

function initializeArtifactModel(): void {
  initializeUtilities();
  initializeAppgenArtifactLinks();
  initializeArtifactUrls();
  initializeConversationHelpers();
  initializeArtifactTypes();
  initializeArtifactExtraction();
  initializeConversationProjection();
  initializeArtifactParser();
  initializeArtifactMarkdown();
  initializeGeneratedImages();
  initializePathUtilities();
  initializeLocalConversationExternalResources();
  void initializeDeepEqual;
}

export {
  initializeArtifactModel as a,
  isGeneratedImageFilename as i,
  artifactsWithExternalResources as n,
  initializeLocalConversationArtifactsSignals as r,
  localArtifacts as t,
};
