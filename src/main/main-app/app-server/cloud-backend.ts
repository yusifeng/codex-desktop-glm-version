// AppServer 云后端 HTTP 客户端 + 混合 ws/http transport + 特性开关下发。
//
// 对应 main-C-Mhak1n.ts 63,542-63,936：
//   - kT AppServerHttpClient（63,547-63,593）：wss→https 化的 Bearer 请求
//   - 只读方法 schema（AT/jT/MT/dEe/fEe/pEe/NT/PT/FT/mEe，63,595-63,643）
//   - hEe HybridWebsocketHttpTransport（63,644-63,762）：把 thread/read 等
//     只读请求改走 HTTP GET，前后双验 token principal（TOCTOU 防护）
//   - 实验开关组装（gEe/_Ee，63,763-63,777）
//   - vEe AppServerFeatureEnablement（63,778-63,872）：按 hostId 订阅连接 +
//     statsig 变更 → experimentalFeature/enablement/set + rollout/compress
//   - yEe threadStream 广播 handler 工厂（63,873-63,936）
import { net } from "electron";
import {
  wf as objectSchema,
  Df as strictObjectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  df as enumSchema,
  bf as literalSchema,
  vf as discriminatedUnionSchema,
  xf as looseObjectSchema,
  jf as unionSchema,
  Mf as unknownSchema,
  _s as LONG_LIVED_HOST_ID,
  _i as principalOfToken,
  pr as websocketReadyState,
  Wn as NotReadyError,
  Wu as appServerVersionSupports,
  td as InMemoryInterceptor,
  Ld as lodashIsEqualModule,
} from "@chunk/shared";
import { createTaggedLogger } from "@chunk/logger";
import { mt as applyAuthHeaders } from "@chunk/bootstrap";

// ---------------------------------------------------------------------------
// 云后端 HTTP 客户端（原 `kT`）
// ---------------------------------------------------------------------------

const CLOUD_BACKEND_WS_URL = "wss://codex-cloud-backend.chatgpt.com/";
/** shared chunk 的 in-memory 请求拦截器单例（原 `uEe`，顶层构造）。 */
const requestInterceptor = new InMemoryInterceptor();

/** Long-lived host 描述（原 `OT`）。 */
function longLivedHostDescriptor(_options: unknown) {
  return { id: LONG_LIVED_HOST_ID, display_name: "Long-lived", kind: "local", websocket_url: CLOUD_BACKEND_WS_URL };
}

interface CloudBackendFetchOptions {
  method: string;
  body?: unknown;
  signal?: AbortSignal;
  token?: string | null;
  trace?: { traceparent: string; tracestate?: string } | null;
}

/** AppServer 云后端 HTTP 客户端（原 `kT`）。 */
class AppServerHttpClient {
  getDesktopAuthToken: () => Promise<string | null>;
  options: unknown;

  constructor(getDesktopAuthToken: () => Promise<string | null>, options: unknown) {
    this.getDesktopAuthToken = getDesktopAuthToken;
    this.options = options;
  }

  async getAuthToken(): Promise<string | null> {
    return await this.getDesktopAuthToken();
  }

  async fetch(path: string, options: CloudBackendFetchOptions) {
    const token = options.token ?? (await this.getAuthToken());
    if (!token) throw new Error("ChatGPT authentication is required");
    const headers: Record<string, unknown> = { "Content-Type": "application/json" };
    applyAuthHeaders(headers, token, this.options);
    if (options.trace != null) {
      headers.traceparent = options.trace.traceparent;
      if (options.trace.tracestate != null) headers.tracestate = options.trace.tracestate;
    }
    const origin = this.httpsOrigin();
    const url = new URL(path, origin);
    if (!path.startsWith("/") || path.startsWith("//") || url.origin !== origin.origin)
      throw new Error("App-server HTTP path is unavailable");
    return {
      response: await net.fetch(url.href, {
        method: options.method,
        headers: headers as Record<string, string>,
        redirect: "error",
        cache: "no-store",
        signal: options.signal ?? AbortSignal.timeout(3e4),
        body: options.body as BodyInit | undefined,
      }),
      token,
    };
  }

