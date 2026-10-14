type LanguageServerLogger = {
  debug(message: string, context: unknown): void;
  info(message: string, context: unknown): void;
  warning(message: string, context: unknown): void;
};

type LanguageServerSession = {
  capabilities: {
    hover: boolean;
    locationKinds: string[];
  };
  dispose(): void;
  fileUri(path: string): string;
  getLocations(value: unknown): unknown[];
  requestForDocument(document: LanguageServerDocument, method: string, params: unknown): Promise<unknown>;
};

type LanguageServerProvider = {
  id: string;
  languageIds: string[];
};

type LanguageServerStartResult =
  | { status: "started"; session: LanguageServerSession }
  | { status: "expired-build"; localRuntimeId?: string | null }
  | { status: "unavailable" };

type PlatformPath = {
  basename(path: string): string;
  dirname(path: string): string;
  normalize(path: string): string;
};

type ExecutionHost = {
  id: string;
  platformPath(): Promise<PlatformPath>;
};

type LanguageServerDocument = {
  host: ExecutionHost;
  languageId: string;
  path: string;
  position?: unknown;
  workspaceRoot?: string | null;
};

export type LanguageServerManagerOptions = {
  createLogger(): LanguageServerLogger;
  createSession(args: {
    document: LanguageServerDocument;
    getLocalRuntimeRoot: unknown;
    onDispose(reason: Record<string, unknown>): void;
    pathApi: PlatformPath;
    provider: LanguageServerProvider;
    workspaceName: string;
    workspaceRoot: string;
  }): Promise<LanguageServerStartResult>;
  getLocalRuntimeRoot: unknown;
  hoverMethod: string;
  getLocationMethod(kind: string): string;
  markLocalRuntimeExpired(runtimeId: string): void;
  normalizeHover(result: unknown, position: unknown): unknown;
  onLocalRuntimeExpired?(runtimeId: string): void;
};

/** Owns language-server session identity, request routing, retry, and disposal lifecycle. */
export class LanguageServerManager {
  private readonly expiredLocalRuntimes = new Set<string>();
  private readonly logger: () => LanguageServerLogger;
  private readonly options: LanguageServerManagerOptions;
  private readonly providers: LanguageServerProvider[];
  private readonly sessions = new Map<string, Promise<LanguageServerSession | null>>();

  constructor(providers: LanguageServerProvider[], options: LanguageServerManagerOptions) {
    this.providers = providers;
    this.options = options;
    this.logger = options.createLogger;
  }

  async capabilities(document: LanguageServerDocument): Promise<unknown> {
    const providerId = this.getProviderId(document.languageId);
    try {
      const session = await this.getSession(document);
      if (session == null && providerId != null) {
        this.logger().debug("language_server_session_unavailable", {
          safe: { operation: "capabilities", providerId },
          sensitive: {},
        });
      }
      return session?.capabilities ?? null;
    } catch (error) {
      this.logRequestFailure("capabilities", document.languageId, error);
      return null;
    }
  }

  async hover(document: LanguageServerDocument): Promise<unknown> {
    const providerId = this.getProviderId(document.languageId);
    let session: LanguageServerSession | null = null;
    try {
      session = await this.getSession(document);
      if (session == null) {
        if (providerId != null) {
          this.logger().debug("language_server_session_unavailable", {
            safe: { operation: "hover", providerId },
            sensitive: {},
          });
        }
        return null;
      }
      if (!session.capabilities.hover) {
        this.logger().debug("language_server_hover_unsupported", {
          safe: { providerId },
          sensitive: {},
        });
        return null;
      }
      const result = await session.requestForDocument(document, this.options.hoverMethod, {
        position: document.position,
        textDocument: { uri: session.fileUri(document.path) },
      });
      if (result == null) {
        this.logger().debug("language_server_hover_empty", {
          safe: { providerId },
          sensitive: {},
        });
      }
      return result == null ? null : this.options.normalizeHover(result, document.position);
    } catch (error) {
      this.logRequestFailure("hover", document.languageId, error);
      session?.dispose();
      return null;
    }
  }

