import { chmodSync } from "node:fs";

import { wc as DYNAMIC_TOOL_NAMESPACES } from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { createNativePipeServer } from "./server";

const MAX_FRAME_BYTES = 8_388_608;
const allowedNamespaces = new Set<string>(DYNAMIC_TOOL_NAMESPACES as string[]);
const logger = memoizedTaggedLogger(`dynamic-app-tools-native-pipe`);

type JsonRpcId = string | number;

interface DynamicAppToolsServerOptions {
  callTool(request: { hostId: string; params: Record<string, any> }, signal: AbortSignal): Promise<unknown>;
  listTools(threadStartKind: `default` | `all`): Promise<any[]>;
  pipePath?: string;
  socketPeerAuthorizer: (socket: unknown) => { authorized: boolean; reason?: string };
  hostId?: string;
}

function requestId(value: unknown): JsonRpcId | null {
  if (typeof value !== `object` || value == null || !(`id` in value)) return null;
  const id = (value as any).id;
  return typeof id === `string` || (typeof id === `number` && Number.isFinite(id)) ? id : null;
}

function requestKey(id: JsonRpcId): string {
  return `${typeof id}:${String(id)}`;
}

function parseRequest(value: unknown): any | null {
  if (typeof value !== `object` || value == null || Array.isArray(value)) return null;
  const request = value as Record<string, any>;
  if (request.jsonrpc !== `2.0` || requestId(request) == null) return null;
  if (request.method === `tools/cancel`) return { id: request.id, jsonrpc: `2.0`, method: request.method };
  if (request.method === `tools/list`) {
    const kind = request.params?.threadStartKind ?? `default`;
    return kind === `default` || kind === `all`
      ? { id: request.id, jsonrpc: `2.0`, method: request.method, params: { threadStartKind: kind } }
      : null;
  }
  if (request.method !== `tools/call`) return null;
  const params = request.params;
  if (
    typeof params !== `object` || params == null || Array.isArray(params) ||
    !Object.hasOwn(params, `arguments`) ||
    !allowedNamespaces.has(params.namespace) ||
    [`callId`, `threadId`, `tool`, `turnId`].some((key) => typeof params[key] !== `string` || params[key].trim().length === 0)
  ) return null;
  return {
    id: request.id,
    jsonrpc: `2.0`,
    method: request.method,
    params: {
      arguments: params.arguments,
      callId: params.callId.trim(),
      namespace: params.namespace,
      threadId: params.threadId.trim(),
      tool: params.tool.trim(),
      turnId: params.turnId.trim(),
    },
  };
}

function projectTools(entries: any[]): any[] {
  return entries.flatMap((entry) =>
    entry.type !== `namespace` || !allowedNamespaces.has(entry.name)
      ? []
      : entry.tools.map((tool: any) => ({
          description: tool.description,
          inputSchema: tool.inputSchema,
          name: tool.name,
          namespace: entry.name,
        })),
  );
}

export async function createDynamicAppToolsServer({
  callTool,
  hostId = `local`,
  listTools,
  pipePath,
  socketPeerAuthorizer,
}: DynamicAppToolsServerOptions) {
  const pendingToolCalls = new Map<string, AbortController>();
  const server = await createNativePipeServer({
    maxIncomingFrameBytes: MAX_FRAME_BYTES,
    maxOutgoingFrameBytes: MAX_FRAME_BYTES,
    pipePath,
    socketPeerAuthorizer,
    events: {
      onListening(path) {
        if (process.platform !== `win32`) chmodSync(path, 0o600);
        logger().info(`dynamic_app_tools_listening`, { safe: {}, sensitive: { pipePath: path } });
      },
      onAuthorizationError(error) {
        logger().warning(`dynamic_app_tools_peer_authorization_failed`, { safe: {}, sensitive: { error } });
      },
      onRejectedSocket(result) {
        logger().warning(`dynamic_app_tools_peer_rejected`, {
          safe: { reason: result.reason ?? `unauthorized` }, sensitive: {},
        });
      },
      onSocketError(error) {
        logger().warning(`dynamic_app_tools_socket_error`, { safe: {}, sensitive: { error } });
      },
    },
  });
  server.setMessageCallback(async (message) => {
    const request = parseRequest(message);
    if (request == null) {
      const id = requestId(message);
      if (id != null)
        server.sendMessage({ error: { code: -32602, message: `Invalid app tool request` }, id, jsonrpc: `2.0` });
      return;
    }
    if (request.method === `tools/cancel`) {
      pendingToolCalls.get(requestKey(request.id))?.abort();
      return;
    }
    const controller = request.method === `tools/call` ? new AbortController() : null;
    if (controller != null) pendingToolCalls.set(requestKey(request.id), controller);
    try {
      const result = request.method === `tools/list`
        ? { tools: projectTools(await listTools(request.params.threadStartKind)) }
        : await callTool({ hostId, params: request.params }, controller!.signal);
      if (controller?.signal.aborted) return;
      if (result == null) throw Error(`The app tool call ended before producing a result`);
      server.sendMessage({ id: request.id, jsonrpc: `2.0`, result });
    } catch (error) {
      if (controller?.signal.aborted) return;
      logger().warning(`dynamic_app_tools_request_failed`, {
        safe: { method: request.method }, sensitive: { error },
      });
      server.sendMessage({
        error: { code: -32_000, message: `Codex app tool request failed` },
        id: request.id,
        jsonrpc: `2.0`,
      });
    } finally {
      if (controller != null) pendingToolCalls.delete(requestKey(request.id));
    }
  });
  return {
    pipePath: server.pipePath,
    async dispose() {
      for (const controller of pendingToolCalls.values()) controller.abort();
      pendingToolCalls.clear();
      await server.close();
    },
  };
}
