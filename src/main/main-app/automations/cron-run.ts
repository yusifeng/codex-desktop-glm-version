type CronRunDependencies = {
  automationInstructions: string;
  createProjectlessThreadPaths(input: any): Promise<any>;
  projectlessWorkspaceRootSettingKey: string;
  homeDirectory(): string;
  shouldNormalizeDesktopPaths(hostConfig: unknown): boolean;
  normalizeDesktopPath(value: string, enabled: boolean): string;
  normalizePath(value: string): string;
  readStoredAgentMode(globalState: any, hostId: string): any;
  projectlessWorkspaceInstructions(input: any): string;
  buildDeveloperInstructions(input: any): string;
  resolveAutomationPermissions(
    writableRoots: string[],
    config: any,
    requirements: any,
    storedMode?: string | null,
    forceNeverApproval?: boolean,
  ): any;
  scheduleComputerUseConfigWrite(input: any): void;
  buildBrowserUseThreadConfig(input: any): Promise<Record<string, unknown>>;
  buildAppServerThreadConfig(input: any): Promise<Record<string, unknown>>;
  dynamicToolsConfigKey(appServerVersion: string | null | undefined): string;
  randomUUID(): string;
  recordAutomationRunStart(id: string, threadId: string, name: string, cwd: string | null): void;
  resolveDefaultRemoteBranchStartingState(cwd: string, requestGitWorker: any, appServerClient: any): Promise<any>;
  desktopWorktreesRoot(desktopConfig: unknown): { worktreesRoot: string };
  threadIdOf(value: string): any;
  threadWorkspaceRootHintsKey: string;
  threadProjectlessOutputDirectoriesKey: string;
  replaceAutomationRunThread(pendingId: string, threadId: string): boolean;
  markAutomationRunFailed(threadId: string, reason: string): void;
  collectAutomationWritableRoots(input: any): Promise<string[]>;
  visualizationIdForThread(threadId: string): string | null;
  turnSummary: unknown;
  updateAutomationThreadTitle(input: any): Promise<void>;
  logger: { warning(message: string, details: any): void };
};

