export const HEARTBEAT_RETRY_MS = 60_000;

type AutomationExecutionPolicyDependencies = {
  localProjectsKey: string;
  appConfigStateKey: string;
  agentModeByHostKey: string;
  agentModeSchema: { safeParse(value: unknown): { success: boolean; data?: unknown } };
  parseLocalProjects(value: unknown): Record<string, any>;
  normalizePath(value: string): string;
  defaultPermissions(): any;
  permissionProfileOf(sandboxPolicy: any): unknown;
  managedRequirementsAllow(
    requirements: any,
    profile: unknown,
    approvalPolicy: string,
    approvalsReviewer: string,
  ): boolean;
  parseIntervalMs(rrule: string): number | null;
  computeNextRun(input: { rrule: string; now: number }): number | null;
  withHostedAutomationInstructions(input: {
    baseInstructions: unknown;
    hostedAutomationsEnabled: boolean;
  }): unknown;
  selectAutomationModel(input: any): { model: string; reasoningEffort: string | null };
  findModel(models: any[], model: string): { upgrade?: string } | null | undefined;
  shouldNormalizeDesktopPaths(hostConfig: unknown): boolean;
  normalizeDesktopPath(value: string, enabled: boolean): string;
  permissionModes(requirements: any, config: any): string[];
  requestedPermissionMode(config: any): string;
  isGuardianApprovalsMode(mode: string): boolean;
  permissionConfig(mode: string, writableRoots: string[], config: any): any;
  logger: {
    warning(message: string, details: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
  };
};

export function createAutomationExecutionPolicy(dependencies: AutomationExecutionPolicyDependencies) {
  function findCompatibleAutomationPermissions(current: any, requirements: any) {
    const reviewers = [current.approvalsReviewer, ...(requirements?.allowedApprovalsReviewers ?? [])];
    const policies = [current.approvalPolicy, ...(requirements?.allowedApprovalPolicies ?? [])];
    const sandboxPolicies = [current.sandboxPolicy, dependencies.defaultPermissions().sandboxPolicy];
    for (const sandboxPolicy of sandboxPolicies) {
      if (sandboxPolicy.type === `dangerFullAccess` || requirements?.allowedPermissionProfiles != null) continue;
      for (const approvalsReviewer of reviewers) {
        for (const approvalPolicy of policies) {
          if (
            (approvalPolicy !== `never` || current.approvalPolicy === `never`) &&
            dependencies.managedRequirementsAllow(
              requirements,
              dependencies.permissionProfileOf(sandboxPolicy),
              approvalPolicy,
              approvalsReviewer,
            )
          ) {
            return {
              ...current,
              activePermissionProfile: null,
              sandboxPolicy,
              approvalPolicy,
              approvalsReviewer,
            };
          }
        }
      }
    }
    throw Error(`No compatible automation permissions satisfy the managed requirements`);
  }

  function resolveAutomationProjectTarget(globalState: any, target: any) {
    if (target.type === `projectless`) return null;
    const project = dependencies.parseLocalProjects(
      globalState.get(dependencies.localProjectsKey),
    )[target.projectId];
    if (project == null) throw Error(`Automation project no longer exists`);
    return {
      projectId: target.projectId,
      roots: project.rootPaths.map(dependencies.normalizePath),
    };
  }

  function resolveAutomationCompatibilityCwds(globalState: any, projectId: string | null | undefined) {
    return projectId == null
      ? [dependencies.normalizePath(`~`)]
      : resolveAutomationProjectTarget(globalState, { type: `project`, projectId })?.roots ?? [];
  }

  function assertWorktreeAutomationTarget({
    compatibilityCwds,
    executionEnvironment,
    projectId,
  }: {
    compatibilityCwds: string[];
    executionEnvironment: string;
    projectId: string | null | undefined;
  }) {
    if (executionEnvironment === `worktree` && (projectId == null || compatibilityCwds.length === 0)) {
      throw Error(`Worktree automations require a project with a folder`);
    }
  }

  function nextHeartbeatPollAt({ nextScheduledRunAt, now }: { nextScheduledRunAt: number | null; now: number }) {
    return nextScheduledRunAt == null
      ? now + HEARTBEAT_RETRY_MS
      : Math.min(nextScheduledRunAt, now + HEARTBEAT_RETRY_MS);
  }

  function classifyAutomationSchedule({ rrule, now }: { rrule: string; now: number }) {
    const intervalMs = dependencies.parseIntervalMs(rrule);
    return {
      scheduleKind: intervalMs == null ? `wall_clock` : `interval`,
      intervalMs,
      nextScheduledRunAt: dependencies.computeNextRun({ rrule, now }),
    };
  }

  function withHostedAutomationInstructions(collaborationMode: any, hostedAutomationsEnabled = false) {
    return collaborationMode == null
      ? null
      : {
          ...collaborationMode,
          settings: {
            ...collaborationMode.settings,
            developer_instructions: dependencies.withHostedAutomationInstructions({
              baseInstructions: collaborationMode.settings.developer_instructions,
              hostedAutomationsEnabled,
            }),
          },
        };
  }

  async function resolveHeartbeatCollaborationMode({
    automation,
    appServerConnection,
    collaborationMode,
  }: {
    automation: any;
    appServerConnection: any;
    collaborationMode: any;
  }) {
    try {
      const models = [];
      let cursor = null;
      do {
        const page = await appServerConnection.listModels({ includeHidden: true, cursor, limit: 100 });
        models.push(...page.data);
        cursor = page.nextCursor;
      } while (cursor != null);
      if (models.length === 0) return collaborationMode;
      const selection = dependencies.selectAutomationModel({
        automation: {
          ...automation,
          model: dependencies.findModel(models, collaborationMode.settings.model)?.upgrade ??
            collaborationMode.settings.model,
          reasoningEffort: collaborationMode.settings.reasoning_effort ?? null,
        },
        models,
      });
      const modelChanged = collaborationMode.settings.model !== selection.model;
      if (modelChanged) {
        dependencies.logger.warning(`Heartbeat model changed for run`, {
          safe: {
            automationId: automation.id,
            requestedModel: collaborationMode.settings.model,
            selectedModel: selection.model,
          },
          sensitive: {},
        });
      }
      return {
        ...collaborationMode,
        settings: {
          ...collaborationMode.settings,
          model: selection.model,
          reasoning_effort: modelChanged || collaborationMode.settings.reasoning_effort != null
            ? selection.reasoningEffort
            : null,
        },
      };
    } catch (error) {
      dependencies.logger.warning(`Failed to load models for heartbeat run`, {
        safe: { automationId: automation.id },
        sensitive: { error },
      });
      return collaborationMode;
    }
  }

  async function resolveDefaultRemoteBranchStartingState(
    cwd: string,
    requestGitWorker: (request: any) => Promise<{ branch: string | null }>,
    appServerClient: any,
  ) {
    const { branch } = await requestGitWorker({
      method: `default-remote-branch`,
      params: {
        cwd,
        hostConfig: appServerClient.hostConfig,
        operationSource: `git_direct_call`,
      },
    });
    return { type: `branch`, branchName: branch ?? `HEAD` };
  }

  async function collectAutomationWritableRoots({
    sourceCwds,
    worktreeCwd,
    requestGitWorker,
    appServerClient,
    automationId,
    includeGitRoots,
  }: {
    sourceCwds: string[];
    worktreeCwd: string;
    requestGitWorker: (request: any) => Promise<{ roots: string[] }>;
    appServerClient: any;
    automationId: string;
    includeGitRoots: boolean;
  }) {
    const sources = sourceCwds.length > 0 ? sourceCwds : [dependencies.normalizePath(worktreeCwd)];
    const [codexHome, platformPath, gitRoots] = await Promise.all([
      appServerClient.codexHome(),
      appServerClient.platformPath(),
      Promise.all(includeGitRoots
        ? sources.map((sourceCwd) => requestGitWorker({
            method: `automation-writable-roots`,
            params: {
              sourceCwd,
              worktreeCwd,
              hostConfig: appServerClient.hostConfig,
              operationSource: `git_direct_call`,
            },
          }).then(({ roots }) => roots))
        : []),
    ]);
    return [...new Set([
      ...sourceCwds,
      worktreeCwd,
      platformPath.join(
        dependencies.normalizeDesktopPath(
          codexHome,
          dependencies.shouldNormalizeDesktopPaths(appServerClient.hostConfig),
        ),
        `automations`,
        automationId,
      ),
      ...gitRoots.flat(),
    ])];
  }

  function resolveAutomationPermissions(
    writableRoots: string[],
    config: any,
    requirements: any,
    storedMode: string | null = null,
    forceNeverApproval = false,
  ) {
    const inferredMode = config.sandbox_mode != null || config.approval_policy != null
      ? `custom`
      : dependencies.isGuardianApprovalsMode(dependencies.requestedPermissionMode(config))
        ? `guardian-approvals`
        : `auto`;
    const preferredMode = storedMode ?? inferredMode;
    const allowedModes = dependencies.permissionModes(requirements, config);
    const fallbackMode = [inferredMode, `auto`, `granular`, `guardian-approvals`, `read-only`]
      .find((mode) => allowedModes.includes(mode));
    const mode = allowedModes.includes(preferredMode) ? preferredMode : fallbackMode;
    if (mode == null) {
      return findCompatibleAutomationPermissions(
        dependencies.permissionConfig(preferredMode, writableRoots, config),
        requirements,
      );
    }
    const resolved = dependencies.permissionConfig(mode, writableRoots, config);
    const neverAllowed = requirements?.allowedApprovalPolicies == null ||
      requirements.allowedApprovalPolicies.includes(`never`);
    const reviewer = forceNeverApproval && neverAllowed &&
      (requirements?.allowedApprovalsReviewers == null || requirements.allowedApprovalsReviewers.includes(`user`))
      ? `user`
      : resolved.approvalsReviewer;
    return {
      approvalPolicy: neverAllowed && (forceNeverApproval || (mode !== `granular` && reviewer === `user`))
        ? `never`
        : resolved.approvalPolicy,
      approvalsReviewer: reviewer,
      sandboxPolicy: forceNeverApproval &&
        resolved.sandboxPolicy.type === `workspaceWrite` &&
        config.sandbox_mode === `workspace-write` &&
        config.sandbox_workspace_write?.network_access === true
        ? { ...resolved.sandboxPolicy, networkAccess: true }
        : resolved.sandboxPolicy,
    };
  }

  function readStoredAgentMode(globalState: any, hostId: string) {
    const value = globalState.get(dependencies.appConfigStateKey)?.[dependencies.agentModeByHostKey];
    if (typeof value !== `object` || value == null || Array.isArray(value)) return null;
    const entry = Object.getOwnPropertyDescriptor(value, hostId)?.value;
    const parsed = dependencies.agentModeSchema.safeParse(entry);
    return parsed.success ? parsed.data : null;
  }

  function resolveAutomationPermissionSelection(writableRoots: string[], config: any, requirements: any) {
    const allowedModes = dependencies.permissionModes(requirements, config);
    const requestedMode = dependencies.requestedPermissionMode(config);
    const inferredMode = config.sandbox_mode != null || config.approval_policy != null
      ? `custom`
      : dependencies.isGuardianApprovalsMode(requestedMode)
        ? `guardian-approvals`
        : `auto`;
    let mode = inferredMode;
    if (!allowedModes.includes(mode)) {
      if (inferredMode === `auto` && allowedModes.includes(`guardian-approvals`)) mode = `guardian-approvals`;
      else if (inferredMode === `guardian-approvals` && allowedModes.includes(`auto`)) mode = `auto`;
      else if (allowedModes.includes(`read-only`)) mode = `read-only`;
      else {
        const fallback = allowedModes.find((candidate) => candidate !== `full-access`);
        if (fallback == null) {
          return findCompatibleAutomationPermissions(
            dependencies.permissionConfig(inferredMode, writableRoots, config),
            requirements,
          );
        }
        mode = fallback;
      }
    }
    return dependencies.permissionConfig(mode, writableRoots, config);
  }

  function forEachSequentially<T>(values: T[], iteratee: (value: T, index: number) => unknown) {
    return values.reduce(
      (operation, value, index) => operation.then(() => iteratee(value, index)),
      Promise.resolve() as Promise<unknown>,
    );
  }

  return {
    assertWorktreeAutomationTarget,
    classifyAutomationSchedule,
    collectAutomationWritableRoots,
    findCompatibleAutomationPermissions,
    forEachSequentially,
    nextHeartbeatPollAt,
    readStoredAgentMode,
    resolveAutomationCompatibilityCwds,
    resolveAutomationPermissions,
    resolveAutomationPermissionSelection,
    resolveAutomationProjectTarget,
    resolveDefaultRemoteBranchStartingState,
    resolveHeartbeatCollaborationMode,
    withHostedAutomationInstructions,
  };
}
