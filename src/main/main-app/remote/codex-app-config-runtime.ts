import { z } from "zod";

type StateKey = unknown;

type GlobalState = {
  get(key: StateKey): any;
  set(key: StateKey, value: unknown): void;
};

type RemoteProjectDeclaration = {
  remotePath: string;
  label?: string | null;
};

type RemoteConnectionDeclaration = {
  sshAlias: string;
  projects: RemoteProjectDeclaration[];
};

type CodexAppConfig = {
  version?: 1;
  remoteConnections: RemoteConnectionDeclaration[];
  remoteConnectionMaxRetryAttempts?: number;
  sshConnectTimeoutSeconds?: number;
};

type ConfigLoadResult =
  | { status: "loaded"; configPath: string; config: CodexAppConfig }
  | { status: "missing"; configPath: string }
  | { status: "read-error" | "invalid-json"; configPath: string; error: unknown }
  | {
      status: "unsupported-version";
      configPath: string;
      version: number;
      supportedVersion: 1;
    }
  | { status: "invalid-config"; configPath: string; error: z.ZodError };

type ConfigApplicationResult =
  | ConfigLoadResult
  | {
      status: "applied";
      configPath: string;
      result: { missingSshAliases: string[] };
    }
  | { status: "unexpected-error"; configPath: string; error: unknown };

type ManagedRemoteConnection = {
  hostId: string;
  alias?: string | null;
  displayName?: string;
  source?: string;
  hostname?: string | null;
  sshPort?: number | null;
  identity?: string | null;
};

type RemoteConnection = ManagedRemoteConnection & { sshAlias?: string | null };

type RemoteProject = {
  id: string;
  hostId: string;
  remotePath: string;
  label: string;
};

type RuntimeDependencies = {
  keys: {
    managedRemoteConnections: StateKey;
    remoteProjects: StateKey;
    projectOrder: StateKey;
    maxRetryAttempts: StateKey;
    autoConnectByHostId: StateKey;
    appliedRemoteDeclarations: StateKey;
  };
  normalizeRemotePath(path: string): string;
  canonicalizeRemotePath(path: string): string;
  defaultProjectLabel(path: string): string;
  hostIdForSshAlias(alias: string): string;
  randomUUID(): string;
  joinPath(...parts: string[]): string;
  existsSync(path: string): boolean;
  readFile(path: string, encoding: "utf8"): Promise<string>;
  dialog: {
    showMessageBox(
      parentWindow: unknown,
      options: {
        type: "error";
        buttons: string[];
        defaultId: number;
        cancelId: number;
        noLink: boolean;
        message: string;
        detail: string;
      },
    ): Promise<{ response: number }>;
  };
  clipboard: { writeText(text: string): void };
  configLogger: {
    warning(
      message: string,
      fields: { safe: Record<string, unknown>; sensitive: Record<string, unknown> },
    ): void;
  };
  logger: {
    warning(
      message: string,
      fields: { safe: Record<string, unknown>; sensitive: Record<string, unknown> },
    ): void;
  };
};

const SUPPORTED_CONFIG_VERSION = 1 as const;
const versionProbeSchema = z.object({ version: z.number().int().optional() });
const remoteProjectDeclarationSchema = z
  .object({ remotePath: z.string().trim().min(1), label: z.string().optional() })
  .strict();
const remoteConnectionDeclarationSchema = z
  .object({
    sshAlias: z.string().trim().min(1),
    projects: z.array(remoteProjectDeclarationSchema).default([]),
  })
  .strict();
const codexAppConfigSchema = z
  .object({
    version: z.literal(SUPPORTED_CONFIG_VERSION).optional().default(SUPPORTED_CONFIG_VERSION),
    remoteConnectionMaxRetryAttempts: z.number().int().nonnegative().optional(),
    sshConnectTimeoutSeconds: z.number().int().nonnegative().optional(),
    remoteConnections: z.array(remoteConnectionDeclarationSchema).default([]),
  })
  .strict();

type RemoteConnectionMatch = {
  connectionConfig: RemoteConnectionDeclaration;
  remoteConnection: RemoteConnection;
};

function findRemoteProject(
  projects: RemoteProject[],
  hostId: string,
  remotePath: string,
  normalizeRemotePath: (path: string) => string,
) {
  const normalized = normalizeRemotePath(remotePath);
  return (
    projects.find(
      (project) =>
        project.hostId === hostId && normalizeRemotePath(project.remotePath) === normalized,
    ) ?? null
  );
}