  /** wss→https 化 + 安全校验（原 `#e`）。 */
  private httpsOrigin(): URL {
    const descriptor = longLivedHostDescriptor(this.options);
    if (!descriptor.websocket_url) throw new Error("App-server is unavailable");
    const url = new URL(descriptor.websocket_url);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    )
      throw new Error("App-server HTTP URL is unavailable");
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  }
}

// ---------------------------------------------------------------------------
// 只读方法 schema（原 `AT`~`mEe`）
// ---------------------------------------------------------------------------

const paginationSchema = strictObjectSchema({ cursor: stringSchema().nullish(), limit: numberSchema().nullish() });
const threadPaginationSchema = paginationSchema.extend({
  threadId: stringSchema(),
  sortDirection: enumSchema(["asc", "desc"]).nullish(),
  threadAccess: literalSchema("shared").nullish(),
});
const requestBaseSchema = objectSchema({
  id: unionSchema([stringSchema(), numberSchema()]),
  trace: objectSchema({ traceparent: stringSchema(), tracestate: stringSchema().optional() }).optional(),
});
/** 可改走 HTTP 的只读请求（原 `dEe`）。 */
const readOnlyRequestSchema = discriminatedUnionSchema("method", [
  requestBaseSchema.extend({
    method: literalSchema("thread/read"),
    params: strictObjectSchema({ threadId: stringSchema(), includeTurns: literalSchema(false).nullish() }),
  }),
  requestBaseSchema.extend({
    method: literalSchema("model/list"),
    params: paginationSchema.extend({ includeHidden: booleanSchema().nullish() }).nullish(),
  }),
  requestBaseSchema.extend({
    method: enumSchema(["collaborationMode/list", "account/rateLimits/read", "thread/realtime/listVoices"]),
    params: strictObjectSchema({}).nullish(),
  }),
  requestBaseSchema.extend({
    method: literalSchema("thread/turns/list"),
    params: threadPaginationSchema.extend({ itemsView: enumSchema(["notLoaded", "full"]).nullish() }),
  }),
  requestBaseSchema.extend({
    method: literalSchema("thread/items/list"),
    params: threadPaginationSchema.extend({ turnId: stringSchema().nullish() }),
  }),
]);
const httpErrorSchema = objectSchema({ error: objectSchema({ code: numberSchema(), message: stringSchema(), data: unknownSchema().optional() }) });
const threadMetadataSchema = looseObjectSchema({ thread: looseObjectSchema({ id: stringSchema() }) });
const listResultSchema = looseObjectSchema({ data: arraySchema(looseObjectSchema({})) });
const cursorResultSchema = listResultSchema.extend({ nextCursor: stringSchema().nullable() });
const bidirectionalCursorResultSchema = cursorResultSchema.extend({ backwardsCursor: stringSchema().nullable() });
/** 各方法的响应 schema（原 `mEe`）。 */
const readOnlyResponseSchemas: Record<string, unknown> = {
  "model/list": cursorResultSchema,
  "collaborationMode/list": listResultSchema,
  "account/rateLimits/read": looseObjectSchema({ rateLimits: looseObjectSchema({}) }),
  "thread/realtime/listVoices": looseObjectSchema({ voices: looseObjectSchema({}) }),
  "thread/turns/list": bidirectionalCursorResultSchema,
  "thread/items/list": bidirectionalCursorResultSchema,
};

// ---------------------------------------------------------------------------
// 混合 ws/http transport（原 `hEe`）
// ---------------------------------------------------------------------------

interface HybridWebSocket {
  authenticatedPrincipal: { accountId: string; userId: string } | null;
  readyState: number;
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

/** 只读请求改走 HTTP 的混合 transport（原 `hEe`）。 */
class HybridWebsocketHttpTransport {
  websocket: { connect(): Promise<HybridWebSocket>; supportsReconnect(): boolean };
  http: AppServerHttpClient;
  kind = "websocket";

  constructor(websocket: HybridWebsocketHttpTransport["websocket"], http: AppServerHttpClient) {
    this.websocket = websocket;
    this.http = http;
  }