export function createCronAutomationRunRuntime(dependencies: CronRunDependencies) {
  function automationTargetCwd(target: any): string | null {
    return target.type === `legacy`
      ? target.cwd
      : target.type === `project`
        ? target.project.roots[0] ?? null
        : null;
  }

  async function executeCronAutomationTarget({
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
    automationModelSettings,
    appToolNames,
    hostedAutomationsAvailable,
    prepareCronTurnReadState,
    isPackaged,
    repoRoot,
  }: any) {
    const title = `Automation: ${automation.name}`;
    const baseInstructions = dependencies.automationInstructions.trim();
    const projectless = target.type === `projectless`;
    const project = target.type === `project` ? target.project : null;
    const projectRoots = project?.roots ?? [];
    const configuredCwd = automationTargetCwd(target);
    let cwd = configuredCwd ?? dependencies.normalizePath(`~`);
    let writableRoots = target.type === `legacy` ? [target.cwd] : projectRoots;
    let projectlessOutputDirectory: string | null = null;
    let projectlessWorkspaceRoot: string | null = null;

    if (projectless || configuredCwd == null) {
      const paths = await dependencies.createProjectlessThreadPaths({
        appServerClient,
        configuredWorkspaceRoot: appServerClient.hostConfig.id === `local`
          ? settingsStore.getEffective(dependencies.projectlessWorkspaceRootSettingKey)
          : null,
        createSplitDirectories: true,
        homeDirectory: dependencies.homeDirectory(),
        prompt: automation.prompt,
      });
      const normalizeDesktopPaths = dependencies.shouldNormalizeDesktopPaths(appServerClient.hostConfig);
      cwd = dependencies.normalizePath(
        dependencies.normalizeDesktopPath(paths.cwd, normalizeDesktopPaths),
      );
      projectlessOutputDirectory = dependencies.normalizeDesktopPath(
        paths.outputDirectory,
        normalizeDesktopPaths,
      );
      projectlessWorkspaceRoot = dependencies.normalizeDesktopPath(
        paths.workspaceRoot,
        normalizeDesktopPaths,
      );
      writableRoots = [dependencies.normalizePath(projectlessWorkspaceRoot), ...projectRoots];
      if (!projectless) projectlessOutputDirectory = null;
    }

    const savedConfig = await appServerConnection.getUserSavedConfiguration(cwd);
    const storedAgentMode = dependencies.readStoredAgentMode(
      globalState,
      appServerClient.hostConfig.id,
    );
    const projectlessInstructions = projectlessOutputDirectory == null
      ? null
      : dependencies.projectlessWorkspaceInstructions({
          cwd,
          projectlessOutputDirectory,
          projectlessWorkspaceBrowserRoot: projectlessWorkspaceRoot,
        });
    const developerInstructions = [
      dependencies.buildDeveloperInstructions({
        baseInstructions,
        isNonGitWorkspace: true,
        threadToolsEnabled: true,
        hostedAutomationsEnabled: hostedAutomationsAvailable,
      }),
      projectlessInstructions,
    ].filter(Boolean).join(`\n\n`);
    const initialPermissions = dependencies.resolveAutomationPermissions(
      writableRoots,
      savedConfig,
      configRequirements,
      storedAgentMode,
      projectless,
    );
    const shouldCreateWorktree = automation.executionEnvironment === `worktree` && !projectless;
    if (shouldCreateWorktree && configuredCwd == null) {
      throw Error(`Worktree automations require a project with a folder`);
    }
    const canCreateWorktree = shouldCreateWorktree &&
      (await requestGitWorker({
        method: `stable-metadata`,
        params: {
          cwd,
          hostConfig: appServerClient.hostConfig,
          operationSource: `git_direct_call`,
        },
      })) != null;

    const startThread = async (threadCwd: string) => {
      const hostConfig = appServerClient.hostConfig;
      dependencies.scheduleComputerUseConfigWrite({ settingsStore, isPackaged, repoRoot });
      const browserConfig = await dependencies.buildBrowserUseThreadConfig({
        appServerConnection,
        appVersion,
        desktopFeatureAvailability,
        cwd: threadCwd,
        isPackaged,
        repoRoot,
        shouldUseWslPaths: dependencies.shouldNormalizeDesktopPaths(hostConfig),
      });
      return appServerConnection.startThread({
        model: automationModelSettings.model,
        modelProvider: null,
        cwd: threadCwd,
        approvalPolicy: initialPermissions.approvalPolicy,
        approvalsReviewer: initialPermissions.approvalsReviewer,
        sandbox: sandboxMode(initialPermissions.sandboxPolicy),
        config: {
          ...browserConfig,
          ...(await dependencies.buildAppServerThreadConfig({
            hostConfig,
            appServerVersion: appServerConnection.appServerVersion,
          })),
          [dependencies.dynamicToolsConfigKey(appServerConnection.appServerVersion)]: appToolNames,
        },
        developerInstructions,
        personality: null,
        ephemeral: null,
        threadSource: `automation`,
        dynamicTools: [],
        mockExperimentalField: null,
        experimentalRawEvents: false,
        serviceTier: null,
      });
    };

    let startedThread: any = null;
    let threadId: string | null = null;
    let worktreeGitRoot: string | null = null;
    const pendingRunId = `pending:${dependencies.randomUUID()}`;
    dependencies.recordAutomationRunStart(automation.id, pendingRunId, automation.name, configuredCwd);
    appServerConnection.notifyAutomationRunsUpdated();
    try {
      if (canCreateWorktree) {
        const startingState = await dependencies.resolveDefaultRemoteBranchStartingState(
          cwd,
          requestGitWorker,
          appServerClient,
        );
        const worktree = await requestGitWorker({
          method: `create-worktree`,
          params: {
            cwd,
            startingState,
            upstreamRefreshMode: `never`,
            localEnvironmentConfigPath: automation.localEnvironmentConfigPath,
            hostConfig: appServerClient.hostConfig,
            operationSource: `git_direct_call`,
            worktreesRoot: dependencies.desktopWorktreesRoot(savedConfig.desktop).worktreesRoot,
            useWorkspaceDir: desktopFeatureAvailability.workspaceDir,
            streamId: dependencies.randomUUID(),
          },
        });
        worktreeGitRoot = worktree.worktreeGitRoot;
        startedThread = await startThread(worktree.worktreeWorkspaceRoot);
      } else {
        startedThread = await startThread(cwd);
      }
      threadId = startedThread.thread.id;
      if (worktreeGitRoot != null) {
        try {
          await worktreeLifecycle.setOwnerThread({
            conversationId: dependencies.threadIdOf(threadId),
            worktree: worktreeGitRoot,
          });
          worktreeLifecycle.requestCleanup();
        } catch (error) {
          dependencies.logger.warning(
            `Automation worktree thread started, but owner metadata could not be updated`,
            { safe: { automationId: automation.id }, sensitive: { error } },
          );
        }
      }

      if (projectless) {
        await threadProjectAssignments.setProjectless({
          threadId: dependencies.threadIdOf(threadId),
          projectless: true,
        });
        if (projectlessWorkspaceRoot != null) {
          globalState.update(dependencies.threadWorkspaceRootHintsKey, (value: any) => ({
            ...value,
            [threadId!]: projectlessWorkspaceRoot,
          }));
        }
        if (projectlessOutputDirectory != null) {
          globalState.update(dependencies.threadProjectlessOutputDirectoriesKey, (value: any) => ({
            ...value,
            [threadId!]: projectlessOutputDirectory,
          }));
        }
      } else if (project != null) {
        await threadProjectAssignments.setAssignment({
          threadId: dependencies.threadIdOf(threadId),
          assignment: { projectKind: `local`, projectId: project.projectId },
        });
      }
      if (!dependencies.replaceAutomationRunThread(pendingRunId, threadId)) {
        dependencies.recordAutomationRunStart(automation.id, threadId, automation.name, configuredCwd);
      }
      appServerConnection.notifyAutomationRunsUpdated();
      void dependencies.updateAutomationThreadTitle({
        automation,
        threadId,
        appServerConnection,
      });
    } catch (error) {
      dependencies.markAutomationRunFailed(pendingRunId, `auto`);
      appServerConnection.notifyAutomationRunsUpdated();
      throw error;
    }
    if (startedThread == null || threadId == null) throw Error(`Automation thread start failed`);

    let expandedWritableRoots: string[];
    try {
      expandedWritableRoots = await dependencies.collectAutomationWritableRoots({
        sourceCwds: writableRoots,
        worktreeCwd: startedThread.cwd,
        requestGitWorker,
        appServerClient,
        automationId: automation.id,
        includeGitRoots: !projectless,
      });
    } catch (error) {
      dependencies.markAutomationRunFailed(threadId, `auto`);
      appServerConnection.notifyAutomationRunsUpdated();
      throw error;
    }

    const finalPermissions = dependencies.resolveAutomationPermissions(
      expandedWritableRoots,
      savedConfig,
      configRequirements,
      storedAgentMode,
      projectless,
    );
    const visualizationId = dependencies.visualizationIdForThread(threadId);
    let sandboxPolicy = finalPermissions.sandboxPolicy;
    let runtimeWorkspaceRoots: string[] | null = null;
    if (
      visualizationId != null &&
      (sandboxPolicy.type === `workspaceWrite` || sandboxPolicy.type === `dangerFullAccess`)
    ) {
      try {
        const [root, platformPath] = await Promise.all([
          desktopFeatureAvailability.workspaceDir
            ? appServerClient.workspacesRoot()
            : appServerClient.codexHome(),
          appServerClient.platformPath(),
        ]);
        const visualizationDirectory = platformPath.join(
          dependencies.normalizeDesktopPath(
            root,
            dependencies.shouldNormalizeDesktopPaths(appServerClient.hostConfig),
          ),
          `visualizations`,
          ...visualizationId.split(`/`),
          threadId,
        );
        await appServerClient.createDirectory(visualizationDirectory, { recursive: true });
        if (sandboxPolicy.type === `workspaceWrite`) {
          sandboxPolicy = {
            ...sandboxPolicy,
            writableRoots: [...sandboxPolicy.writableRoots, visualizationDirectory],
          };
        } else {
          runtimeWorkspaceRoots = [...expandedWritableRoots, visualizationDirectory];
        }
      } catch (error) {
        if (sandboxPolicy.type === `dangerFullAccess`) runtimeWorkspaceRoots = expandedWritableRoots;
        dependencies.logger.warning(`Failed to prepare visualization directory for automation run`, {
          safe: { automationId: automation.id },
          sensitive: { error },
        });
      }
    }

    const lastRun = automation.lastRunAt == null
      ? `never`
      : `${new Date(automation.lastRunAt).toISOString()} (${automation.lastRunAt})`;
    const prompt = `${title}\nAutomation ID: ${automation.id}\nAutomation memory: $CODEX_HOME/automations/${automation.id}/memory.md\nLast run: ${lastRun}\n\n${automation.prompt}`;
    const turnStartParams = {
      threadId,
      turnTrigger: `automation_cron_${runTrigger}`,
      input: [{ type: `text`, text: prompt, text_elements: [] }],
      cwd: startedThread.cwd,
      approvalPolicy: finalPermissions.approvalPolicy,
      approvalsReviewer: finalPermissions.approvalsReviewer,
      sandboxPolicy,
      runtimeWorkspaceRoots,
      model: automationModelSettings.model,
      effort: automationModelSettings.reasoningEffort,
      serviceTier: null,
      summary: dependencies.turnSummary,
      personality: null,
      outputSchema: null,
      collaborationMode: null,
    };
    let readStatePreparation;
    try {
      readStatePreparation = prepareCronTurnReadState?.({
        appServerConnection,
        threadId: startedThread.thread.id,
        notificationPolicy: automation.notificationPolicy,
      });
    } catch (error) {
      dependencies.logger.warning(`Failed to prepare automation task unread state`, {
        safe: {},
        sensitive: { error },
      });
    }
    try {
      await appServerConnection.startTurn(turnStartParams, {
        automationKind: automation.kind,
        notificationPolicy: automation.notificationPolicy,
        sessionId: startedThread.thread.sessionId,
      });
    } catch (error) {
      readStatePreparation?.handleStartFailure();
      throw error;
    }
  }

  return { automationTargetCwd, executeCronAutomationTarget };
}

function sandboxMode(policy: any): string {
  return policy.type === `dangerFullAccess`
    ? `danger-full-access`
    : policy.type === `readOnly`
      ? `read-only`
      : `workspace-write`;
}
