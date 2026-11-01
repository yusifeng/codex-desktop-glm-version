const RENDERER_STATE_TTL_MS = 120_000;
const HISTORY_TIMEOUT_MS = 30_000;
const COMPLETION_TIMEOUT_MS = 600_000;

const HEARTBEAT_PROMPT = `<heartbeat>
  <automation_id>{{AUTOMATION_ID}}</automation_id>
  <current_time_iso>{{NOW_ISO}}</current_time_iso>
  <instructions>
{{AUTOMATION_PROMPT}}
  </instructions>
</heartbeat>
`;

type HeartbeatRuntimeDependencies = {
  classifyAutomationSchedule(input: { rrule: string; now: number }): any;
  nextHeartbeatPollAt(input: { nextScheduledRunAt: number | null; now: number }): number;
  withHostedAutomationInstructions(mode: any, hostedEnabled: boolean): any;
  checkHostedAutomationAppAvailable(check: () => Promise<boolean>): Promise<boolean>;
  resolveHeartbeatCollaborationMode(input: any): Promise<any>;
  resolveAutomationPermissionSelection(roots: string[], config: any, requirements: any): any;
  updateAutomationNextRun(id: string, nextRunAt: number): void;
  computeAutomationNextRun(input: { automation: any; now: number }): number | null;
  markAutomationRun(id: string, nextRunAt: number | null): void;
  automationErrorKind(error: unknown): string | null;
  getAutomation(id: string): any;
  updateAutomation(input: any): any;
  supportsAppServerFeature(version: string | null | undefined, feature: string): boolean;
  supportsListThreadTurns(version: string): boolean;
  turnSummary: unknown;
  logger: {
    warning(message: string, details: any): void;
    debug(message: string, details: any): void;
  };
  now(): number;
};