  async locations(document: LanguageServerDocument & { kind: string }): Promise<unknown[]> {
    let session: LanguageServerSession | null = null;
    try {
      session = await this.getSession(document);
      if (session == null || !session.capabilities.locationKinds.includes(document.kind)) return [];
      const params = {
        position: document.position,
        textDocument: { uri: session.fileUri(document.path) },
      };
      const result = await session.requestForDocument(
        document,
        this.options.getLocationMethod(document.kind),
        document.kind === "references"
          ? { ...params, context: { includeDeclaration: true } }
          : params,
      );
      return session.getLocations(result);
    } catch (error) {
      this.logRequestFailure("locations", document.languageId, error);
      session?.dispose();
      return [];
    }
  }

  dispose(): void {
    for (const session of this.sessions.values()) session.then((value) => value?.dispose());
    this.sessions.clear();
  }

  private async getSession(document: LanguageServerDocument): Promise<LanguageServerSession | null> {
    const provider = this.providers.find(({ languageIds }) =>
      languageIds.includes(document.languageId),
    );
    if (provider == null) return null;

    const pathApi = await document.host.platformPath();
    const workspaceRoot = pathApi.normalize(
      document.workspaceRoot ?? pathApi.dirname(document.path),
    );
    const key = `${document.host.id}\0${provider.id}\0${workspaceRoot}`;
    const existing = this.sessions.get(key);
    if (existing != null) return existing;

    this.logger().info("language_server_session_starting", {
      safe: { providerId: provider.id },
      sensitive: {},
    });
    const pending = this.startSession(provider.id, () =>
      this.options.createSession({
        document,
        getLocalRuntimeRoot: this.options.getLocalRuntimeRoot,
        onDispose: (reason) => {
          this.sessions.delete(key);
          this.logger().info("language_server_session_stopped", {
            safe: { providerId: provider.id, ...reason },
            sensitive: {},
          });
        },
        pathApi,
        provider,
        workspaceName: pathApi.basename(workspaceRoot),
        workspaceRoot,
      }),
    ).then(
      (session) => {
        if (session == null) {
          this.logger().debug("language_server_session_start_skipped", {
            safe: { providerId: provider.id },
            sensitive: {},
          });
        } else {
          this.logger().info("language_server_session_initialized", {
            safe: {
              hover: session.capabilities.hover,
              locationKinds: session.capabilities.locationKinds,
              providerId: provider.id,
            },
            sensitive: {},
          });
        }
        return session;
      },
      (error) => {
        this.logger().warning("language_server_session_start_failed", {
          safe: { providerId: provider.id },
          sensitive: { error },
        });
        return null;
      },
    );
    this.sessions.set(key, pending);
    pending.then((session) => {
      if (session == null && this.sessions.get(key) === pending) this.sessions.delete(key);
    });
    return pending;
  }

  private async startSession(
    providerId: string,
    start: () => Promise<LanguageServerStartResult>,
  ): Promise<LanguageServerSession | null> {
    let result = await start();
    if (result.status === "started") return result.session;
    if (result.status !== "expired-build") return null;

    this.logExpiredBuild(providerId, result.localRuntimeId != null);
    if (result.localRuntimeId == null) return null;
    if (!this.expiredLocalRuntimes.has(result.localRuntimeId)) {
      this.expiredLocalRuntimes.add(result.localRuntimeId);
      this.options.markLocalRuntimeExpired(result.localRuntimeId);
      this.options.onLocalRuntimeExpired?.(result.localRuntimeId);
    }

    result = await start();
    if (result.status === "started") return result.session;
    if (result.status === "expired-build") {
      this.logExpiredBuild(providerId, result.localRuntimeId != null);
    }
    return null;
  }

  private logExpiredBuild(providerId: string, managed: boolean): void {
    this.logger().info("language_server_expired_build", {
      safe: { managed, providerId },
      sensitive: {},
    });
  }

  private getProviderId(languageId: string): string | null {
    return this.providers.find((provider) => provider.languageIds.includes(languageId))?.id ?? null;
  }

  private logRequestFailure(operation: string, languageId: string, error: unknown): void {
    this.logger().warning("language_server_request_failed", {
      safe: { operation, providerId: this.getProviderId(languageId) },
      sensitive: { error },
    });
  }
}

if (typeof module !== "undefined") module.exports = { LanguageServerManager };