  supportsReconnect(): boolean {
    return this.websocket.supportsReconnect();
  }

  async connect() {
    const inner = await this.websocket.connect();
    const httpAbort = new AbortController();
    const hybrid: HybridWebSocket = {
      authenticatedPrincipal: inner.authenticatedPrincipal,
      get readyState() {
        return inner.readyState;
      },
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      send: (data) => {
        const parsed = readOnlyRequestSchema.safeParse(JSON.parse(data));
        if (!parsed.success || httpAbort.signal.aborted || inner.readyState !== (websocketReadyState as unknown as { Open: number }).Open) {
          inner.send(data);
          return;
        }
        const request = parsed.data as { id: string | number; method: string; params?: Record<string, unknown>; trace?: { traceparent: string; tracestate?: string } };
        const signal = AbortSignal.any([httpAbort.signal, AbortSignal.timeout(3e4)]);
        this.readOverHttp(request, inner, signal)
          .catch((error) => ({
            id: request.id,
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : "ASB HTTP read failed",
            },
          }))
          .then((response) => {
            if (!httpAbort.signal.aborted)
              hybrid.onmessage?.({ data: JSON.stringify(response), receivedAtMs: Date.now() } as never);
          });
      },
      close: (code, reason) => {
        httpAbort.abort();
        inner.close(code, reason);
      },
    };
    inner.onopen = (event) => hybrid.onopen?.(event);
    inner.onmessage = (event) => hybrid.onmessage?.(event);
    inner.onerror = (event) => hybrid.onerror?.(event);
    inner.onclose = (event) => {
      httpAbort.abort();
      hybrid.onclose?.(event);
    };
    return hybrid;
  }

  /** HTTP 读（原 `read`）：前后双验 principal，防账号中途切换。 */
  async readOverHttp(
    request: { id: string | number; method: string; params?: Record<string, unknown>; trace?: { traceparent: string; tracestate?: string } },
    connection: HybridWebSocket,
    signal: AbortSignal,
  ) {
    const token = await this.http.getAuthToken();
    const principal = principalOfToken(token);
    if (
      token == null ||
      principal == null ||
      principal.accountId !== connection.authenticatedPrincipal?.accountId ||
      principal.userId !== connection.authenticatedPrincipal?.userId
    )
      throw new Error("App server account changed");
    let path: string;
    switch (request.method) {
      case "thread/read":
        path = `/v1/threads/${encodeURIComponent((request.params as { threadId: string }).threadId)}`;
        break;
      case "model/list":
        path = "/v2/models";
        break;
      case "collaborationMode/list":
        path = "/v2/collaboration-modes";
        break;
      case "account/rateLimits/read":
        path = "/v2/account/rate-limits";
        break;
      case "thread/realtime/listVoices":
        path = "/v2/realtime/voices";
        break;
      case "thread/turns/list":
        path = `/v2/threads/${encodeURIComponent((request.params as { threadId: string }).threadId)}/turns`;
        break;
      case "thread/items/list":
        path = `/v2/threads/${encodeURIComponent((request.params as { threadId: string }).threadId)}/items`;
        break;
      default:
        throw new Error(`ASB HTTP read failed (unknown method)`);
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(request.params ?? {}))
      if (key !== "threadId" && key !== "includeTurns" && value != null) query.set(key, String(value));
    const { response } = await this.http.fetch(query.size === 0 ? path : `${path}?${query}`, {
      method: "GET",
      token,
      signal,
      trace: request.trace,
    });
    const body = await response.json().catch(() => null);
    const afterPrincipal = principalOfToken(await this.http.getAuthToken());
    if (signal.throwIfAborted(), afterPrincipal?.accountId !== principal.accountId || afterPrincipal.userId !== principal.userId)
      throw new Error("App server account changed");
    if (!response.ok) {
      const parsed = httpErrorSchema.safeParse(body);
      if (parsed.success) return { id: request.id, error: (parsed.data as { error: unknown }).error };
      throw new Error(`ASB HTTP read failed (${response.status})`);
    }
    if (request.method !== "thread/read") {
      const parsed = (readOnlyResponseSchemas[request.method] as {
        safeParse(input: unknown): { success: boolean; data?: unknown };
      }).safeParse(body);
      if (!parsed.success) throw new Error("App server returned an invalid read response");
      return { id: request.id, result: parsed.data };
    }
    const metadata = threadMetadataSchema.safeParse(body);
    if (!metadata.success || (metadata.data as { thread: { id: string } }).thread.id !== (request.params as { threadId: string }).threadId)
      throw new Error("App server returned an invalid metadata response");
    return {
      id: request.id,
      result: { ...body, thread: { ...(body as { thread: object }).thread, turns: [] } },
    };
  }
}