export function createHeartbeatAutomationRuntime(dependencies: HeartbeatRuntimeDependencies) {
  async function updateAutomationThreadTitle({ automation, threadId, appServerConnection }: any) {
    try {
      await appServerConnection.updateThreadTitle(threadId, automation.name, null);
    } catch (error) {
      dependencies.logger.warning(`Failed to set automation thread title`, {
        safe: { automationId: automation.id, threadId, error },
        sensitive: {},
      });
    }
  }

  async function runScheduledHeartbeat({
    automation,
    now,
    appServerConnection,
    signal,
    assertCurrent,
    heartbeatThreadRendererStates,
    heartbeatThreadCollaborationModes,
    heartbeatThreadPermissions,
    updateCanonicalAutomation,
    deleteArchivedHeartbeat,
    isHostedAutomationAppAvailable,
  }: any) {
    const schedule = dependencies.classifyAutomationSchedule({ rrule: automation.rrule, now });
    const thread = await appServerConnection.readThread(automation.targetThreadId).catch(() => null);
    assertCurrent();
    if (thread == null) {
      const nextRunAt = dependencies.nextHeartbeatPollAt({
        nextScheduledRunAt: schedule.nextScheduledRunAt,
        now,
      });
      dependencies.updateAutomationNextRun(automation.id, nextRunAt);
      dependencies.logger.warning(`Heartbeat automation skipped: thread missing`, {
        safe: {
          automationId: automation.id,
          targetThreadId: automation.targetThreadId,
          blockReason: `thread_missing`,
          nextRunAt,
          ...schedule,
        },
        sensitive: {},
      });
      return;
    }

    const rendererBlock = rendererBlockReason(
      automation.targetThreadId,
      heartbeatThreadRendererStates,
    );
    if (rendererBlock != null) {
      const nextRunAt = dependencies.nextHeartbeatPollAt({
        nextScheduledRunAt: schedule.nextScheduledRunAt,
        now,
      });
      dependencies.updateAutomationNextRun(automation.id, nextRunAt);
      dependencies.logger.debug(`Heartbeat automation blocked by renderer state`, {
        safe: {
          automationId: automation.id,
          targetThreadId: automation.targetThreadId,
          blockReason: rendererBlock,
          nextRunAt,
          ...schedule,
        },
        sensitive: {},
      });
      return;
    }

    const collaborationMode = dependencies.withHostedAutomationInstructions(
      heartbeatThreadCollaborationModes.get(automation.targetThreadId) ?? null,
      await dependencies.checkHostedAutomationAppAvailable(isHostedAutomationAppAvailable),
    );
    if (collaborationMode == null) {
      const nextRunAt = dependencies.nextHeartbeatPollAt({
        nextScheduledRunAt: schedule.nextScheduledRunAt,
        now,
      });
      dependencies.updateAutomationNextRun(automation.id, nextRunAt);
      dependencies.logger.debug(`Heartbeat automation waiting for renderer mode state`, {
        safe: {
          automationId: automation.id,
          targetThreadId: automation.targetThreadId,
          blockReason: `missing_collaboration_mode`,
          nextRunAt,
          ...schedule,
        },
        sensitive: {},
      });
      return;
    }

    const threadBlock = await inspectHeartbeatThreadState({
      thread,
      appServerConnection,
      signal,
      assertCurrent,
    });
    if (threadBlock != null) {
      const nextRunAt = dependencies.nextHeartbeatPollAt({
        nextScheduledRunAt: schedule.nextScheduledRunAt,
        now,
      });
      dependencies.updateAutomationNextRun(automation.id, nextRunAt);
      dependencies.logger.debug(`Heartbeat automation blocked by thread state`, {
        safe: {
          automationId: automation.id,
          targetThreadId: automation.targetThreadId,
          blockReason: threadBlock,
          nextRunAt,
          ...schedule,
        },
        sensitive: {},
      });
      return;
    }

    const nextRunAt = dependencies.computeAutomationNextRun({ automation, now });
    dependencies.markAutomationRun(automation.id, nextRunAt);
    appServerConnection.notifyAutomationRunTriggered({
      automationKind: automation.kind,
      cwd: thread.cwd,
      executionEnvironment: null,
      model: null,
      pluginTemplateId: null,
      reasoningEffort: null,
      rrule: automation.rrule,
      runTrigger: `scheduled`,
    });
    try {
      await executeHeartbeatTurn({
        automation,
        thread,
        appServerConnection,
        collaborationMode: await dependencies.resolveHeartbeatCollaborationMode({
          automation,
          appServerConnection,
          collaborationMode,
        }),
        permissions: heartbeatThreadPermissions.get(automation.targetThreadId) ?? null,
        waitForCompletion: true,
        runTrigger: `scheduled`,
      });
    } catch (error) {
      if (dependencies.automationErrorKind(error) !== `thread_archived`) throw error;
      assertCurrent();
      const current = dependencies.getAutomation(automation.id);
      if (
        current?.kind !== `heartbeat` ||
        current.status !== `ACTIVE` ||
        current.targetThreadId !== automation.targetThreadId
      ) return;
      const changed = deleteArchivedHeartbeat == null
        ? dependencies.updateAutomation({ ...current, status: `PAUSED` }) != null
        : (await deleteArchivedHeartbeat(current.id)) === `deleted`;
      if (changed) appServerConnection.notifyAutomationRunsUpdated();
    }
  }

  async function runHeartbeatNow({
    automation,
    appServerConnection,
    collaborationMode,
    permissions,
    isHostedAutomationAppAvailable,
  }: any) {
    const thread = await appServerConnection.readThread(automation.targetThreadId).catch(() => null);
    if (thread == null) throw Error(`Heartbeat thread not found.`);
    if (await inspectHeartbeatThreadState({ thread, appServerConnection })) {
      throw Error(`Heartbeat thread is busy right now.`);
    }
    const nextRunAt = dependencies.computeAutomationNextRun({ automation, now: dependencies.now() });
    dependencies.markAutomationRun(automation.id, nextRunAt);
    appServerConnection.notifyAutomationRunTriggered({
      automationKind: automation.kind,
      cwd: thread.cwd,
      executionEnvironment: null,
      model: null,
      pluginTemplateId: null,
      reasoningEffort: null,
      rrule: automation.rrule,
      runTrigger: `run_now`,
    });
    const mode = dependencies.withHostedAutomationInstructions(
      collaborationMode,
      await dependencies.checkHostedAutomationAppAvailable(isHostedAutomationAppAvailable),
    );
    if (mode == null) throw Error(`Heartbeat thread mode is still loading.`);
    await executeHeartbeatTurn({
      automation,
      thread,
      appServerConnection,
      collaborationMode: await dependencies.resolveHeartbeatCollaborationMode({
        automation,
        appServerConnection,
        collaborationMode: mode,
      }),
      permissions,
      waitForCompletion: false,
      runTrigger: `run_now`,
    });
  }

  async function executeHeartbeatTurn({
    automation,
    thread,
    appServerConnection,
    collaborationMode,
    permissions,
    waitForCompletion,
    runTrigger,
  }: any) {
    const resumed = await resumeHeartbeatThread({ thread, appServerConnection });
    const resolvedPermissions = permissions ?? await readHeartbeatPermissions({
      appServerConnection,
      cwd: resumed.cwd,
    });
    await startHeartbeatTurn({
      automation,
      appServerConnection,
      sessionId: resumed.sessionId,
      threadId: resumed.id,
      cwd: resumed.cwd,
      prompt: formatHeartbeatPrompt(automation),
      collaborationMode,
      approvalPolicy: resolvedPermissions.approvalPolicy,
      approvalsReviewer: resolvedPermissions.approvalsReviewer,
      sandboxPolicy: resolvedPermissions.sandboxPolicy,
      model: null,
      effort: null,
      waitForCompletion,
      runTrigger,
    });
  }

  async function resumeHeartbeatThread({ thread, appServerConnection }: any) {
    const response = await appServerConnection.resumeThread(thread.id, {
      cwd: thread.cwd,
      path: thread.path,
    });
    return {
      id: response.thread.id,
      cwd: response.thread.cwd || response.cwd || thread.cwd,
      path: response.thread.path ?? thread.path,
      sessionId: response.thread.sessionId,
    };
  }

  async function readHeartbeatPermissions({ appServerConnection, cwd }: any) {
    const [config, requirements] = await Promise.all([
      appServerConnection.getUserSavedConfiguration(cwd),
      appServerConnection.getConfigRequirements().catch(() => ({ requirements: null })),
    ]);
    return dependencies.resolveAutomationPermissionSelection([cwd], config, requirements.requirements);
  }

  function formatHeartbeatPrompt(automation: any): string {
    return HEARTBEAT_PROMPT
      .replaceAll(`{{AUTOMATION_ID}}`, automation.id)
      .replaceAll(`{{NOW_ISO}}`, new Date(dependencies.now()).toISOString())
      .replaceAll(`{{AUTOMATION_PROMPT}}`, automation.prompt);
  }

  function freshRendererState(states: Map<string, any>, threadId: string) {
    const state = states.get(threadId);
    if (state == null) return null;
    if (dependencies.now() - state.updatedAtMs <= RENDERER_STATE_TTL_MS) return state;
    states.delete(threadId);
    return null;
  }

  function rendererBlockReason(threadId: string, states: Map<string, any>) {
    const state = freshRendererState(states, threadId);
    return state == null || state.isEligible ? null : state.reason ?? `renderer_ineligible`;
  }

  async function inspectHeartbeatThreadState({
    thread,
    appServerConnection,
    signal,
    assertCurrent,
  }: any): Promise<string | null> {
    assertCurrent?.();
    signal?.throwIfAborted();
    if (thread.status.type !== `active`) return null;
    const immediate = activeThreadBlockReason(thread.status);
    if (immediate != null) return immediate;
    if (appServerConnection.appServerVersion == null || appServerConnection.appServerVersion === `0.0.0`) {
      return `active_history_unavailable`;
    }

    const activityController = new AbortController();
    const historySignal = AbortSignal.any([
      activityController.signal,
      AbortSignal.timeout(HISTORY_TIMEOUT_MS),
      ...(signal == null ? [] : [signal]),
    ]);
    let recentActivity = false;
    const unsubscribeNotifications = appServerConnection.registerInternalNotificationHandler((notification: any) => {
      if (
        notification.method === `account/updated` ||
        (notification.method === `thread/deleted` && notification.params?.threadId === thread.id)
      ) activityController.abort();
      else if (
        [`turn/started`, `item/started`, `item/completed`, `thread/status/changed`].includes(notification.method) &&
        notification.params?.threadId === thread.id
      ) recentActivity = true;
    });
    const unsubscribePrincipal = appServerConnection.registerInternalAuthenticatedPrincipalChangeHandler(
      () => activityController.abort(),
    );
    const unsubscribeConnection = appServerConnection.registerInternalConnectionStateHandler(
      (state: string) => state !== `connected` && activityController.abort(),
    );
    const options = {
      priority: `background`,
      source: `tail_history`,
      timeoutMs: HISTORY_TIMEOUT_MS,
      signal: historySignal,
    };
    try {
      const turn = dependencies.supportsListThreadTurns(appServerConnection.appServerVersion)
        ? (await appServerConnection.listThreadTurns(
            thread.id,
            { limit: 1, itemsView: `notLoaded` },
            options,
          )).data[0]
        : (await appServerConnection.readThread(thread.id, { includeTurns: true }, options))?.turns.at(-1);
      assertCurrent?.();
      historySignal.throwIfAborted();
      if (recentActivity) return `active_recent_turn_activity`;
      if (turn?.status !== `completed`) return `active_without_completed_turn`;
      const refreshed = await appServerConnection.readThread(thread.id, undefined, options);
      assertCurrent?.();
      historySignal.throwIfAborted();
      if (recentActivity) return `active_recent_turn_activity`;
      return refreshed?.id === thread.id
        ? activeThreadBlockReason(refreshed.status)
        : `active_history_unavailable`;
    } catch (error) {
      if (error instanceof Error && error.name === `AbortError`) throw error;
      assertCurrent?.();
      signal?.throwIfAborted();
      activityController.signal.throwIfAborted();
      return `active_history_unavailable`;
    } finally {
      unsubscribeNotifications();
      unsubscribePrincipal();
      unsubscribeConnection();
    }
  }

  function activeThreadBlockReason(status: any): string | null {
    if (status.type !== `active`) return null;
    if (status.activeFlags.includes(`waitingOnUserInput`)) return `waiting_on_user_input`;
    if (status.activeFlags.includes(`waitingOnApproval`)) return `waiting_on_approval`;
    return status.activeFlags.length > 0 ? `active_with_flags` : null;
  }

  async function startHeartbeatTurn(input: any) {
    const supportsServiceTier = dependencies.supportsAppServerFeature(
      input.appServerConnection.appServerVersion,
      `serviceTierForTurn`,
    );
    const turnStartParams = {
      threadId: input.threadId,
      turnTrigger: `automation_heartbeat_${input.runTrigger}`,
      input: [{ type: `text`, text: input.prompt, text_elements: [] }],
      cwd: input.cwd,
      approvalPolicy: input.approvalPolicy,
      approvalsReviewer: input.approvalsReviewer,
      sandboxPolicy: input.sandboxPolicy,
      model: input.model,
      effort: input.effort,
      serviceTier: supportsServiceTier ? undefined : null,
      serviceTierForTurn: supportsServiceTier ? `default` : undefined,
      summary: dependencies.turnSummary,
      personality: null,
      outputSchema: null,
      collaborationMode: input.collaborationMode,
    };
    if (input.waitForCompletion) {
      await startHeartbeatTurnAndWaitForCompletion({
        automation: input.automation,
        appServerConnection: input.appServerConnection,
        sessionId: input.sessionId,
        threadId: input.threadId,
        turnStartParams,
      });
      return;
    }
    const waiter = createHeartbeatTurnStartWaiter({
      appServerConnection: input.appServerConnection,
      threadId: input.threadId,
    });
    try {
      const response = await input.appServerConnection.startTurn(turnStartParams, {
        automationKind: `heartbeat`,
        ...(input.automation.notificationPolicy == null
          ? {}
          : { notificationPolicy: input.automation.notificationPolicy }),
        sessionId: input.sessionId,
      });
      await waiter.waitForTurn(response.turn.id);
    } catch (error) {
      waiter.dispose();
      throw error;
    }
  }

  async function startHeartbeatTurnAndWaitForCompletion({
    automation,
    appServerConnection,
    sessionId,
    threadId,
    turnStartParams,
  }: any) {
    let turnId: string | null = null;
    let dispose = () => {};
    const completed = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        dispose();
        resolve();
      }, COMPLETION_TIMEOUT_MS);
      const unsubscribe = appServerConnection.registerInternalNotificationHandler((notification: any) => {
        dispatchHeartbeatTurnNotification({
          notification,
          threadId,
          turnId,
          onTurnStarted: (startedTurnId) => {
            turnId = startedTurnId;
          },
          onCompleted: (completedTurnId, status) => {
            turnId = completedTurnId;
            dispose();
            if (status !== `completed`) {
              reject(Error(`Heartbeat automation did not complete.`));
              return;
            }
            resolve();
          },
        });
      });
      dispose = () => {
        clearTimeout(timeout);
        unsubscribe();
        dispose = () => {};
      };
    });
    try {
      turnId = (await appServerConnection.startTurn(turnStartParams, {
        automationKind: `heartbeat`,
        ...(automation.notificationPolicy == null ? {} : { notificationPolicy: automation.notificationPolicy }),
        sessionId,
      })).turn.id;
      await completed;
    } catch (error) {
      dispose();
      throw error;
    }
  }

  function createHeartbeatTurnStartWaiter({ appServerConnection, threadId }: any) {
    const observedTurnIds = new Set<string>();
    let expectedTurnId: string | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let resolveWait: (() => void) | null = null;
    let rejectWait: ((error: Error) => void) | null = null;
    let disposed = false;
    const resolveIfObserved = () => {
      if (expectedTurnId != null && observedTurnIds.has(expectedTurnId)) resolveWait?.();
    };
    const unsubscribe = appServerConnection.registerInternalNotificationHandler((notification: any) => {
      dispatchHeartbeatTurnNotification({
        notification,
        threadId,
        turnId: null,
        onTurnStarted: (turnId) => {
          observedTurnIds.add(turnId);
          resolveIfObserved();
        },
        onCompleted: (turnId) => {
          observedTurnIds.add(turnId);
          resolveIfObserved();
        },
      });
    });
    const wait = new Promise<void>((resolve, reject) => {
      resolveWait = resolve;
      rejectWait = reject;
    });
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = null;
      }
      unsubscribe();
    };
    return {
      dispose,
      async waitForTurn(turnId: string) {
        expectedTurnId = turnId;
        timeout = setTimeout(() => {
          rejectWait?.(Error(`Timed out waiting for heartbeat automation to start.`));
        }, HISTORY_TIMEOUT_MS);
        resolveIfObserved();
        try {
          await wait;
        } finally {
          dispose();
        }
      },
    };
  }

  return {
    runHeartbeatNow,
    runScheduledHeartbeat,
    updateAutomationThreadTitle,
  };
}

function dispatchHeartbeatTurnNotification({
  notification,
  threadId,
  turnId,
  onTurnStarted,
  onCompleted,
}: any) {
  switch (notification.method) {
    case `turn/started`:
      if (notification.params.threadId === threadId) onTurnStarted(notification.params.turn.id);
      return;
    case `turn/completed`:
      if (
        notification.params.threadId === threadId &&
        (turnId == null || notification.params.turn.id === turnId)
      ) onCompleted(notification.params.turn.id, notification.params.turn.status);
      return;
  }
}
