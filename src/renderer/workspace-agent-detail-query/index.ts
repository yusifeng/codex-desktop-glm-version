import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  $O as staleTimes,
  FX as initializeMaitai,
  QI as initializeScope,
  QX as createQueryFamily,
  XX as createInfiniteQueryFamily,
  ZI as appScope,
  ek as initializeQueryRuntime,
  pL as queryOptions,
} from "@rchunk/app-shared";
import {
  Bw as workspaceAgentEnabled,
  Sun as initializeWorkspaceAgentEnabled,
  XGt as parseSafeUrl,
  YGt as initializeSafeUrl,
  _dn as desktopHttpClient,
  aJt as normalizeDesktopFetchUrl,
  cJt as initializeApiClient,
  gmn as initializeUniqueBy,
  mun as accountIdSignal,
  oJt as authenticatedFetchHeaders,
  pdn as initializeDesktopHttpClient,
  udn as workspaceAgentApi,
  ydn as initializeAuthenticatedHeaders,
  zw as initializeAccountSignals,
} from "@rchunk/app-initial";

interface ConnectorReference {
  connector_identifier: { connector_id?: string | null; type: string };
}
interface AgentMemoryFile {
  agentId: string;
  fileId?: string | null;
  fileName?: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  updatedAt?: string | null;
}
interface DesktopResponse {
  body: ReadableStream<Uint8Array> | null;
  headers: Headers;
}
interface DesktopFetcher {
  fetch(input: string, init?: RequestInit): Promise<DesktopResponse>;
}

const once = onceExport as (initializer: () => void) => () => void;
const MAX_TEXT_BYTES = 100_000;

function workspaceAgentAppsOptions({
  accountId,
  connectorIds,
  enabled = true,
}: {
  accountId: string;
  connectorIds: readonly string[];
  enabled?: boolean;
}) {
  const ids = [...new Set(connectorIds)].sort();
  return queryOptions({
    queryKey: ["workspace-agent", "apps", accountId, ids],
    queryFn: ({ signal }: { signal: AbortSignal }) => loadApps(ids, signal),
    enabled,
    retry: false,
    staleTime: staleTimes.FIVE_MINUTES,
  });
}

function connectorActionsOptions(accountId: string, connectorId: string) {
  return queryOptions({
    queryKey: ["workspace-agent", "connector-actions", accountId, connectorId],
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      (
        await workspaceAgentApi.safeGet<{ actions: unknown[] }>(
          "/aip/connectors/{connector_id}/actions",
          {
            parameters: { path: { connector_id: connectorId } },
            signal,
          },
        )
      ).actions,
    retry: false,
    staleTime: staleTimes.FIVE_MINUTES,
  });
}

function connectorReadinessOptions({
  accountId,
  agentId,
  versionScope,
  enabled = true,
}: {
  accountId: string;
  agentId: string;
  versionScope: string;
  enabled?: boolean;
}) {
  return queryOptions({
    queryKey: [
      "workspace-agent",
      "connector-readiness",
      accountId,
      agentId,
      versionScope,
    ],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      workspaceAgentApi.safeGet(
        "/hermes/agent/{agent_id}/list-connector-readiness",
        {
          parameters: {
            path: { agent_id: agentId },
            query: { version_scope: versionScope },
          },
          signal,
        },
      ),
    enabled,
    retry: false,
    staleTime: staleTimes.ONE_MINUTE,
  });
}

function connectorId(reference: ConnectorReference): string | null {
  return reference.connector_identifier.type === "CONNECTOR_ID"
    ? (reference.connector_identifier.connector_id ?? null)
    : null;
}