// ---------------------------------------------------------------------------
// 实验开关组装（原 `gEe`/`_Ee`）
// ---------------------------------------------------------------------------

/** 透传的开关名（原 `gEe`）。 */
const PASSTHROUGH_ENABLEMENT_KEYS = ["apps_mcp_path_override", "auth_elicitation", "tool_suggest"];

/** 组装 enablement（原 `_Ee`）。 */
function composeEnablement(
  defaults: Record<string, unknown>,
  curatedRemoteMarketplace: boolean,
  mcp20260728: boolean,
  backgroundPaginatedRolloutMigration: boolean,
  apiKeyModelDiscovery: boolean,
) {
  const enablement: Record<string, unknown> = { memories: false };
  for (const key of PASSTHROUGH_ENABLEMENT_KEYS) {
    const value = defaults[key];
    if (typeof value == "boolean") enablement[key] = value;
  }
  enablement.mcp_2026_07_28 = mcp20260728;
  enablement.remote_plugin = curatedRemoteMarketplace;
  if (backgroundPaginatedRolloutMigration) enablement.background_paginated_rollout_migration = true;
  enablement.api_key_model_discovery = apiKeyModelDiscovery;
  return enablement;
}

// ---------------------------------------------------------------------------
// 特性开关下发（原 `vEe`）
// ---------------------------------------------------------------------------

interface HostConnection {
  hostId: string;
  getConnectionState(): string;
  appServerVersion: string;
  registerInternalConnectionStateHandler(cb: () => void): () => void;
  sendAppServerRequest(method: string, params: unknown, guard?: () => void): Promise<unknown>;
}

interface FeatureEnablementEvaluations {
  onDidChange(cb: () => void): () => void;
  readExecutionAssignments(): Promise<{
    defaultEnableFeatures: Record<string, unknown> | null;
    values: {
      experimentalFeatureGates: {
        curatedRemoteMarketplace: boolean;
        mcp20260728: boolean;
        codexAppsMcp20260728: boolean;
        backgroundPaginatedRolloutMigration: boolean;
        localThreadStoreCompression: boolean;
        apiKeyModelDiscovery: boolean;
      };
    };
  } | null>;
  readReadyExecutionAssignments(): unknown;
}

/** 按 host 连接下发实验开关（原 `vEe`）。 */
class AppServerFeatureEnablement {
  evaluations: FeatureEnablementEvaluations;
  onChanged: (hostId: string) => void;
  logger = createTaggedLogger("app-server-feature-enablement");
  connections = new Map<string, { connection: HostConnection; generation: number; rolloutCompressionRequested: boolean; stopWatching(): void }>();
  stopWatchingPolicy: () => void;
  stopWatchingConnections: () => void;
  disposed = false;

  constructor(
    registry: { subscribe(cb: (event: { hostId: string; type: string; connection: HostConnection }) => void): () => void },
    evaluations: FeatureEnablementEvaluations,
    onChanged: (hostId: string) => void,
  ) {
    this.evaluations = evaluations;
    this.onChanged = onChanged;
    this.stopWatchingPolicy = evaluations.onDidChange(() => {
      for (const entry of this.connections.values()) this.sync(entry);
    });
    this.stopWatchingConnections = registry.subscribe((event) => {
      if (event.hostId === "durable") return;
      if (event.type === "removed") {
        const entry = this.connections.get(event.hostId);
        if (entry != null) {
          entry.generation++;
          entry.stopWatching();
          this.connections.delete(event.hostId);
        }
        return;
      }
      const entry = {
        connection: event.connection,
        generation: 0,
        rolloutCompressionRequested: false,
        stopWatching: event.connection.registerInternalConnectionStateHandler(() => this.sync(entry)),
      };
      this.connections.set(event.hostId, entry);
      this.sync(entry);
    });
  }

