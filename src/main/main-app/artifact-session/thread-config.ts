export const ARTIFACT_SESSION_MCP_SERVER_NAME = `artifact_session`;
export const ARTIFACT_SESSION_CONFIG_KEY = `mcp_servers.${ARTIFACT_SESSION_MCP_SERVER_NAME}`;
export const DISABLED_ARTIFACT_SESSION_CONFIG = { command: ``, enabled: false } as const;

const ARTIFACT_SESSION_SERVICE_PACKAGE = `@oai/artifact-tool/artifact-session/service`;
const ARTIFACT_SESSION_USE_CASE_ENV = `NODE_REPL_INSTRUCTIONS_USE_CASE_ARTIFACT_SESSION`;
const ARTIFACT_SESSION_USE_CASE = `Create and edit viewer-bound spreadsheets and presentations, and edit existing bound canvases, with persistent JavaScript authoring sessions.`;
const ARTIFACT_SESSION_BANNER = `const { artifactSession: __artifactSessionClient } = await import("@oai/artifact-tool/artifact-session");
const __artifactSession = Object.freeze({
  run(callback, options) {
    return __artifactSessionClient.run(callback, options);
  },
  status(transaction) {
    return __artifactSessionClient.status(transaction);
  },
  abort(transaction) {
    return __artifactSessionClient.abort(transaction);
  },
});
Object.defineProperty(globalThis, "artifactSession", { configurable: false, enumerable: true, value: __artifactSession, writable: false });`;
const ARTIFACT_SESSION_TOOL_OVERRIDES = JSON.stringify({
  server_instructions: `Use this first-party JavaScript tool for persistent spreadsheet and presentation authoring and editing an existing bound canvas. The global artifactSession client edits the same CRDT state shown in the live viewer. For spreadsheets, call artifactSession.run(async ({ workbook, session }) => { ... }, { artifactType: "spreadsheet" }); for presentations, use ({ presentation, session }) and artifactType: "presentation". When the application supplies a bound canvas artifactRef, use ({ whiteboard, session }) with that artifactRef and artifactType: "whiteboard". Canvas creation belongs to Spaces. Use nodeRepl.write(...) for compact results. All model and session handles are callback-scoped snapshots: use and mutate them only inside that callback. Mutations after the callback returns do not sync; start a new artifactSession.run for every durable edit.`,
  tools: {
    js: {
      description: `Run sandboxed JavaScript to create or edit a viewer-bound spreadsheet or presentation, or edit an existing bound canvas, through the global artifactSession client.`,
      field_descriptions: {
        code: `JavaScript to run. Use a new artifactSession.run(...) callback for every durable edit. Canvas edits require the artifactRef supplied by the application.`,
      },
    },
  },
});

type ArtifactSessionThreadConfigDependencies = {
  logger: {
    info(event: string, details: unknown): void;
    warning(event: string, details: unknown): void;
  };
  resolveRuntimePaths(options: { isPackaged: boolean; repoRoot: string }): any;
  buildNodeReplMcpConfig(options: Record<string, unknown>): Record<string, any> | null;
  resolveCodexHome(): string;
  resolveRequestMetadata(): string;
  developmentBuildFlavor: string;
  isInternalBuild(flavor: string): boolean;
  isNodeReplSandboxPlatform(platform: string): boolean;
  isEligibleThreadSource(source: unknown): boolean;
  nodeModulesPathEnvKey: string;
  mcpServicesEnvKey: string;
  requestMetaEnvKey: string;
  nodeReplBannerEnvKey: string;
  nodeReplToolOverridesEnvKey: string;
  cwd(): string;
  env: NodeJS.ProcessEnv;
};