async function loadApps(requestedIds: readonly string[], signal?: AbortSignal) {
  const browse = await workspaceAgentApi.safeGet<{
    recommended_apps: Array<Record<string, unknown> & { id: string }>;
    workspace_apps: Array<Record<string, unknown> & { id: string }>;
    public_apps: Array<Record<string, unknown> & { id: string }>;
  }>("/hermes/apps/browse", { signal });
  const indexed = new Map<
    string,
    Record<string, any> & { id: string; source: string }
  >();
  for (const [source, apps] of [
    ["recommended", browse.recommended_apps],
    ["workspace", browse.workspace_apps],
    ["public", browse.public_apps],
  ] as const) {
    for (const app of apps)
      if (!indexed.has(app.id)) indexed.set(app.id, { ...app, source });
  }
  const ids = [...new Set([...indexed.keys(), ...requestedIds])];
  const content =
    ids.length === 0
      ? { apps: [], missing_app_ids: [] as string[] }
      : await workspaceAgentApi.safePost<{
          apps: Array<Record<string, any> & { id: string; name: string }>;
          missing_app_ids: string[];
        }>("/hermes/apps/content", { requestBody: { app_ids: ids }, signal });
  const contentById = new Map(content.apps.map((app) => [app.id, app]));
  const apps = [];
  for (const id of ids) {
    const item = contentById.get(id);
    if (item == null) continue;
    const listing = indexed.get(id);
    apps.push({
      id,
      name: item.name,
      description:
        item.description?.trim() || listing?.subtitle?.trim() || null,
      logoUrl: item.logo_url ?? listing?.logo_url ?? null,
      logoDarkUrl: item.logo_url_dark ?? listing?.logo_dark_url ?? null,
      source: listing?.source ?? "selected",
      disabledByAdmin: listing?.disabled_by_admin === true,
      connectorType: item.connector_type ?? null,
      status: item.status ?? null,
      supportedAuthTypes: item.supported_auth_types ?? null,
    });
  }
  return { apps, missingConnectorIds: content.missing_app_ids };
}

function isTextFile(mimeType?: string | null, fileName?: string): boolean {
  const normalized = mimeType?.split(";", 1)[0].trim().toLowerCase();
  if (
    normalized?.startsWith("text/") ||
    normalized === "application/json" ||
    normalized?.endsWith("+json") ||
    normalized === "application/xml" ||
    normalized?.endsWith("+xml") ||
    normalized === "application/javascript" ||
    normalized === "application/x-yaml"
  )
    return true;
  if (normalized != null && normalized !== "application/octet-stream")
    return false;
  return /\.(?:css|csv|html?|js|json|jsx|log|md|mdx|py|text|toml|ts|tsx|txt|xml|ya?ml)$/i.test(
    fileName ?? "",
  );
}

async function readTextResponse(
  response: DesktopResponse,
  signal: AbortSignal,
) {
  if (response.body == null)
    return { kind: "text" as const, content: "", truncated: false };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let content = "";
  let truncated = false;
  for (;;) {
    signal.throwIfAborted();
    const chunk = await reader.read();
    if (chunk.done) {
      content += decoder.decode();
      break;
    }
    const remaining = MAX_TEXT_BYTES - bytesRead;
    if (chunk.value.byteLength > remaining) {
      content += decoder.decode(chunk.value.subarray(0, remaining), {
        stream: true,
      });
      content += decoder.decode();
      truncated = true;
      await reader.cancel();
      break;
    }
    bytesRead += chunk.value.byteLength;
    content += decoder.decode(chunk.value, { stream: true });
  }
  return { kind: "text" as const, content, truncated };
}

async function readMemoryFile(input: AgentMemoryFile, signal: AbortSignal) {
  const download = await workspaceAgentApi.safeGet<Record<string, any>>(
    "/hermes/agent/{agent_id}/persistent-folder/files/{file_id}/download_url",
    {
      parameters: {
        path: { agent_id: input.agentId, file_id: input.fileId ?? "" },
      },
      signal,
    },
  );
  const safeUrl = (parseSafeUrl as unknown as (value: string) => string | null)(
    download.download_url,
  );
  if (safeUrl == null)
    throw new Error("Workspace Agent memory file download URL is unsafe");
  if (
    !isTextFile(
      download.mime_type ?? input.mimeType,
      download.file_name ?? input.fileName,
    )
  ) {
    return { kind: "unsupported" as const, reason: "binary" as const };
  }
  const size = download.size_bytes ?? input.sizeBytes;
  if (size != null && size > MAX_TEXT_BYTES)
    return { kind: "unsupported" as const, reason: "too-large" as const };
  const fetcher = desktopHttpClient.getInstance() as unknown as DesktopFetcher;
  const response = await fetcher.fetch(
    normalizeDesktopFetchUrl(safeUrl) ?? safeUrl,
    {
      headers:
        download.needs_auth_token === true
          ? authenticatedFetchHeaders()
          : undefined,
      signal,
    },
  );
  const contentLength = Number(response.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_TEXT_BYTES) {
    await response.body?.cancel();
    return { kind: "unsupported" as const, reason: "too-large" as const };
  }
  return readTextResponse(response, signal);
}

