export const DEFAULT_AUTOMATION_SCHEDULER_TICK_MS = 30_000;
export const DEFAULT_AUTOMATION_MAX_PER_TICK = 3;

const MINIMUM_RUN_INTERVAL_MS = 60_000;
const AUTOMATION_SYNC_INTERVAL_MS = 300_000;
const HEARTBEAT_RETRY_MS = 60_000;
const ARCHIVE_THREAD_TOOL = `set_thread_archived`;
const WRITE_SETTINGS_TOOL = `write_settings`;

type AutomationSchedulerDependencies = {
  defaultDesktopFeatureAvailability: any;
  listDueAutomations(now: number, limit: number): any[];
  updateAutomationNextRun(id: string, nextRunAt: number): void;
  isHeartbeatAutomation(automation: any): boolean;
  runScheduledHeartbeat(input: any): Promise<void>;
  runHeartbeatNow(input: any): Promise<void>;
  getAutomation(id: string): any;
  markAutomationRun(id: string, nextRunAt: number | null): void;
  computeAutomationNextRun(input: { automation: any; now: number }): number | null;
  hasAnchoredSchedule(rrule: string): boolean;
  resolveAutomationModelRouting(statsig: unknown): Promise<{ automationModel: string }>;
  selectAutomationModel(input: any): { model: string; reasoningEffort: string | null };
  resolveAutomationProjectTarget(globalState: any, target: any): any;
  automationTargetCwd(target: any): string | null;
  forEachSequentially(values: any[], iteratee: (value: any, index: number) => unknown): Promise<unknown>;
  executeCronAutomationTarget(input: any): Promise<void>;
  checkHostedAutomationAppAvailable(check: () => Promise<boolean>): Promise<boolean>;
  executionConfigErrorClass: new (...args: any[]) => any;
  settleInterruptedAutomationRuns(): boolean;
  markSchedulerStarted(now: number): void;
  now(): number;
  isOnline(): boolean;
  logger: {
    warning(message: string, details: any): void;
    debug(message: string, details: any): void;
  };
};

