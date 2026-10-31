import { chmodSync } from "node:fs";
import { randomUUID } from "node:crypto";

import { memoizedTaggedLogger } from "@chunk/logger";
import { createNativePipeServer } from "./server";

const MAX_FRAME_BYTES = 8_388_608;
const logger = memoizedTaggedLogger(`node-repl-host-services-native-pipe`);

function requestId(value: unknown): string | number | null {
  if (typeof value !== `object` || value == null || !(`id` in value)) return null;
  const id = (value as any).id;
  return typeof id === `string` || (typeof id === `number` && Number.isFinite(id)) ? id : null;
}

function parseRequest(value: unknown): { id: string | number; service: string } | null {
  const id = requestId(value);
  if (id == null || typeof value !== `object` || value == null) return null;
  const request = value as Record<string, any>;
  const service = typeof request.params?.service === `string` ? request.params.service.trim() : null;
  return request.jsonrpc === `2.0` && request.method === `ensureService` &&
    service != null && service.length > 0 && service.length <= 128
    ? { id, service }
    : null;
}

export async function createHostServicesServer({
  services,
  pipePath = `/tmp/codex-host-services-${randomUUID()}.sock`,
  socketPeerAuthorizer,
}: {
  services: Map<string, () => Promise<unknown>>;
  pipePath?: string;
  socketPeerAuthorizer: (socket: unknown) => { authorized: boolean; reason?: string };
}) {
  const server = await createNativePipeServer({
    maxIncomingFrameBytes: MAX_FRAME_BYTES,
    maxOutgoingFrameBytes: MAX_FRAME_BYTES,
    pipePath,
    socketPeerAuthorizer,
    events: {
      onListening(path) {
        chmodSync(path, 0o600);
        logger().info(`node_repl_host_services_listening`, { safe: {}, sensitive: { pipePath: path } });
      },
      onAuthorizationError(error) {
        logger().warning(`node_repl_host_services_peer_authorization_failed`, { safe: {}, sensitive: { error } });
      },
      onRejectedSocket(result) {
        logger().warning(`node_repl_host_services_peer_rejected`, {
          safe: { reason: result.reason ?? `unauthorized` }, sensitive: {},
        });
      },
      onSocketError(error) {
        logger().warning(`node_repl_host_services_socket_error`, { safe: {}, sensitive: { error } });
      },
    },
  });
  server.setMessageCallback(async (message) => {
    const request = parseRequest(message);
    if (request == null) {
      const id = requestId(message);
      if (id != null)
        server.sendMessage({ error: { code: -32602, message: `Invalid host service request` }, id, jsonrpc: `2.0` });
      return;
    }
    const ensureService = services.get(request.service);
    if (ensureService == null) {
      server.sendMessage({
        error: { code: -32602, message: `Unsupported host service: ${request.service}` },
        id: request.id,
        jsonrpc: `2.0`,
      });
      return;
    }
    try {
      server.sendMessage({ id: request.id, jsonrpc: `2.0`, result: (await ensureService()) ?? {} });
    } catch (error) {
      logger().warning(`node_repl_host_service_ensure_failed`, {
        safe: { service: request.service }, sensitive: { error },
      });
      server.sendMessage({
        error: { code: -32_000, message: `Host service ensure failed` },
        id: request.id,
        jsonrpc: `2.0`,
      });
    }
  });
  return { pipePath: server.pipePath, dispose: () => server.close() };
}