const initializeUniqueByRuntime = once(() => {
  initializeUniqueBy();
  initializeQueryRuntime();
  initializeDesktopHttpClient();
});

let detailQuery: any;
let activityQuery: any;
let memoryQuery: any;
let memoryFileQuery: any;
let appsQuery: any;

const initializeWorkspaceAgentDetailQuery = once(() => {
  initializeMaitai();
  initializeWorkspaceAgentEnabled();
  initializeApiClient();
  initializeSafeUrl();
  initializeScope();
  initializeQueryRuntime();
  initializeDesktopHttpClient();
  initializeAuthenticatedHeaders();
  initializeAccountSignals();
  initializeUniqueByRuntime();
  detailQuery = createQueryFamily(appScope, (agentId: string, { get }: any) => {
    const accountId = get(accountIdSignal);
    return {
      enabled: accountId != null && get(workspaceAgentEnabled) === true,
      queryKey: ["workspace-agent", "detail", accountId, agentId],
      queryFn: ({ signal }: any) =>
        workspaceAgentApi.safeGet("/hermes/agent/{agent_id}/detail-view", {
          parameters: { path: { agent_id: agentId } },
          signal,
        }),
      retry: false,
      staleTime: staleTimes.ONE_MINUTE,
    };
  });
  activityQuery = createInfiniteQueryFamily(
    appScope,
    (agentId: string, { get }: any) => {
      const accountId = get(accountIdSignal);
      return {
        enabled: accountId != null && get(workspaceAgentEnabled) === true,
        initialPageParam: null,
        queryKey: ["workspace-agent", "activity", accountId, agentId],
        queryFn: ({ pageParam, signal }: any) =>
          workspaceAgentApi.safeGet("/hermes/agent/{agent_id}/conversations", {
            parameters: {
              path: { agent_id: agentId },
              query: { cursor: pageParam, limit: 25 },
            },
            signal,
          }),
        getNextPageParam: (page: { cursor?: string | null }) =>
          page.cursor ?? undefined,
        retry: false,
        staleTime: staleTimes.ONE_MINUTE,
      };
    },
  );
  memoryQuery = createQueryFamily(
    appScope,
    ({ agentId, channel }: any, { get }: any) => {
      const accountId = get(accountIdSignal);
      return {
        enabled: accountId != null && get(workspaceAgentEnabled) === true,
        queryKey: ["workspace-agent", "memory", accountId, agentId, channel],
        queryFn: ({ signal }: any) =>
          workspaceAgentApi.safeGet(
            "/hermes/agent/{agent_id}/persistent-folder/tree",
            {
              parameters: {
                path: { agent_id: agentId },
                query: {
                  channel_binding_type: channel.type,
                  channel_binding_link_id:
                    channel.type === "slack" ? channel.linkId : undefined,
                  channel_binding_channel_id:
                    channel.type === "slack" ? channel.channelId : undefined,
                },
              },
              signal,
            },
          ),
        retry: false,
        staleTime: staleTimes.ONE_MINUTE,
      };
    },
  );
  memoryFileQuery = createQueryFamily(
    appScope,
    (input: AgentMemoryFile, { get }: any) => {
      const accountId = get(accountIdSignal);
      return {
        enabled:
          accountId != null &&
          input.fileId != null &&
          get(workspaceAgentEnabled) === true,
        queryKey: [
          "workspace-agent",
          "memory-file",
          accountId,
          input.agentId,
          input.fileId,
          input.updatedAt,
        ],
        queryFn: ({ signal }: any) => readMemoryFile(input, signal),
        retry: false,
        staleTime: staleTimes.ONE_MINUTE,
      };
    },
  );
  appsQuery = createQueryFamily(
    appScope,
    (ids: readonly string[], { get }: any) => {
      const accountId = get(accountIdSignal);
      return {
        ...workspaceAgentAppsOptions({
          accountId: accountId ?? "",
          connectorIds: ids,
        }),
        enabled:
          accountId != null &&
          ids.length > 0 &&
          get(workspaceAgentEnabled) === true,
      };
    },
  );
});

export {
  memoryFileQuery as a,
  connectorActionsOptions as c,
  initializeUniqueByRuntime as d,
  detailQuery as i,
  connectorId as l,
  activityQuery as n,
  memoryQuery as o,
  appsQuery as r,
  workspaceAgentAppsOptions as s,
  initializeWorkspaceAgentDetailQuery as t,
  connectorReadinessOptions as u,
};