function remoteProjectsEqual(left: RemoteProject[], right: RemoteProject[]) {
  return (
    left.length === right.length &&
    left.every((project, index) => {
      const candidate = right[index];
      return (
        candidate != null &&
        project.id === candidate.id &&
        project.hostId === candidate.hostId &&
        project.remotePath === candidate.remotePath &&
        project.label === candidate.label
      );
    })
  );
}

function stringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** Restores the codex-app/config remote connection and project declaration runtime. */
export function createCodexAppConfigRuntime(dependencies: RuntimeDependencies) {
  const { keys } = dependencies;

  function codexAppConfigPath(codexHome: string) {
    return dependencies.joinPath(codexHome, "codex-app", "config.json");
  }

  async function loadCodexAppConfig(codexHome: string): Promise<ConfigLoadResult> {
    const configPath = codexAppConfigPath(codexHome);
    if (!dependencies.existsSync(configPath)) return { status: "missing", configPath };

    let source: string;
    try {
      source = await dependencies.readFile(configPath, "utf8");
    } catch (error) {
      dependencies.configLogger.warning("failed_to_read_config", {
        safe: {},
        sensitive: { configPath, error },
      });
      return { status: "read-error", configPath, error };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch (error) {
      dependencies.configLogger.warning("failed_to_parse_config", {
        safe: {},
        sensitive: { configPath, error },
      });
      return { status: "invalid-json", configPath, error };
    }

    const versionProbe = versionProbeSchema.safeParse(parsed);
    if (
      versionProbe.success &&
      versionProbe.data.version != null &&
      versionProbe.data.version !== SUPPORTED_CONFIG_VERSION
    ) {
      dependencies.configLogger.warning("unsupported_config_version", {
        safe: {
          version: versionProbe.data.version,
          supportedVersion: SUPPORTED_CONFIG_VERSION,
        },
        sensitive: { configPath },
      });
      return {
        status: "unsupported-version",
        configPath,
        version: versionProbe.data.version,
        supportedVersion: SUPPORTED_CONFIG_VERSION,
      };
    }

    const result = codexAppConfigSchema.safeParse(parsed);
    if (result.success)
      return { status: "loaded", configPath, config: result.data as CodexAppConfig };
    dependencies.configLogger.warning("invalid_config", {
      safe: {},
      sensitive: { configPath, error: result.error },
    });
    return { status: "invalid-config", configPath, error: result.error };
  }

  function formatCodexAppConfigError(result: ConfigApplicationResult) {
    switch (result.status) {
      case "loaded":
        return null;
      case "applied": {
        const { missingSshAliases } = result.result;
        return missingSshAliases.length === 0
          ? null
          : {
              message: "ChatGPT couldn't finish remote setup",
              detail: [
                "Your remote workspace was not set up completely.",
                "",
                "Please copy these details and send them to your administrator.",
                "",
                "Details:",
                "ChatGPT could not find these SSH aliases after checking SSH config:",
                "",
                ...missingSshAliases.map((alias) => `- ${alias}`),
                "",
                `Config file: ${result.configPath}`,
                "",
                "Ask your administrator to confirm that the setup command completed and that these SSH aliases exist.",
              ].join("\n"),
            };
      }
      case "missing":
        return {
          message: "ChatGPT couldn't find remote setup config",
          detail: [
            "Your remote workspace was not set up completely.",
            "",
            "Please copy these details and send them to your administrator.",
            "",
            "Details:",
            "ChatGPT could not find the setup config file.",
            "",
            `Expected file: ${result.configPath}`,
          ].join("\n"),
        };
      case "read-error":
        return configReadError(
          "ChatGPT couldn't read remote setup config",
          "ChatGPT could not read the setup config file.",
          result,
        );
      case "invalid-json":
        return configReadError(
          "ChatGPT couldn't read remote setup config",
          "The setup config file is not valid JSON.",
          result,
        );
      case "unsupported-version":
        return {
          message: "ChatGPT couldn't apply remote setup config",
          detail: [
            "Your remote workspace was not set up completely.",
            "",
            "Please copy these details and send them to your administrator.",
            "",
            "Details:",
            `Setup config version ${result.version} is not supported by this version of ChatGPT.`,
            "",
            `Supported version: ${result.supportedVersion}`,
            `Config file: ${result.configPath}`,
          ].join("\n"),
        };
      case "invalid-config":
        return configReadError(
          "ChatGPT couldn't apply remote setup config",
          "The setup config file does not match the format ChatGPT expects.",
          result,
        );
      case "unexpected-error":
        return configReadError(
          "ChatGPT couldn't finish remote setup",
          "ChatGPT hit an unexpected error while applying the setup config.",
          result,
        );
    }
  }

  function configReadError(
    message: string,
    explanation: string,
    result: { configPath: string; error: unknown },
  ) {
    return {
      message,
      detail: [
        "Your remote workspace was not set up completely.",
        "",
        "Please copy these details and send them to your administrator.",
        "",
        "Details:",
        explanation,
        "",
        `Config file: ${result.configPath}`,
        `Error: ${result.error instanceof Error ? result.error.message : String(result.error)}`,
      ].join("\n"),
    };
  }

  async function showCodexAppConfigResult(
    parentWindow: unknown,
    result: ConfigApplicationResult,
  ) {
    const error = formatCodexAppConfigError(result);
    if (error == null) return;
    const { response } = await dependencies.dialog.showMessageBox(parentWindow, {
      type: "error",
      buttons: ["Copy details", "OK"],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
      message: error.message,
      detail: error.detail,
    });
    if (response === 0) dependencies.clipboard.writeText(error.detail);
  }

  function stageRemoteConnectionDeclarations({
    config,
    globalState,
  }: {
    config: CodexAppConfig;
    globalState: GlobalState;
  }) {
    const managedConnections =
      (globalState.get(keys.managedRemoteConnections) as ManagedRemoteConnection[] | null) ?? [];
    const remoteProjects =
      (globalState.get(keys.remoteProjects) as RemoteProject[] | null) ?? [];
    const previousDeclarations =
      (globalState.get(keys.appliedRemoteDeclarations) as Record<string, string[]> | null) ?? {};
    const configuredAliases = new Set(
      config.remoteConnections.map((connection) => connection.sshAlias),
    );
    const appliedDeclarations = new Map(
      Object.entries(previousDeclarations).filter(([alias]) => configuredAliases.has(alias)),
    );
    let declarationsChanged = appliedDeclarations.size !== Object.keys(previousDeclarations).length;
    const discoveredConnections: ManagedRemoteConnection[] = [];

    for (const declaration of config.remoteConnections) {
      if (appliedDeclarations.has(declaration.sshAlias)) continue;
      const existingConnection = managedConnections.find(
        (connection) => connection.alias?.trim() === declaration.sshAlias,
      );
      const alreadyAppliedProjects =
        existingConnection == null
          ? []
          : config.remoteConnections
              .filter((candidate) => candidate.sshAlias === declaration.sshAlias)
              .flatMap((candidate) => candidate.projects)
              .filter(
                (project) =>
                  findRemoteProject(
                    remoteProjects,
                    existingConnection.hostId,
                    project.remotePath,
                    dependencies.normalizeRemotePath,
                  ) != null,
              )
              .map((project) => dependencies.normalizeRemotePath(project.remotePath));
      appliedDeclarations.set(declaration.sshAlias, alreadyAppliedProjects);
      declarationsChanged = true;
      if (existingConnection == null) {
        discoveredConnections.push({
          hostId: dependencies.hostIdForSshAlias(declaration.sshAlias),
          displayName: declaration.sshAlias,
          source: "discovered",
          alias: declaration.sshAlias,
          hostname: null,
          sshPort: null,
          identity: null,
        });
      }
    }

    if (discoveredConnections.length > 0) {
      globalState.set(keys.managedRemoteConnections, [
        ...managedConnections,
        ...discoveredConnections,
      ]);
    }
    if (declarationsChanged) {
      globalState.set(keys.appliedRemoteDeclarations, Object.fromEntries(appliedDeclarations));
    }
    return discoveredConnections.length > 0;
  }

  function updateMaxRetryAttempts(config: CodexAppConfig, globalState: GlobalState) {
    const next = config.remoteConnectionMaxRetryAttempts;
    if ((globalState.get(keys.maxRetryAttempts) ?? undefined) === next) return false;
    globalState.set(keys.maxRetryAttempts, next);
    return true;
  }

  function initializeAutoConnect(
    globalState: GlobalState,
    matches: RemoteConnectionMatch[],
  ) {
    const current =
      (globalState.get(keys.autoConnectByHostId) as Record<string, boolean> | null) ?? {};
    let next = current;
    let changed = false;
    for (const { remoteConnection } of matches) {
      if (current[remoteConnection.hostId] != null) continue;
      if (!changed) {
        next = { ...current };
        changed = true;
      }
      next[remoteConnection.hostId] = true;
    }
    if (changed) globalState.set(keys.autoConnectByHostId, next);
    return changed;
  }

  async function applyRemoteProjects({
    config,
    confirmProjectFolders,
    createRemoteProjectId,
    globalState,
    setProjectOrder,
    matches,
  }: {
    config: CodexAppConfig;
    confirmProjectFolders(hostId: string, paths: string[]): Promise<boolean>;
    createRemoteProjectId(): string;
    globalState: GlobalState;
    setProjectOrder(projectIds: string[]): Promise<unknown>;
    matches: RemoteConnectionMatch[];
  }) {
    let remoteProjects =
      (globalState.get(keys.remoteProjects) as RemoteProject[] | null) ?? [];
    const appliedDeclarations = new Map<string, string[]>(
      Object.entries(
        (globalState.get(keys.appliedRemoteDeclarations) as Record<string, string[]> | null) ?? {},
      ),
    );
    let declarationsChanged = false;

    for (const [alias, paths] of appliedDeclarations) {
      const activeDeclarations = config.remoteConnections.filter(
        (declaration) => declaration.sshAlias === alias,
      );
      if (activeDeclarations.length === 0) continue;
      const configuredPaths = new Set(
        activeDeclarations.flatMap((declaration) =>
          declaration.projects.map((project) =>
            dependencies.normalizeRemotePath(project.remotePath),
          ),
        ),
      );
      const retainedPaths = paths.filter((path) => configuredPaths.has(path));
      if (retainedPaths.length !== paths.length) {
        appliedDeclarations.set(alias, retainedPaths);
        declarationsChanged = true;
      }
    }

    const nextProjectsByKey = new Map<string, RemoteProject>();
    const createdProjectIds: string[] = [];
    for (const { connectionConfig, remoteConnection } of matches) {
      const appliedPaths = [...(appliedDeclarations.get(connectionConfig.sshAlias) ?? [])];
      const appliedPathSet = new Set(appliedPaths);
      const unconfirmedPaths = connectionConfig.projects
        .map((project) => dependencies.canonicalizeRemotePath(project.remotePath))
        .filter(
          (path) =>
            !appliedPathSet.has(dependencies.normalizeRemotePath(path)) &&
            findRemoteProject(
              remoteProjects,
              remoteConnection.hostId,
              path,
              dependencies.normalizeRemotePath,
            ) == null,
        );
      const confirmed =
        unconfirmedPaths.length === 0 ||
        (await confirmProjectFolders(remoteConnection.hostId, unconfirmedPaths));
      remoteProjects =
        (globalState.get(keys.remoteProjects) as RemoteProject[] | null) ?? [];

      for (const declaration of connectionConfig.projects) {
        const canonicalPath = dependencies.canonicalizeRemotePath(declaration.remotePath);
        const normalizedPath = dependencies.normalizeRemotePath(canonicalPath);
        const projectKey = `${remoteConnection.hostId}:${normalizedPath}`;
        const existingProject =
          nextProjectsByKey.get(projectKey) ??
          findRemoteProject(
            remoteProjects,
            remoteConnection.hostId,
            canonicalPath,
            dependencies.normalizeRemotePath,
          );
        if (
          (existingProject == null && appliedPathSet.has(normalizedPath)) ||
          (existingProject == null && !confirmed)
        ) {
          continue;
        }
        const projectId = existingProject?.id ?? createRemoteProjectId();
        if (existingProject == null) createdProjectIds.push(projectId);
        if (!appliedPathSet.has(normalizedPath)) {
          appliedPathSet.add(normalizedPath);
          appliedPaths.push(normalizedPath);
          appliedDeclarations.set(connectionConfig.sshAlias, appliedPaths);
          declarationsChanged = true;
        }
        nextProjectsByKey.set(projectKey, {
          id: projectId,
          hostId: remoteConnection.hostId,
          remotePath: canonicalPath,
          label:
            declaration.label?.trim() ||
            existingProject?.label ||
            dependencies.defaultProjectLabel(canonicalPath),
        });
      }
    }

    if (declarationsChanged) {
      globalState.set(keys.appliedRemoteDeclarations, Object.fromEntries(appliedDeclarations));
    }
    if (nextProjectsByKey.size === 0)
      return { remoteProjectsChanged: false, projectOrderChanged: false };

    const declaredProjects = Array.from(nextProjectsByKey.values());
    const currentOrder = (globalState.get(keys.projectOrder) as string[] | null) ?? [];
    const nextProjects = [
      ...declaredProjects,
      ...remoteProjects.filter(
        (project) =>
          !nextProjectsByKey.has(
            `${project.hostId}:${dependencies.normalizeRemotePath(project.remotePath)}`,
          ),
      ),
    ];
    const nextOrder = [...createdProjectIds, ...currentOrder];
    const remoteProjectsChanged = !remoteProjectsEqual(remoteProjects, nextProjects);
    const projectOrderChanged = !stringArraysEqual(currentOrder, nextOrder);
    if (remoteProjectsChanged) globalState.set(keys.remoteProjects, nextProjects);
    if (projectOrderChanged) await setProjectOrder(nextOrder);
    return { remoteProjectsChanged, projectOrderChanged };
  }

  async function applyRemoteDeclarations({
    config,
    createRemoteProjectId = dependencies.randomUUID,
    confirmProjectFolders,
    globalState,
    setProjectOrder,
    remoteConnections,
  }: {
    config: CodexAppConfig;
    createRemoteProjectId?: () => string;
    confirmProjectFolders(hostId: string, paths: string[]): Promise<boolean>;
    globalState: GlobalState;
    setProjectOrder(projectIds: string[]): Promise<unknown>;
    remoteConnections: RemoteConnection[];
  }) {
    const remoteConnectionsByAlias = new Map<string, RemoteConnection>();
    for (const connection of remoteConnections) {
      const alias = connection.sshAlias?.trim();
      if (alias && !remoteConnectionsByAlias.has(alias))
        remoteConnectionsByAlias.set(alias, connection);
    }
    const previousDeclarations =
      (globalState.get(keys.appliedRemoteDeclarations) as Record<string, string[]> | null) ?? {};
    const managedAliases = new Set(
      (
        (globalState.get(keys.managedRemoteConnections) as ManagedRemoteConnection[] | null) ?? []
      ).flatMap((connection) => {
        const alias = connection.alias?.trim();
        return alias ? [alias] : [];
      }),
    );
    const missingAliases = new Set<string>();
    const matches: RemoteConnectionMatch[] = [];
    for (const declaration of config.remoteConnections) {
      const connection = remoteConnectionsByAlias.get(declaration.sshAlias);
      if (connection == null) {
        if (!Object.hasOwn(previousDeclarations, declaration.sshAlias) || managedAliases.has(declaration.sshAlias))
          missingAliases.add(declaration.sshAlias);
        continue;
      }
      matches.push({ connectionConfig: declaration, remoteConnection: connection });
    }

    const changedGlobalStateKeys = new Set<StateKey>();
    if (updateMaxRetryAttempts(config, globalState))
      changedGlobalStateKeys.add(keys.maxRetryAttempts);
    if (initializeAutoConnect(globalState, matches))
      changedGlobalStateKeys.add(keys.autoConnectByHostId);
    const projectChanges = await applyRemoteProjects({
      config,
      confirmProjectFolders,
      createRemoteProjectId,
      globalState,
      setProjectOrder,
      matches,
    });
    if (projectChanges.remoteProjectsChanged)
      changedGlobalStateKeys.add(keys.remoteProjects);
    if (projectChanges.projectOrderChanged)
      changedGlobalStateKeys.add(keys.projectOrder);
    if (missingAliases.size > 0) {
      dependencies.logger.warning("skipped_missing_ssh_aliases", {
        safe: { missingSshAliasCount: missingAliases.size },
        sensitive: { sshAliases: Array.from(missingAliases) },
      });
    }
    const autoConnect =
      (globalState.get(keys.autoConnectByHostId) as Record<string, boolean> | null) ?? {};
    return {
      changedGlobalStateKeys: Array.from(changedGlobalStateKeys),
      remoteProjectsChanged: projectChanges.remoteProjectsChanged,
      missingSshAliases: Array.from(missingAliases),
      remoteConnectionHostIdsToConnect: Array.from(
        new Set(
          matches
            .filter(({ remoteConnection }) => autoConnect[remoteConnection.hostId] !== false)
            .map(({ remoteConnection }) => remoteConnection.hostId),
        ),
      ),
    };
  }

  return {
    codexAppConfigPath,
    loadCodexAppConfig,
    formatCodexAppConfigError,
    showCodexAppConfigResult,
    stageRemoteConnectionDeclarations,
    applyRemoteDeclarations,
  };
}