  dispose() {
    this.disposed = true;
    this.stopWatchingPolicy();
    this.stopWatchingConnections();
    for (const entry of this.connections.values()) {
      entry.generation++;
      entry.stopWatching();
    }
    this.connections.clear();
  }

  /** 连接就绪或开关变化时同步（generation 防乱序，原 `sync`）。 */
  sync(entry: { connection: HostConnection; generation: number; rolloutCompressionRequested: boolean }) {
    const generation = ++entry.generation;
    if (entry.connection.getConnectionState() !== "connected") {
      entry.rolloutCompressionRequested = false;
      return;
    }
    this.sendEnablement(entry, generation).catch((error) => {
      if (
        !this.disposed &&
        entry.generation === generation &&
        !(error instanceof NotReadyError)
      )
        this.logger.warning("Failed to sync experimental feature enablement", {
          safe: {},
          sensitive: { error },
        });
    });
  }

  async sendEnablement(entry: { connection: HostConnection; generation: number; rolloutCompressionRequested: boolean }, generation: number) {
    const assignments = await this.evaluations.readExecutionAssignments();
    if (this.disposed || entry.generation !== generation || assignments?.defaultEnableFeatures == null) return;
    const gates = assignments.values.experimentalFeatureGates;
    const enablement = composeEnablement(
      assignments.defaultEnableFeatures,
      gates.curatedRemoteMarketplace,
      gates.mcp20260728,
      gates.backgroundPaginatedRolloutMigration,
      gates.apiKeyModelDiscovery,
    );
    enablement.codex_apps_mcp_2026_07_28 = gates.codexAppsMcp20260728;
    enablement.windows_sandbox_service = true;
    // 开关在请求落地的瞬间仍须有效（原 o 守卫）。
    const assertStillCurrent = () => {
      if (
        this.disposed ||
        entry.generation !== generation ||
        !deepEqual(this.evaluations.readReadyExecutionAssignments(), assignments)
      )
        throw new NotReadyError({ status: "not-ready", reason: "execution-config-loading" });
    };
    if (
      gates.localThreadStoreCompression &&
      !entry.rolloutCompressionRequested &&
      appServerVersionSupports(entry.connection.appServerVersion, "rolloutCompression")
    )
      entry.connection
        .sendAppServerRequest("rollout/compress", undefined, () => {
          assertStillCurrent();
          entry.rolloutCompressionRequested = true;
        })
        .catch((error) => {
          if (
            !this.disposed &&
            entry.generation === generation &&
            !(error instanceof NotReadyError)
          )
            this.logger.warning("Failed to trigger rollout compression", {
              safe: {},
              sensitive: { error },
            });
        });
    await entry.connection.sendAppServerRequest("experimentalFeature/enablement/set", { enablement }, assertStillCurrent);
    if (!this.disposed && entry.generation === generation) this.onChanged(entry.connection.hostId);
  }
}

// vendored lodash isEqual（shared chunk `s_` 的 CJS 包装，原 `G = e.a(n.Ld())`）。
const deepEqual = (lodashIsEqualModule() as { default: (a: unknown, b: unknown) => boolean }).default;

// ---------------------------------------------------------------------------
// threadStream 广播 handler 工厂（原 `yEe`）
// ---------------------------------------------------------------------------

interface ThreadStreamBroadcastTarget {
  onFollowingChanged(conversationId: string, hostId: string, sourceClientId: string | undefined, following: unknown): void;
  onFollowingStatusRequested(conversationId: string, hostId: string, sourceClientId: string | undefined): void;
  onStreamStateChanged(conversationId: string, hostId: string, change: unknown, sourceClientId: string | undefined): void;
  onClientStatusChanged(params: unknown): void;
  onConnectionReset(): void;
}