export function createArtifactSessionThreadConfigRuntime(
  dependencies: ArtifactSessionThreadConfigDependencies,
) {
  function createExpectedArtifactSessionThreadConfig({
    enabled,
    hostLifecycle,
    isPackaged = true,
    repoRoot = dependencies.cwd(),
    runtimePaths,
    shouldUseWslPaths,
  }: {
    enabled: boolean;
    hostLifecycle: any;
    isPackaged?: boolean;
    repoRoot?: string;
    runtimePaths?: any;
    shouldUseWslPaths: boolean;
  }): Record<string, unknown> | null {
    if (!enabled || hostLifecycle == null || !hostLifecycle.isViewerAvailable()) return null;
    if (shouldUseWslPaths) {
      dependencies.logger.info(`artifact_session_thread_config_skipped`, {
        safe: { reason: `wsl-host-bridge-unavailable` },
        sensitive: {},
      });
      return null;
    }
    const paths = runtimePaths ?? dependencies.resolveRuntimePaths({ isPackaged, repoRoot });
    if (
      paths.nodeReplPath == null ||
      paths.codexCliPath == null ||
      !dependencies.isNodeReplSandboxPlatform(paths.platform)
    ) {
      dependencies.logger.warning(`artifact_session_thread_config_skipped`, {
        safe: { platform: paths.platform, reason: `sandbox-runtime-unavailable` },
        sensitive: {},
      });
      return null;
    }
    const primaryRuntime = hostLifecycle.getPrimaryRuntimePaths();
    const flavor = dependencies.resolveRequestMetadata();
    const config = dependencies.buildNodeReplMcpConfig({
      codexCliPath: paths.codexCliPath,
      codexHome: dependencies.resolveCodexHome(),
      extraEnv: {
        [ARTIFACT_SESSION_USE_CASE_ENV]: ARTIFACT_SESSION_USE_CASE,
        [dependencies.nodeReplBannerEnvKey]: ARTIFACT_SESSION_BANNER,
        [dependencies.nodeReplToolOverridesEnvKey]: ARTIFACT_SESSION_TOOL_OVERRIDES,
        [dependencies.nodeModulesPathEnvKey]: primaryRuntime.nodeModulesPath,
        [dependencies.mcpServicesEnvKey]: JSON.stringify({
          [ARTIFACT_SESSION_MCP_SERVER_NAME]: ARTIFACT_SESSION_SERVICE_PACKAGE,
        }),
      },
      nodeModuleDirs: primaryRuntime.nodeModulesPath,
      nodePath: primaryRuntime.nodePath,
      nodeReplPath: paths.nodeReplPath,
      platform: paths.platform,
      requestMeta: flavor === dependencies.developmentBuildFlavor
        ? dependencies.env[dependencies.requestMetaEnvKey]
        : undefined,
      shouldUseWslPaths: false,
      traceMeta: dependencies.isInternalBuild(flavor) || dependencies.env.NODE_REPL_TRACE_META === `1`,
    });
    return config == null
      ? null
      : { [ARTIFACT_SESSION_CONFIG_KEY]: config[`mcp_servers.node_repl`] };
  }

  function installArtifactSessionThreadConfigInterceptor({
    getHostLifecycle,
    getExpectedThreadConfig,
    isLocalStdio,
  }: {
    getHostLifecycle(): any;
    getExpectedThreadConfig(): Record<string, unknown> | null | undefined;
    isLocalStdio(): boolean;
  }) {
    if (!isLocalStdio()) return undefined;
    return (request: any) => isLocalStdio()
      ? applyArtifactSessionThreadConfig(
          request,
          isThreadStartRequest(request) && shouldEnableArtifactSession(request) ? getHostLifecycle() : null,
          getExpectedThreadConfig,
        )
      : request;
  }

  function applyArtifactSessionThreadConfig(
    request: any,
    hostLifecycle: any,
    getExpectedThreadConfig: () => Record<string, unknown> | null | undefined,
  ) {
    if (!isThreadStartRequest(request) || !hasArtifactSessionConfig(request)) return request;
    if (!shouldEnableArtifactSession(request) || hostLifecycle == null || !hostLifecycle.isViewerAvailable()) {
      return replaceArtifactSessionConfig(request, DISABLED_ARTIFACT_SESSION_CONFIG);
    }
    const expected = getExpectedThreadConfig()?.[ARTIFACT_SESSION_CONFIG_KEY];
    if (!isRecord(expected)) {
      return replaceArtifactSessionConfig(request, DISABLED_ARTIFACT_SESSION_CONFIG);
    }
    const env = isRecord(expected.env) ? expected.env : {};
    return replaceArtifactSessionConfig(request, {
      ...expected,
      env: { ...env, ...hostLifecycle.getTrustedServiceEnv() },
    });
  }

  function shouldEnableArtifactSession(request: any): boolean {
    return `threadSource` in request.params && !dependencies.isEligibleThreadSource(request.params.threadSource)
      ? false
      : hasArtifactSessionConfig(request);
  }

  return {
    createExpectedArtifactSessionThreadConfig,
    installArtifactSessionThreadConfigInterceptor,
  };
}

function hasArtifactSessionConfig(request: any): boolean {
  return isRecord(request.params.config) &&
    Object.hasOwn(request.params.config, ARTIFACT_SESSION_CONFIG_KEY);
}

function replaceArtifactSessionConfig(request: any, value: unknown) {
  if (!isThreadStartRequest(request)) return request;
  const config = isRecord(request.params.config) ? request.params.config : {};
  return {
    ...request,
    params: {
      ...request.params,
      config: {
        ...removeArtifactSessionConfig(config),
        [ARTIFACT_SESSION_CONFIG_KEY]: value,
      },
    },
  };
}

function removeArtifactSessionConfig(config: Record<string, unknown>) {
  return removeArtifactSessionConfigAtPrefix(config, ``);
}

function removeArtifactSessionConfigAtPrefix(config: Record<string, unknown>, prefix: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(config).flatMap(([key, value]) => {
    const fullKey = normalizeConfigKey(prefix, key);
    if (fullKey === ARTIFACT_SESSION_CONFIG_KEY || fullKey.startsWith(`${ARTIFACT_SESSION_CONFIG_KEY}.`)) return [];
    if (isRecord(value) && ARTIFACT_SESSION_CONFIG_KEY.startsWith(`${fullKey}.`)) {
      const nested = removeArtifactSessionConfigAtPrefix(value, fullKey);
      return Object.keys(nested).length === 0 ? [] : [[key, nested]];
    }
    return [[key, value]];
  }));
}

function normalizeConfigKey(prefix: string, key: string): string {
  return `${prefix}.${key}`
    .replaceAll(`[`, `.`)
    .replaceAll(`]`, ``)
    .replace(/["'\s]/gu, ``)
    .replace(/\.{2,}/gu, `.`)
    .replace(/^\.|\.$/gu, ``);
}

function isThreadStartRequest(request: any): boolean {
  return request != null && typeof request === `object` && `id` in request && `method` in request &&
    (request.method === `thread/start` || request.method === `thread/resume` || request.method === `thread/fork`);
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === `object` && value != null && !Array.isArray(value);
}
