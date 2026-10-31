type UnknownRecord = Record<string, any>;

type OpenTarget = {
  id: string;
  label: string;
  icon: string;
  kind: string;
  hidden?: boolean;
  supportsSsh?: boolean;
  configuredCommand?: string | null;
  configuredIcon?: string | null;
  [key: string]: unknown;
};

type WorkerRequest = (request: {
  method: "get-target-command" | "load-target-icon";
  params: UnknownRecord;
}) => Promise<UnknownRecord>;

export interface OpenInServiceDependencies {
  DisposableBase: new (...args: any[]) => any;
  createLogger(tag: string): () => {
    error(message: string, data: unknown): void;
    warning(message: string, data: unknown): void;
  };
  platform: NodeJS.Platform;
  extname(path: string): string;
  customFileHandlersKey: unknown;
  openInTargetPreferencesKey: unknown;
  defaultTargets: OpenTarget[];
  parseCustomTargets(value: unknown, platform: NodeJS.Platform): OpenTarget[];
  normalizeTargetIcon(icon: string): string;
  openWithTarget(
    target: string,
    path: string,
    options: UnknownRecord,
  ): Promise<void>;
  isEditorTarget(target: string, targets: OpenTarget[]): boolean;
  filterTargetIds(hostConfig: unknown, available: string[], metadata: OpenTarget[]): string[];
  filterTargets(targets: OpenTarget[], hostConfig: unknown): OpenTarget[];
  resolveTarget(options: UnknownRecord): string | null;
  isHostConfig(value: unknown): boolean;
  translateHostPath(path: string | null | undefined, hostConfig: unknown): string | null;
  defaultCwd(globalState: unknown): string;
  resolvePath(path: string, cwd?: string | null, platformPath?: unknown): string;
  isUrl(path: string): boolean;
  isHtml(path: string): boolean;
  isNativeDocument(path: string): boolean;
  isDarwinNativeDocument(path: string): boolean;
  isPlatformDefaultViewerDocument(path: string): boolean;
  nativeDocumentExtensions: readonly string[];
  discoverNativeBrowsers(mode: string): Promise<UnknownRecord[]>;
  discoverDocumentApplications(path: string): Promise<UnknownRecord[]>;
  discoverNativeApplications(path: string): Promise<UnknownRecord[]>;
  openExternalLink(input: UnknownRecord): Promise<boolean>;
  shouldOpenInBrowserPane(input: UnknownRecord): boolean;
  browserPaneEnabled(): boolean;
  pathToFileUrl(path: string): string;
  isPathOnPlatform(path: string, platformPath: unknown): boolean;
  statPath(path: string, executionHost: unknown): Promise<{ isDirectory(): boolean }>;
}

function normalizeConfiguredTargetForLinux(
  target: OpenTarget,
  command: string | null,
  platform: NodeJS.Platform,
  extname: (path: string) => string,
): OpenTarget {
  return platform !== "linux" ||
    target.kind !== "editor" ||
    command == null ||
    extname(command) !== ".desktop"
    ? target
    : { ...target, supportsSsh: false };
}

