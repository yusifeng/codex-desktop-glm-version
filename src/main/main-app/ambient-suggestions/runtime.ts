type DesktopFeatureAvailability = {
  ambientSuggestions?: boolean;
  ambientSuggestionsFeatureDiscovery?: boolean;
  ambientSuggestionsStaleTimeMs?: number | null;
  computerUse?: boolean;
  noPluginListPhase2?: boolean;
};

type AmbientSuggestionsDependencies = {
  getDesktopFeatureAvailability(): DesktopFeatureAvailability;
  getDesktopAccessState():
    | { status: `loading` }
    | { status: `ready`; codexLocalAccess: unknown; workCloudAccess: unknown; workLocalAccess: unknown };
  isEligibleAccount(account: unknown): boolean;
  enabledSettingKey: string;
  conversationDetailModeSettingKey: string;
  shouldNormalizeDesktopPaths(hostConfig: unknown): boolean;
  normalizeDesktopPath(value: string, enabled: boolean): string;
  normalizePath(value: string): string;
  firstWorkspaceRoot(roots: string[] | undefined): string | null;
  getSelectedLocalProject(globalState: unknown): { rootPaths?: string[] } | null;
  homeDirectory(): string;
  readAmbientSuggestions(hostId: string, projectRoot: string, domain: string | null): { generatedAtMs?: number | null };
  generateAmbientSuggestions(input: Record<string, unknown>): Promise<unknown>;
  resolveModelRouting(statsig: unknown): Promise<unknown>;
  scheduleDeferredStartupWork(input: Record<string, unknown>): { dispose(): void };
  deferredStartupFallbackMs: number;
  createLogger(tag: string): () => {
    warning(message: string, details: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
  };
  now(): number;
};

export function createAmbientSuggestionsRuntime(dependencies: AmbientSuggestionsDependencies) {
  const logger = dependencies.createLogger(`ambient-suggestions-background-refresh`);

  function isAmbientSuggestionsEnabled(settingsStore: any): boolean {
    return dependencies.getDesktopFeatureAvailability().ambientSuggestions === true &&
      settingsStore.getEffective(dependencies.enabledSettingKey) === true;
  }

  function resolveAmbientSuggestionsSurface(settingsStore: any): `codex` | `chatgpt_work` {
    const preferred = settingsStore.getEffective(dependencies.conversationDetailModeSettingKey) === `STEPS_PROSE`
      ? `chatgpt_work`
      : `codex`;
    const access = dependencies.getDesktopAccessState();
    if (access.status === `loading`) return preferred;
    return access.codexLocalAccess
      ? !access.workCloudAccess && !access.workLocalAccess ? `codex` : preferred
      : `chatgpt_work`;
  }

  async function getAmbientSuggestionsEligibility({
    appServerConnection,
    settingsStore,
  }: {
    appServerConnection: any;
    settingsStore: any;
  }): Promise<
    | { enabled: false }
    | { enabled: true; computerUseAvailable: boolean; featureDiscoveryEnabled: boolean; staleTimeMs: number }
  > {
    const availability = dependencies.getDesktopFeatureAvailability();
    const staleTimeMs = availability.ambientSuggestionsStaleTimeMs;
    if (!isAmbientSuggestionsEnabled(settingsStore) || staleTimeMs == null) return { enabled: false };
    const { account } = await appServerConnection.getAccount();
    return dependencies.isEligibleAccount(account)
      ? {
          enabled: true,
          computerUseAvailable: availability.computerUse === true,
          featureDiscoveryEnabled: availability.ambientSuggestionsFeatureDiscovery === true,
          staleTimeMs,
        }
      : { enabled: false };
  }

  function createAmbientSuggestionsBackgroundRefresh({
    appEvent,
    appServerClient,
    appServerConnectionRegistry,
    globalState,
    settingsStore,
    startupPhases,
    statsig,
  }: {
    appEvent: any;
    appServerClient: any;
    appServerConnectionRegistry: any;
    globalState: any;
    settingsStore: any;
    startupPhases: any;
    statsig: unknown;
  }) {
    const inFlightByProjectRoot = new Map<string, Promise<void>>();
    let deferredStart: { dispose(): void } | undefined;
    const normalizeDesktopPaths = dependencies.shouldNormalizeDesktopPaths(appServerClient.hostConfig);

    const refreshProject = async (
      project: { domain: null; projectRoot: string; isProjectlessChat: boolean },
      trigger: string,
      appServerConnection: any,
      computerUseAvailable: boolean,
      featureDiscoveryEnabled: boolean,
      staleTimeMs: number,
    ) => {
      const existing = inFlightByProjectRoot.get(project.projectRoot);
      if (existing != null) return existing;
      const current = dependencies.readAmbientSuggestions(
        appServerClient.hostConfig.id,
        project.projectRoot,
        project.domain,
      );
      if (current.generatedAtMs != null && dependencies.now() - current.generatedAtMs < staleTimeMs) return;
      const operation = dependencies.resolveModelRouting(statsig)
        .then((modelRouting) => dependencies.generateAmbientSuggestions({
          modelRouting,
          usePluginDetailReads: dependencies.getDesktopFeatureAvailability().noPluginListPhase2,
          domain: project.domain,
          hostId: appServerClient.hostConfig.id,
          projectRoot: project.projectRoot,
          isProjectlessChat: project.isProjectlessChat,
          enabled: true,
          computerUseAvailable,
          featureDiscoveryEnabled,
          appServerConnection,
          serviceTier: null,
          staleTimeMs,
          surface: `codex`,
        }))
        .then(() => undefined)
        .catch((error) => {
          logger().warning(`Failed to refresh ambient suggestions`, {
            safe: { trigger },
            sensitive: { error, projectRoot: project.projectRoot },
          });
        })
        .finally(() => {
          inFlightByProjectRoot.delete(project.projectRoot);
        });
      inFlightByProjectRoot.set(project.projectRoot, operation);
      return operation;
    };

    const normalizedHome = dependencies.normalizePath(
      dependencies.normalizeDesktopPath(dependencies.homeDirectory(), normalizeDesktopPaths),
    );
    const projectless = { domain: null, projectRoot: normalizedHome, isProjectlessChat: true } as const;
    const currentProject = () => {
      const root = dependencies.firstWorkspaceRoot(
        dependencies.getSelectedLocalProject(globalState)?.rootPaths,
      );
      if (root == null || root === `~`) return projectless;
      const normalized = dependencies.normalizePath(
        dependencies.normalizeDesktopPath(root, normalizeDesktopPaths),
      );
      return normalizedHome === normalized
        ? projectless
        : { domain: null, projectRoot: normalized, isProjectlessChat: false } as const;
    };

    const refresh = async (trigger: string) => {
      try {
        if (!isAmbientSuggestionsEnabled(settingsStore)) return;
        const connection = appServerConnectionRegistry.getConnection(appServerClient.hostConfig.id);
        const eligibility = await getAmbientSuggestionsEligibility({
          appServerConnection: connection,
          settingsStore,
        });
        if (!eligibility.enabled) return;
        await refreshProject(
          currentProject(),
          trigger,
          connection,
          eligibility.computerUseAvailable,
          eligibility.featureDiscoveryEnabled,
          eligibility.staleTimeMs,
        );
      } catch (error) {
        logger().warning(`Failed to refresh ambient suggestions`, {
          safe: { trigger },
          sensitive: { error },
        });
      }
    };

    const subscription = appEvent.subscribe((event: { type: string }) => {
      switch (event.type) {
        case `background`:
          if (!startupPhases.hasReached(`background_ready`)) {
            deferredStart?.dispose();
            deferredStart = dependencies.scheduleDeferredStartupWork({
              startupPhases,
              phase: `background_ready`,
              fallback: {
                phase: `renderer_ready`,
                timeoutMs: dependencies.deferredStartupFallbackMs,
              },
              start: () => {
                deferredStart = undefined;
                void refresh(`background`);
              },
              onError: (error: unknown) => {
                logger().warning(`Failed to schedule ambient suggestions`, {
                  safe: { trigger: `background` },
                  sensitive: { error },
                });
              },
            });
            return;
          }
          void refresh(event.type);
          return;
        case `foreground`:
          deferredStart?.dispose();
          deferredStart = undefined;
          return;
        case `turnComplete`:
          return;
      }
    });

    return {
      dispose() {
        deferredStart?.dispose();
        subscription.dispose();
        inFlightByProjectRoot.clear();
      },
    };
  }

  return {
    createAmbientSuggestionsBackgroundRefresh,
    getAmbientSuggestionsEligibility,
    isAmbientSuggestionsEnabled,
    resolveAmbientSuggestionsSurface,
  };
}
