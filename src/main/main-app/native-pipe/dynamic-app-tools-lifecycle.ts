import { CODEX_APP_TOOLS_PIPE_PATH } from "../misc/codex-app-tools-config";
import { createDynamicAppToolsServer } from "./dynamic-app-tools-server";

interface LifecycleLogger {
  warning(message: string, fields: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
}

interface DynamicAppToolsWindowContext {
  setDynamicAppToolsPipePath(pipePath: string | null): void;
}

export interface DynamicAppToolsLifecycleOptions {
  callTool(request: { hostId: string; params: Record<string, any> }, signal: AbortSignal): Promise<unknown>;
  createSocketPeerAuthorizer(): (socket: unknown) => { authorized: boolean; reason?: string };
  environment: Record<string, string | undefined>;
  listTools(threadStartKind: `default` | `all`): Promise<any[]>;
  logger: LifecycleLogger;
  startServer?: typeof createDynamicAppToolsServer;
}

/** Starts, publishes, binds, and disposes the dynamic app-tools native pipe as one lifecycle. */
export async function startDynamicAppToolsLifecycle(options: DynamicAppToolsLifecycleOptions) {
  const {
    callTool,
    createSocketPeerAuthorizer,
    environment,
    listTools,
    logger,
    startServer = createDynamicAppToolsServer,
  } = options;
  delete environment[CODEX_APP_TOOLS_PIPE_PATH];

  const server = await startServer({
    callTool,
    listTools,
    socketPeerAuthorizer: createSocketPeerAuthorizer(),
  }).catch((error) => {
    logger.warning(`Failed to start the Codex app tools native pipe`, {
      safe: {},
      sensitive: { error },
    });
    return null;
  });
  if (server != null) environment[CODEX_APP_TOOLS_PIPE_PATH] = server.pipePath;

  return {
    bindWindowContext(
      windowContext: DynamicAppToolsWindowContext,
      registerDispose: (dispose: () => void | Promise<void>) => void,
    ) {
      if (server == null) return;
      windowContext.setDynamicAppToolsPipePath(server.pipePath);
      registerDispose(async () => {
        windowContext.setDynamicAppToolsPipePath(null);
        delete environment[CODEX_APP_TOOLS_PIPE_PATH];
        await server.dispose();
      });
    },
    getPipePath: () => server?.pipePath ?? null,
  };
}