export function createAutomationSchedulerRuntime(dependencies: AutomationSchedulerDependencies) {
  async function loadAutomationToolNames(requestDynamicToolsForThreadStart: () => Promise<any[]>) {
    try {
      const tools = (await requestDynamicToolsForThreadStart()).flatMap((tool) =>
        tool.type === `namespace` ? tool.tools.map(({ name }: any) => name) : [tool.name]
      );
      return [...new Set([...tools, ARCHIVE_THREAD_TOOL])].filter(
        (name) => name !== WRITE_SETTINGS_TOOL,
      );
    } catch (error) {
      dependencies.logger.warning(`Failed to load dynamic tools for automation run`, {
        safe: { error },
        sensitive: {},
      });
      return [ARCHIVE_THREAD_TOOL];
    }
  }

  function nextCronRunAt({ automation, now }: { automation: any; now: number }) {
    return automation.nextRunAt != null &&
      automation.nextRunAt <= now &&
      dependencies.hasAnchoredSchedule(automation.rrule)
      ? null
      : dependencies.computeAutomationNextRun({ automation, now });
  }

  async function runCronAutomation({
    appVersion,
    statsig,
    automation,
    appServerConnection,
    desktopFeatureAvailability,
    requestGitWorker,
    globalState,
    threadProjectAssignments,
    settingsStore,
    appServerClient,
    worktreeLifecycle,
    requestDynamicToolsForThreadStart,
    isHostedAutomationAppAvailable,
    prepareCronTurnReadState,
    isPackaged,
    repoRoot,
    runTrigger,
  }: any) {
    let targets;
    if (automation.target == null) {
      targets = automation.cwds.map((cwd: string) => ({ type: `legacy`, cwd }));
    } else if (automation.target.type === `projectless`) {
      targets = [{ type: `projectless` }];
    } else {
      const project = dependencies.resolveAutomationProjectTarget(globalState, automation.target);
      targets = project == null ? [] : [{ type: `project`, project }];
    }
    if (targets.length === 0) {
      dependencies.logger.warning(`Scheduled run skipped: no folders configured`, {
        safe: { automationId: automation.id },
        sensitive: {},
      });
      return;
    }

    const { automationModel } = await dependencies.resolveAutomationModelRouting(statsig);
    let modelSettings = {
      model: automation.model ?? automationModel,
      reasoningEffort: automation.reasoningEffort ?? `medium`,
    };
    try {
      const models = await appServerConnection.listModels({ includeHidden: true, cursor: null, limit: 100 });
      modelSettings = dependencies.selectAutomationModel({
        automation,
        models: models.data,
        defaultModel: automationModel,
      });
      if (automation.model != null && automation.model !== modelSettings.model) {
        dependencies.logger.warning(`Automation model unavailable; falling back`, {
          safe: {
            automationId: automation.id,
            requestedModel: automation.model,
            fallbackModel: modelSettings.model,
          },
          sensitive: {},
        });
      }
    } catch (error) {
      dependencies.logger.warning(`Failed to load models for automation run`, {
        safe: { automationId: automation.id, error },
        sensitive: {},
      });
    }

    for (const target of targets) {
      appServerConnection.notifyAutomationRunTriggered({
        automationKind: automation.kind,
        cwd: dependencies.automationTargetCwd(target),
        executionEnvironment: automation.executionEnvironment,
        model: modelSettings.model,
        pluginTemplateId: automation.pluginTemplateId,
        reasoningEffort: modelSettings.reasoningEffort,
        rrule: automation.rrule,
        runTrigger,
      });
    }

    const configRequirements = (await appServerConnection.getConfigRequirements()).requirements;
    const appToolNames = await loadAutomationToolNames(requestDynamicToolsForThreadStart);
    const hostedAutomationsAvailable = await dependencies.checkHostedAutomationAppAvailable(
      isHostedAutomationAppAvailable,
    );
    const errors: unknown[] = [];
    await dependencies.forEachSequentially(targets, (target) =>
      dependencies.executeCronAutomationTarget({
        runTrigger,
        appVersion,
        automation,
        appServerConnection,
        desktopFeatureAvailability,
        requestGitWorker,
        globalState,
        threadProjectAssignments,
        settingsStore,
        appServerClient,
        worktreeLifecycle,
        configRequirements,
        target,
        automationModelSettings: modelSettings,
        appToolNames,
        hostedAutomationsAvailable,
        prepareCronTurnReadState,
        isPackaged,
        repoRoot,
      }).catch((error: unknown) => {
        errors.push(error);
        dependencies.logger.warning(`Scheduled run failed`, {
          safe: { automationId: automation.id, error },
          sensitive: {},
        });
      }),
    );
    if (errors.length > 0) {
      throw errors[0] instanceof dependencies.executionConfigErrorClass &&
        (errors.length !== targets.length || errors.some((error) => !(error instanceof dependencies.executionConfigErrorClass)))
        ? AggregateError(errors, `Automation run partially failed`)
        : errors[0];
    }
  }

  async function runAutomationNow({
    appVersion,
    statsig,
    automationId,
    appServerConnection,
    desktopFeatureAvailability = dependencies.defaultDesktopFeatureAvailability,
    requestGitWorker,
    globalState,
    threadProjectAssignments,
    settingsStore,
    appServerClient,
    worktreeLifecycle,
    requestDynamicToolsForThreadStart = async () => [],
    isHostedAutomationAppAvailable = async () => false,
    prepareCronTurnReadState,
    isPackaged = true,
    repoRoot = process.cwd(),
    collaborationMode = null,
    permissions = null,
  }: any) {
    const automation = dependencies.getAutomation(automationId);
    if (!automation) throw Error(`Automation not found.`);
    if (dependencies.isHeartbeatAutomation(automation)) {
      await dependencies.runHeartbeatNow({
        automation,
        appServerConnection,
        collaborationMode,
        permissions,
        isHostedAutomationAppAvailable,
      });
      return;
    }
    dependencies.markAutomationRun(
      automation.id,
      nextCronRunAt({ automation, now: dependencies.now() }),
    );
    await runCronAutomation({
      statsig,
      appVersion,
      automation,
      appServerConnection,
      desktopFeatureAvailability,
      requestGitWorker,
      globalState,
      threadProjectAssignments,
      settingsStore,
      appServerClient,
      worktreeLifecycle,
      requestDynamicToolsForThreadStart,
      isHostedAutomationAppAvailable,
      prepareCronTurnReadState,
      isPackaged,
      repoRoot,
      runTrigger: `run_now`,
    });
  }

  function createAutomationScheduler({
    appVersion,
    statsig,
    appServerConnectionRegistry,
    getDesktopFeatureAvailability = () => dependencies.defaultDesktopFeatureAvailability,
    requestGitWorker,
    globalState,
    threadProjectAssignments,
    settingsStore,
    appServerClient,
    worktreeLifecycle,
    requestDynamicToolsForThreadStart = async () => [],
    isHostedAutomationAppAvailable = async () => false,
    syncAutomations,
    updateCanonicalAutomation,
    deleteArchivedHeartbeat,
    isOnline = dependencies.isOnline,
    prepareCronTurnReadState,
    isPackaged = true,
    repoRoot = process.cwd(),
    tickMs = DEFAULT_AUTOMATION_SCHEDULER_TICK_MS,
    maxPerTick = DEFAULT_AUTOMATION_MAX_PER_TICK,
  }: any) {
    let disposed = false;
    let started = false;
    let ticking = false;
    let nextSyncAt = 0;
    let localAutomationsEnabled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    const abortController = new AbortController();
    const activeAutomationIds = new Set<string>();
    const activeHeartbeatThreadIds = new Set<string>();
    const heartbeatRendererStates = new Map<string, any>();
    const heartbeatCollaborationModes = new Map<string, any>();
    const heartbeatPermissions = new Map<string, any>();

    const tick = async () => {
      if (ticking || !localAutomationsEnabled) return;
      ticking = true;
      try {
        const connection = appServerConnectionRegistry.getConnection(appServerClient.hostConfig.id);
        const due = (at: number) => dependencies
          .listDueAutomations(at, maxPerTick + activeAutomationIds.size)
          .filter((automation) => !activeAutomationIds.has(automation.id))
          .slice(0, maxPerTick);
        let now = dependencies.now();
        let automations = due(now);
        if (syncAutomations != null && isOnline()) {
          if (automations.length > 0) {
            try {
              await syncAutomations();
              nextSyncAt = dependencies.now() + AUTOMATION_SYNC_INTERVAL_MS;
            } catch (error) {
              nextSyncAt = 0;
              dependencies.logger.warning(`Failed to synchronize local automations before run`, {
                safe: {},
                sensitive: { error },
              });
            }
            now = dependencies.now();
            automations = due(now);
          } else if (now >= nextSyncAt) {
            nextSyncAt = now + AUTOMATION_SYNC_INTERVAL_MS;
            syncAutomations().catch((error: unknown) => {
              nextSyncAt = 0;
              dependencies.logger.warning(`Failed to synchronize local automations`, {
                safe: {},
                sensitive: { error },
              });
            });
          }
        }

        await Promise.all(automations.map(async (automation) => {
          try {
            if (automation.lastRunAt != null && automation.lastRunAt + MINIMUM_RUN_INTERVAL_MS > now) {
              dependencies.updateAutomationNextRun(automation.id, automation.lastRunAt + MINIMUM_RUN_INTERVAL_MS);
              return;
            }
            if (dependencies.isHeartbeatAutomation(automation)) {
              if (activeHeartbeatThreadIds.has(automation.targetThreadId)) {
                dependencies.updateAutomationNextRun(automation.id, now + HEARTBEAT_RETRY_MS);
                return;
              }
              activeHeartbeatThreadIds.add(automation.targetThreadId);
              activeAutomationIds.add(automation.id);
              void dependencies.runScheduledHeartbeat({
                automation,
                now,
                appServerConnection: connection,
                signal: abortController.signal,
                assertCurrent: () => {
                  abortController.signal.throwIfAborted();
                  if (appServerConnectionRegistry.getConnection(appServerClient.hostConfig.id) !== connection) {
                    throw new DOMException(`Heartbeat connection was replaced`, `AbortError`);
                  }
                },
                heartbeatThreadRendererStates: heartbeatRendererStates,
                heartbeatThreadCollaborationModes: heartbeatCollaborationModes,
                heartbeatThreadPermissions: heartbeatPermissions,
                updateCanonicalAutomation,
                deleteArchivedHeartbeat,
                isHostedAutomationAppAvailable,
              }).catch((error: unknown) => {
                if (!(error instanceof Error && error.name === `AbortError`)) {
                  dependencies.logger.warning(`Scheduled run failed`, {
                    safe: { automationId: automation.id, error },
                    sensitive: {},
                  });
                }
              }).finally(() => {
                activeAutomationIds.delete(automation.id);
                activeHeartbeatThreadIds.delete(automation.targetThreadId);
              });
              return;
            }
            dependencies.markAutomationRun(
              automation.id,
              nextCronRunAt({ automation, now }),
            );
            await runCronAutomation({
              statsig,
              appVersion,
              automation,
              appServerConnection: connection,
              desktopFeatureAvailability: getDesktopFeatureAvailability(),
              requestGitWorker,
              globalState,
              threadProjectAssignments,
              settingsStore,
              appServerClient,
              worktreeLifecycle,
              requestDynamicToolsForThreadStart,
              isHostedAutomationAppAvailable,
              prepareCronTurnReadState,
              isPackaged,
              repoRoot,
              runTrigger: `scheduled`,
            });
          } catch (error) {
            if (
              error instanceof dependencies.executionConfigErrorClass &&
              error.result.reason === `execution-config-loading`
            ) {
              const current = dependencies.getAutomation(automation.id);
              if (current?.updatedAt === automation.updatedAt) {
                dependencies.updateAutomationNextRun(automation.id, dependencies.now() + MINIMUM_RUN_INTERVAL_MS);
              }
              return;
            }
            dependencies.logger.warning(`Scheduled run failed`, {
              safe: { automationId: automation.id, error },
              sensitive: {},
            });
          }
        }));
      } finally {
        ticking = false;
      }
    };
    const requestTick = () => {
      tick().catch((error) => {
        dependencies.logger.debug(`Automation scheduler tick threw`, {
          safe: { error },
          sensitive: {},
        });
      });
    };

    return {
      getRestartBlockers: () => [
        ...(ticking ? [`automation.tick`] : []),
        ...(activeAutomationIds.size > 0 ? [`automation.heartbeat`] : []),
      ],
      start() {
        if (started || disposed) return;
        started = true;
        try {
          if (dependencies.settleInterruptedAutomationRuns()) {
            appServerConnectionRegistry.getConnection(appServerClient.hostConfig.id)
              .notifyAutomationRunsUpdated();
          }
        } catch (error) {
          dependencies.logger.warning(`Failed to settle interrupted automation runs`, {
            safe: {},
            sensitive: { error },
          });
        }
        dependencies.markSchedulerStarted(dependencies.now());
        requestTick();
        interval = setInterval(requestTick, tickMs);
        interval.unref?.();
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        abortController.abort();
        if (interval != null) clearInterval(interval);
        activeAutomationIds.clear();
        activeHeartbeatThreadIds.clear();
        heartbeatRendererStates.clear();
        heartbeatCollaborationModes.clear();
        heartbeatPermissions.clear();
      },
      setLocalAutomationsCapability(enabled: boolean) {
        if (disposed || localAutomationsEnabled === enabled) return;
        localAutomationsEnabled = enabled;
        if (started && enabled) requestTick();
      },
      setHeartbeatThreadRendererState(event: any) {
        if (disposed) return;
        const threadId = event.threadId?.trim() ?? ``;
        if (threadId.length === 0) return;
        heartbeatRendererStates.set(threadId, {
          isEligible: event.isEligible,
          reason: event.reason,
          updatedAtMs: dependencies.now(),
        });
        if (event.collaborationMode != null) {
          heartbeatCollaborationModes.set(threadId, event.collaborationMode);
        }
        if (event.permissions == null) heartbeatPermissions.delete(threadId);
        else heartbeatPermissions.set(threadId, event.permissions);
      },
    };
  }

  return {
    createAutomationScheduler,
    runAutomationNow,
  };
}