interface ThreadStreamBridge {
  registerBroadcastHandler(name: string, handler: (event: never) => void): () => void;
  threadStreamFollowingStatusRequested?(params: { conversationId: string; hostId: string }): unknown;
  threadStreamStateChanged?(params: {
    conversationId: string;
    hostId: string;
    targetClientIds?: string[];
    change: Record<string, unknown>;
  }): unknown;
  threadStreamFollowingChanged?(params: {
    conversationId: string;
    hostId: string;
    following: unknown;
    targetClientIds?: string[];
  }): unknown;
  setThreadOwnership?(params: { hostId: string; conversationId: string; ownsThread: boolean }): unknown;
}

/** threadStream 的 5 个广播 handler（原 `yEe`）。 */
function createThreadStreamBroadcastHandlers(bridge: ThreadStreamBridge, serializeConversationState: (state: unknown) => unknown) {
  return {
    register(target: ThreadStreamBroadcastTarget) {
      const disposers = [
        bridge.registerBroadcastHandler("thread-stream-following-changed", ((event: { params: { conversationId: string; hostId: string; following: unknown }; sourceClientId?: string }) =>
          target.onFollowingChanged(event.params.conversationId, event.params.hostId, event.sourceClientId, event.params.following)) as never),
        bridge.registerBroadcastHandler("thread-stream-following-status-requested", ((event: { params: { conversationId: string; hostId: string }; sourceClientId?: string }) =>
          target.onFollowingStatusRequested(event.params.conversationId, event.params.hostId, event.sourceClientId)) as never),
        bridge.registerBroadcastHandler("thread-stream-state-changed", ((event: { params: { conversationId: string; hostId: string; change: unknown }; sourceClientId?: string }) =>
          target.onStreamStateChanged(event.params.conversationId, event.params.hostId, event.params.change, event.sourceClientId)) as never),
        bridge.registerBroadcastHandler("client-status-changed", ((event: { params: unknown }) => target.onClientStatusChanged(event.params)) as never),
        bridge.registerBroadcastHandler("ipc-connection-reset", (() => target.onConnectionReset()) as never),
      ];
      return () => {
        for (const dispose of disposers) dispose();
      };
    },
    requestFollowingStatus(conversationId: string, hostId: string) {
      return bridge.threadStreamFollowingStatusRequested?.({ conversationId, hostId });
    },
    sendPatches(conversationId: string, hostId: string, targetClientIds: string[] | undefined, baseRevision: number, revision: number, patches: unknown, acceptedTextChanges: unknown) {
      return bridge.threadStreamStateChanged?.({
        conversationId,
        hostId,
        targetClientIds,
        change: {
          type: "patches",
          baseRevision,
          revision,
          patches,
          acceptedTextChanges,
        },
      });
    },
    sendSnapshot(conversationId: string, hostId: string, targetClientIds: string[] | undefined, revision: number, conversationState: unknown) {
      return bridge.threadStreamStateChanged?.({
        conversationId,
        hostId,
        targetClientIds,
        change: { type: "snapshot", revision, conversationState: serializeConversationState(conversationState) },
      });
    },
    sendFollowingChanged(conversationId: string, hostId: string, following: unknown, targetClientIds: string[] | undefined) {
      return bridge.threadStreamFollowingChanged?.({
        conversationId,
        hostId,
        following,
        targetClientIds,
      });
    },
    setThreadOwnership(conversationId: string, hostId: string, ownsThread: boolean) {
      return bridge.setThreadOwnership?.({ hostId, conversationId, ownsThread });
    },
  };
}

export {
  CLOUD_BACKEND_WS_URL,
  requestInterceptor,
  longLivedHostDescriptor,
  AppServerHttpClient,
  readOnlyRequestSchema,
  readOnlyResponseSchemas,
  HybridWebsocketHttpTransport,
  composeEnablement,
  AppServerFeatureEnablement,
  createThreadStreamBroadcastHandlers,
  type HostConnection,
  type ThreadStreamBridge,
};