export function isOpenableUrl(
  value: string,
  isFirstPartyUrl: (value: string) => boolean,
): boolean {
  if (isFirstPartyUrl(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Complete owner for open-target discovery, preference persistence and open
 * dispatch. The generated chunk supplies platform adapters; this class owns
 * the state and side-effect ordering.
 */
export function createOpenInServiceClass(dependencies: OpenInServiceDependencies) {
  const {
    DisposableBase,
    createLogger,
    platform,
    extname,
    customFileHandlersKey,
    openInTargetPreferencesKey,
    defaultTargets,
    parseCustomTargets,
    normalizeTargetIcon,
    openWithTarget,
    isEditorTarget,
    filterTargetIds,
    filterTargets,
    resolveTarget,
    isHostConfig,
    translateHostPath,
    defaultCwd,
    resolvePath,
    isUrl,
    isHtml,
    isNativeDocument,
    isDarwinNativeDocument,
    isPlatformDefaultViewerDocument,
    nativeDocumentExtensions,
    discoverNativeBrowsers,
    discoverDocumentApplications,
    discoverNativeApplications,
    openExternalLink,
    shouldOpenInBrowserPane,
    browserPaneEnabled,
    pathToFileUrl,
    isPathOnPlatform,
    statPath,
  } = dependencies;

  const logger = createLogger("open-in-service");
  const targetLogger = createLogger("open-in-targets");
  const customTargetCache = new WeakMap<object, OpenTarget[]>();

  function targetsForSettings(settingsStore: UnknownRecord): OpenTarget[] {
    const custom = settingsStore.getEffective(customFileHandlersKey);
    if (custom == null) return defaultTargets;
    if (typeof custom === "object") {
      const cached = customTargetCache.get(custom);
      if (cached != null) return cached;
    }
    const parsed = parseCustomTargets(custom, platform);
    const targets = parsed.length === 0 ? defaultTargets : [...defaultTargets, ...parsed];
    if (typeof custom === "object") customTargetCache.set(custom, targets);
    return targets;
  }

  function targetMetadata(settingsStore: UnknownRecord): OpenTarget[] {
    return targetsForSettings(settingsStore).map(
      ({ id, label, icon, kind, hidden, supportsSsh }) => ({
        id,
        label,
        icon: normalizeTargetIcon(icon),
        kind,
        hidden,
        supportsSsh,
      }),
    );
  }

  function workerTargetParams(settingsStore: UnknownRecord, targetId: string): UnknownRecord {
    const target = targetsForSettings(settingsStore).find(({ id }) => id === targetId);
    return target?.configuredCommand == null || target.configuredIcon == null
      ? { target: targetId }
      : {
          target: targetId,
          customTarget: {
            command: target.configuredCommand,
            icon: target.configuredIcon,
          },
        };
  }

  async function enrichTargets(
    settingsStore: UnknownRecord,
    requestWorker: WorkerRequest,
  ): Promise<{ allAvailableTargets: string[]; targetMetadata: OpenTarget[] }> {
    const enriched = await Promise.all(
      targetMetadata(settingsStore).map(async (target) => {
        const params = workerTargetParams(settingsStore, target.id);
        const [command, icon] = await Promise.all([
          requestWorker({ method: "get-target-command", params })
            .then((response) => response.command as string | null)
            .catch((error) => {
              targetLogger().error("Failed to detect open target", {
                safe: {},
                sensitive: { id: target.id, error },
              });
              return null;
            }),
          platform === "win32"
            ? requestWorker({ method: "load-target-icon", params })
                .then((response) => response.icon as string)
                .catch((error) => {
                  targetLogger().warning("Failed to resolve open target icon", {
                    safe: {},
                    sensitive: { id: target.id, error },
                  });
                  return target.icon;
                })
            : target.icon,
        ]);
        return {
          command,
          metadata: {
            ...normalizeConfiguredTargetForLinux(target, command, platform, extname),
            icon,
          },
        };
      }),
    );
    return {
      allAvailableTargets: enriched.flatMap(({ command, metadata }) =>
        command == null ? [] : [metadata.id],
      ),
      targetMetadata: enriched.map(({ metadata }) => metadata),
    };
  }

  async function openConfiguredTarget(
    settingsStore: UnknownRecord,
    target: string,
    path: string,
    options: UnknownRecord,
  ): Promise<void> {
    await openWithTarget(target, path, {
      ...options,
      targets: targetsForSettings(settingsStore),
    });
  }

  function readPreferences(settingsStore: UnknownRecord): {
    global?: string;
    perPath?: Record<string, string>;
  } {
    const targets = targetsForSettings(settingsStore);
    const stored = settingsStore.getEffective(openInTargetPreferencesKey) ?? {};
    const normalize = (value: unknown): string | null =>
      value === "finder"
        ? "fileManager"
        : typeof value === "string" && targets.some(({ id }) => id === value)
          ? value
          : null;
    const global = normalize(stored.global) ?? undefined;
    const perPath = Object.fromEntries(
      Object.entries(stored.perPath ?? {}).flatMap(([path, value]) => {
        const target = normalize(value);
        return target == null ? [] : [[path, target]];
      }),
    );
    return {
      global,
      perPath: Object.keys(perPath).length === 0 ? undefined : perPath,
    };
  }

  function preferredTarget(settingsStore: UnknownRecord, path: string | null | undefined): string | null {
    const preferences = readPreferences(settingsStore);
    return (path ? preferences.perPath?.[path] : undefined) ?? preferences.global ?? null;
  }

  function firstAvailablePreferredTarget(
    settingsStore: UnknownRecord,
    path: string | null | undefined,
    available: Set<string>,
  ): string | null {
    const preferred = preferredTarget(settingsStore, path);
    return preferred != null && available.has(preferred)
      ? preferred
      : (available.values().next().value ?? null);
  }

  function writePreferredTarget(
    settingsStore: UnknownRecord,
    path: string | null,
    target: string,
  ): void {
    const preferences = readPreferences(settingsStore);
    preferences.global = target;
    if (path) {
      preferences.perPath ??= {};
      preferences.perPath[path] = target;
    }
    settingsStore.set(openInTargetPreferencesKey, preferences);
  }

  return class OpenInService extends DisposableBase {
    readonly globalState: unknown;
    readonly executionHostRegistry: UnknownRecord;
    readonly settingsStore: UnknownRecord;
    readonly requestOpenInWorker: WorkerRequest | null;
    readonly origin: unknown;
    readonly chunkedMessageSender: UnknownRecord;

    constructor(
      globalState: unknown,
      executionHostRegistry: UnknownRecord,
      settingsStore: UnknownRecord,
      requestOpenInWorker: WorkerRequest | null,
      origin: unknown,
      chunkedMessageSender: UnknownRecord,
    ) {
      super();
      this.globalState = globalState;
      this.executionHostRegistry = executionHostRegistry;
      this.settingsStore = settingsStore;
      this.requestOpenInWorker = requestOpenInWorker;
      this.origin = origin;
      this.chunkedMessageSender = chunkedMessageSender;
    }

    async detectTarget({ target }: { target: string }): Promise<{ available: boolean }> {
      const { command } = await this.#worker()({
        method: "get-target-command",
        params: workerTargetParams(this.settingsStore, target),
      });
      return { available: command != null };
    }

    async getTargets({
      cwd,
      deferEnrichment = false,
      hostId,
      nativeBrowserDiscovery = "scan",
      path,
    }: UnknownRecord): Promise<UnknownRecord> {
      const { hostConfig } = this.executionHostRegistry.get(hostId ?? undefined);
      if (deferEnrichment && path == null) {
        const preferred = preferredTarget(this.settingsStore, cwd);
        return {
          preferredTarget: preferred,
          availableTargets: [],
          mode: "editor",
          targets: filterTargets(targetMetadata(this.settingsStore), hostConfig).map(
            ({ id, label, icon, kind, hidden }) => ({
              id,
              target: id,
              label,
              icon,
              kind,
              hidden,
              default: preferred === id || undefined,
            }),
          ),
        };
      }

      const enriched = await enrichTargets(this.settingsStore, this.#worker());
      const strippedPath = path?.replace(/^([ab])[\\/]/, "") ?? null;
      const url = strippedPath != null && isUrl(strippedPath) && !isHostConfig(hostConfig);
      const resolvedPath =
        strippedPath == null || url || isHostConfig(hostConfig)
          ? null
          : resolvePath(
              translateHostPath(strippedPath, hostConfig) ?? strippedPath,
              translateHostPath(cwd, hostConfig) ?? defaultCwd(this.globalState),
            );
      const availableIds = filterTargetIds(
        hostConfig,
        enriched.allAvailableTargets,
        enriched.targetMetadata,
      );
      const available = new Set(availableIds);
      const preferred = firstAvailablePreferredTarget(this.settingsStore, cwd, available);
      const html = url || (resolvedPath != null && isHtml(resolvedPath));
      const nativeDocument = resolvedPath != null && isNativeDocument(resolvedPath);
      const officeDocument =
        resolvedPath != null &&
        nativeDocument &&
        (platform === "darwin" || platform === "linux") &&
        nativeDocumentExtensions.includes(extname(resolvedPath).toLowerCase());
      let nativeTargets: UnknownRecord[] = [];
      if (html) nativeTargets = await discoverNativeBrowsers(nativeBrowserDiscovery);
      else if (resolvedPath != null && officeDocument)
        nativeTargets = await discoverDocumentApplications(resolvedPath);
      else if (
        resolvedPath != null &&
        (isDarwinNativeDocument(resolvedPath) || (platform === "linux" && nativeDocument))
      )
        nativeTargets = await discoverNativeApplications(resolvedPath);

      return {
        preferredTarget: preferred,
        availableTargets: [...available],
        mode: html || nativeDocument ? "native" : "editor",
        targets: [
          ...enriched.targetMetadata
            .filter(({ id }) => !(officeDocument && id === "systemDefault"))
            .map(({ id, label, icon, kind, hidden }) => ({
              id,
              target: id,
              label,
              icon,
              kind,
              hidden,
              available: available.has(id),
              default: preferred === id || undefined,
            })),
          ...nativeTargets,
        ],
      };
    }

    loadTargetIcon({ target }: { target: string }): Promise<UnknownRecord> {
      return this.#worker()({
        method: "load-target-icon",
        params: workerTargetParams(this.settingsStore, target),
      });
    }

    async open({
      path,
      conversationId,
      target,
      appPath,
      line,
      column,
      cwd,
      persistPreferredTargetPath,
      hostId,
      openMode,
    }: UnknownRecord): Promise<{ success: boolean }> {
      try {
        const executionHost = this.executionHostRegistry.get(hostId ?? undefined);
        const hostConfig = executionHost.hostConfig;
        if (target === "systemDefault" && isUrl(path) && !isHostConfig(hostConfig)) {
          if (appPath == null) {
            const opened = await openExternalLink({
              request: {
                url: path,
                initiator: "open_in_browser_bridge",
                openTarget: "external-browser",
              },
            });
            if (!opened) throw Error("Failed to open URL in system browser");
          } else {
            await openConfiguredTarget(this.settingsStore, "systemDefault", path, {
              appPath,
              detectedCommand: await this.#targetCommand("systemDefault"),
              hostConfig,
            });
          }
          return { success: true };
        }

        const strippedPath = path.replace(/^([ab])[\\/]/, "");
        const translatedPath = translateHostPath(strippedPath, hostConfig) ?? strippedPath;
        const translatedCwd = translateHostPath(cwd, hostConfig) ?? defaultCwd(this.globalState);
        const remote = isHostConfig(hostConfig);
        const remoteWorkspaceRoot = remote ? cwd : null;
        const hasExplicitTarget = target != null;
        const platformPath = await executionHost.platformPath();
        const resolvedPath = resolvePath(translatedPath, translatedCwd);
        const directory = !remote && (await this.#isDirectory(executionHost, resolvedPath));
        const location =
          typeof line === "number"
            ? { line, column: typeof column === "number" ? column : 1 }
            : null;
        const remotePath =
          remoteWorkspaceRoot != null || (remote && isPathOnPlatform(strippedPath, platformPath))
            ? resolvePath(strippedPath, remoteWorkspaceRoot, platformPath)
            : null;

        if (
          !remote &&
          !directory &&
          shouldOpenInBrowserPane({
            browserPaneEnabled: browserPaneEnabled(),
            link: { type: "file", location, path: resolvedPath, target },
          })
        ) {
          this.chunkedMessageSender.sendInlineMessageForView(this.origin, {
            open: true,
            type: "toggle-browser-panel",
            conversationId,
            url: pathToFileUrl(resolvedPath),
            source: "manual",
            initiator: "open_in_browser_bridge",
          });
          return { success: true };
        }

        const requestedCommand = target == null ? undefined : await this.#targetCommand(target);
        let targetIds: string[];
        if (target == null || requestedCommand == null) {
          const enriched = await enrichTargets(this.settingsStore, this.#worker());
          targetIds = filterTargetIds(
            hostConfig,
            enriched.allAvailableTargets,
            enriched.targetMetadata,
          );
        } else {
          const targets = targetMetadata(this.settingsStore).map((candidate) =>
            candidate.id === target
              ? normalizeConfiguredTargetForLinux(candidate, requestedCommand, platform, extname)
              : candidate,
          );
          targetIds = filterTargets(targets, hostConfig).some(({ id }) => id === target)
            ? [target]
            : [];
        }
        const available = new Set(targetIds);
        let selectedTarget = target ?? null;
        selectedTarget = resolveTarget({
          requestedTarget: selectedTarget,
          requestedTargetWasFiltered: selectedTarget != null && !available.has(selectedTarget),
          preferredTarget: firstAvailablePreferredTarget(
            this.settingsStore,
            remoteWorkspaceRoot ?? translatedCwd,
            available,
          ),
          shouldUsePlatformDefaultViewer:
            !remote && !directory && isPlatformDefaultViewerDocument(resolvedPath),
          shouldUseFileManager: directory && available.has("fileManager"),
          hasExplicitTarget,
          allowPlatformFallback: !remote,
          platform,
        });
        if (selectedTarget == null) throw Error("No available open target");

        const darwinDocument = !remote && isDarwinNativeDocument(resolvedPath);
        const existingPreference =
          persistPreferredTargetPath != null &&
          preferredTarget(this.settingsStore, persistPreferredTargetPath) != null;
        if (persistPreferredTargetPath && (hasExplicitTarget || !existingPreference))
          writePreferredTarget(
            this.settingsStore,
            persistPreferredTargetPath,
            selectedTarget,
          );
        const effectiveRemotePath =
          openMode === "workspace" && location == null ? null : remotePath;
        if (
          darwinDocument &&
          location == null &&
          !hasExplicitTarget &&
          isEditorTarget(selectedTarget, targetsForSettings(this.settingsStore))
        )
          selectedTarget = "fileManager";
        await openConfiguredTarget(this.settingsStore, selectedTarget, resolvedPath, {
          appPath,
          detectedCommand: selectedTarget === target ? requestedCommand : undefined,
          hostConfig,
          location,
          remotePath: effectiveRemotePath,
          remoteWorkspaceRoot,
        });
        return { success: true };
      } catch (error) {
        logger().error("Failed to open file", {
          safe: {},
          sensitive: { error },
        });
        return { success: false };
      }
    }

    async setGlobalPreferredTarget({ target }: { target: string }): Promise<{ success: true }> {
      writePreferredTarget(this.settingsStore, null, target);
      return { success: true };
    }

    async #isDirectory(executionHost: unknown, path: string): Promise<boolean> {
      try {
        return (await statPath(path, executionHost)).isDirectory();
      } catch {
        return false;
      }
    }

    async #targetCommand(target: string): Promise<string> {
      const { command } = await this.#worker()({
        method: "get-target-command",
        params: workerTargetParams(this.settingsStore, target),
      });
      if (command == null) throw Error(`Open target "${target}" is not available`);
      return command as string;
    }

    #worker(): WorkerRequest {
      if (this.requestOpenInWorker == null) throw Error("Open in worker unavailable");
      return this.requestOpenInWorker;
    }
  };
}
