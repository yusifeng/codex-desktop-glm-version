import { canonicalServiceAppPath, refreshCanonicalServiceAppCopy, resolveComputerUseAppPath } from "./app-resolution";
import { ManagedComputerUseService } from "./managed-service";
import { NODE_REPL_HOST_SERVICES_PIPE_PATH } from "../browser-use/thread-config";
import { createHostServicesServer } from "../native-pipe/host-services-server";

type ManagedService = Pick<
  ManagedComputerUseService,
  `dispose` | `ensureServicePid` | `invalidateServicePid`
>;

interface HostServicesServer {
  pipePath: string;
  dispose(): void | Promise<void>;
}

interface LifecycleLogger {
  warning(message: string, fields: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
}

export interface ManagedComputerUseLifecycleOptions {
  codexHome: string;
  enabled: boolean;
  environment: Record<string, string | undefined>;
  internalBuild: boolean;
  logger: LifecycleLogger;
  onServiceAvailable(processIdentifier: number): void;
  onServiceRespawned(): void;
  registerDispose(dispose: { dispose(): void } | (() => void)): void;
  createSocketPeerAuthorizer(): (socket: unknown) => { authorized: boolean; reason?: string };
  createManagedService?: (
    serviceAppPath: string,
    callbacks: {
      onServiceAvailable(processIdentifier: number): void;
      onServiceRespawned(): void;
    },
  ) => ManagedService;
  refreshCanonicalCopy?: typeof refreshCanonicalServiceAppCopy;
  resolveSourceServiceAppPath?: typeof resolveComputerUseAppPath;
  startHostServicesServer?: (options: {
    services: Map<string, () => Promise<unknown>>;
    socketPeerAuthorizer: ReturnType<ManagedComputerUseLifecycleOptions[`createSocketPeerAuthorizer`]>;
  }) => Promise<HostServicesServer>;
}

/** Owns the optional macOS managed Computer Use service and its internal host-services pipe. */
export function createManagedComputerUseLifecycle(options: ManagedComputerUseLifecycleOptions) {
  const {
    codexHome,
    enabled,
    environment,
    internalBuild,
    logger,
    onServiceAvailable,
    onServiceRespawned,
    registerDispose,
    createSocketPeerAuthorizer,
    createManagedService = (serviceAppPath, callbacks) =>
      new ManagedComputerUseService(serviceAppPath, callbacks),
    refreshCanonicalCopy = refreshCanonicalServiceAppCopy,
    resolveSourceServiceAppPath = resolveComputerUseAppPath,
    startHostServicesServer = createHostServicesServer,
  } = options;
  let service: ManagedService | null = null;
  let startPromise: Promise<ManagedService | null> | null = null;

  const ensureService = () => {
    if (service == null) throw new Error(`Managed Computer Use service is unavailable`);
    return service.ensureServicePid();
  };

  const start = async () => {
    if (!enabled) return null;
    if (startPromise != null) return startPromise;
    startPromise = (async () => {
      try {
        await refreshCanonicalCopy({
          sourceServiceAppPath: resolveSourceServiceAppPath(),
          codexHome,
        });
      } catch (error) {
        logger.warning(`Failed to sync canonical Computer Use service app during startup`, {
          safe: {},
          sensitive: { error },
        });
      }

      service = createManagedService(canonicalServiceAppPath(codexHome), {
        onServiceAvailable,
        onServiceRespawned,
      });
      registerDispose(service);
      if (!internalBuild) return service;

      delete environment[NODE_REPL_HOST_SERVICES_PIPE_PATH];
      try {
        const hostServicesServer = await startHostServicesServer({
          services: new Map([
            [
              `computer-use`,
              async () => {
                await ensureService();
                return {};
              },
            ],
          ]),
          socketPeerAuthorizer: createSocketPeerAuthorizer(),
        });
        environment[NODE_REPL_HOST_SERVICES_PIPE_PATH] = hostServicesServer.pipePath;
        registerDispose(() => {
          if (environment[NODE_REPL_HOST_SERVICES_PIPE_PATH] === hostServicesServer.pipePath)
            delete environment[NODE_REPL_HOST_SERVICES_PIPE_PATH];
          hostServicesServer.dispose();
        });
      } catch (error) {
        delete environment[NODE_REPL_HOST_SERVICES_PIPE_PATH];
        logger.warning(`Failed to start node_repl host services native pipe`, {
          safe: {},
          sensitive: { error },
        });
      }
      return service;
    })();
    return startPromise;
  };

  return {
    ensureService,
    getService: () => service,
    invalidateService(processIdentifier: number) {
      return service == null ? Promise.resolve() : service.invalidateServicePid(processIdentifier);
    },
    start,
  };
}
