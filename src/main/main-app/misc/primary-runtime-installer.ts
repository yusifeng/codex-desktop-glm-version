type PrimaryRuntimeInstallerDependencies = {
  runtime: any;
  logger: any;
  electron: any;
  buildRuntime: any;
  path: any;
  fs: any;
  os: any;
  processRef: NodeJS.Process;
  resolveElectronResourcesPath(options: any): string | null;
  reconcileMarketplaceRoot(options: any): Promise<boolean>;
  randomUUID(): string;
  now(): number;
};

type ActiveInstall = {
  bundleOperationId: string;
  controller: AbortController | null;
  requireWindowsFramework: boolean;
  promise: Promise<any>;
  postInstallPromise: Promise<void>;
  postInstallStage: string;
};

/** Owns primary-runtime install single-flight, post-install synchronization, restore, and diagnostics. */
export function createPrimaryRuntimeInstaller(dependencies: PrimaryRuntimeInstallerDependencies) {
  const runtime = dependencies.runtime;
  const buildRuntime = dependencies.buildRuntime;
  const path = dependencies.path.default ?? dependencies.path;
  const fs = dependencies.fs.default ?? dependencies.fs;
  const os = dependencies.os.default ?? dependencies.os;
  const installLogger = dependencies.logger.i("install-primary-runtime");
  const dependencyToolLogger = dependencies.logger.r("workspace-dependencies-tool");
  const dependencyToolArgumentsSchema = runtime.Df({});
  const updateIntervalMs = 36e5;
  const retryIntervalMs = 3e4;
  const activeInstalls = new Map<string, ActiveInstall>();
  let operationQueue = Promise.resolve();

  function toolFailure(message: string) {
    return { contentItems: [{ type: "inputText", text: message }], success: false };
  }

  async function executeDependencyTool(
    { hostId, argumentsValue }: any,
    loadDependencies: () => Promise<any>,
  ) {
    if (hostId !== "local")
      return toolFailure("Workspace dependency tools are only supported for local threads.");
    if (!dependencyToolArgumentsSchema.safeParse(argumentsValue).success)
      return toolFailure("load_workspace_dependencies takes no arguments.");
    try {
      const startedAt = dependencies.now();
      const result = await loadDependencies();
      let outcome = result?.installed && result.instructions != null ? "available" : "unavailable";
      if (result == null) outcome = "disabled";
      dependencyToolLogger.info("primary_runtime_dependency_tool_outcome", {
        safe: {
          outcome,
          bundleVersion: result?.bundleVersion ?? null,
          durationMs: dependencies.now() - startedAt,
        },
      });
      if (result == null)
        return toolFailure("Workspace dependency tools are disabled in Codex settings.");
      if (!result.installed || result.instructions == null)
        return toolFailure("No bundled workspace runtime dependencies are configured yet.");
      return {
        contentItems: [{
          type: "inputText",
          text: [
            "Workspace dependencies are available for this local desktop thread.",
            result.instructions,
          ].join("\n\n"),
        }],
        success: true,
      };
    } catch (error) {
      dependencyToolLogger.error("primary_runtime_dependency_tool_outcome", {
        safe: { tool: "load_workspace_dependencies", outcome: "failed" },
        sensitive: { error },
      });
      return toolFailure("Failed to load workspace dependency runtime details.");
    }
  }

  function cancelInstalls({ windowsFrameworksOnly = false } = {}) {
    let canceled = false;
    for (const { controller, requireWindowsFramework } of activeInstalls.values()) {
      if (controller == null || (windowsFrameworksOnly && !requireWindowsFramework)) continue;
      controller.abort();
      canceled = true;
    }
    return canceled;
  }

  function isFeatureEnabled(value: unknown) {
    const parsed = runtime.wf({ features: runtime.wf({ [runtime.ec]: runtime.gf() }) }).safeParse(value);
    return parsed.success && parsed.data.features.workspace_dependencies === true;
  }

  async function readFeatureEnabled(connection: any) {
    const readPage = async (cursor: string | null): Promise<boolean> => {
      const page = await connection.sendAppServerRequest("experimentalFeature/list", {
        cursor,
        limit: 100,
      });
      return page.data.some((feature: any) =>
        feature.name === "workspace_dependencies" && feature.enabled === true)
        ? true
        : page.nextCursor != null && readPage(page.nextCursor);
    };
    return readPage(null);
  }

  function isAbortError(error: unknown) {
    return error instanceof Error || (typeof DOMException !== "undefined" && error instanceof DOMException)
      ? error.name === "AbortError" || error.message.toLowerCase().includes("aborted")
      : false;
  }

  function logCallOutcome({ error, targetKey, ...safe }: any) {
    installLogger().info("primary_runtime_install_call_outcome", {
      safe: { ...safe, target: targetKey },
      sensitive: error == null ? {} : { error },
    });
  }

  function reportInstallFailure({ error, errorReporter, targetKey, ...safe }: any) {
    if (
      error instanceof Error &&
      error.message === "Codex Workspace dependencies are not supported on Windows 10."
    ) {
      installLogger().info("primary_runtime_install_unsupported_host", {
        safe: { ...safe, errorName: error.name, target: targetKey },
        sensitive: { error },
      });
      return;
    }
    const extra = targetKey.startsWith("win32-") ? buildRuntime.c(error) : undefined;
    installLogger().error("primary_runtime_install_failed", {
      safe: {
        ...extra,
        ...safe,
        errorName: error instanceof Error ? error.name : typeof error,
        target: targetKey,
      },
      sensitive: { error },
    });
    if (!(error instanceof TypeError && error.message === "fetch failed"))
      errorReporter.reportNonFatal(error instanceof Error ? error : Error(String(error)), {
        kind: "install-primary-runtime",
        extra,
        tags: {
          errorCategory: safe.errorCategory,
          failureDomain: safe.failureDomain,
          failureStage: safe.failureStage,
          release: safe.release,
          target: targetKey,
          trigger: safe.trigger,
        },
      });
  }

  function reloadSkills({ connection, release, targetKey }: any) {
    connection.sendAppServerRequest("skills/list", { forceReload: true }).catch((error: unknown) => {
      installLogger().warning("primary_runtime_skills_reload_failed", {
        safe: { release, target: targetKey },
        sensitive: { error },
      });
    });
  }

  async function copySafePluginMarketplace(source: string, signal: AbortSignal) {
    const destination = path.join(
      os.homedir(),
      ".cache",
      "codex-runtimes",
      runtime.yn,
      "plugins",
      path.basename(source),
    );
    const staging = `${destination}.staging-${dependencies.randomUUID()}`;
    signal.throwIfAborted();
    await fs.mkdir(path.dirname(destination), { recursive: true });
    try {
      await fs.cp(source, staging, {
        recursive: true,
        filter: async (entry: string) => {
          signal.throwIfAborted();
          const stat = await fs.lstat(entry);
          return !stat.isSymbolicLink() && (
            !stat.isFile() ||
            !/\.(?:exe|dll|pyd|node|sys|ocx|scr|cpl|com|bat|cmd|ps1|psm1|vbs|wsf|hta|lnk)$/i.test(entry)
          );
        },
      });
      signal.throwIfAborted();
      await fs.rm(destination, { force: true, recursive: true });
      await fs.rename(staging, destination);
      return destination;
    } finally {
      await fs.rm(staging, { force: true, recursive: true });
    }
  }

  async function syncPluginMarketplaces(
    connection: any,
    runtimePaths: any,
    copyForFramework: boolean,
    signal: AbortSignal,
  ) {
    const beforeSendRequest = () => signal.throwIfAborted();
    if (runtimePaths.bundledPluginMarketplacePaths.length === 0) return;
    const results = await Promise.all(
      runtimePaths.bundledPluginMarketplacePaths.map(async (marketplaceRoot: string) =>
        dependencies.reconcileMarketplaceRoot({
          appServerConnection: connection,
          beforeSendRequest,
          marketplaceRoot: copyForFramework
            ? await copySafePluginMarketplace(marketplaceRoot, signal)
            : marketplaceRoot,
        })),
    );
    signal.throwIfAborted();
    if (results.some((result) => !result))
      throw Error("Failed to sync primary runtime bundled plugin marketplace");
  }

  function pathIsWithin(child: string, parent: string) {
    const relative = path.relative(parent, child);
    return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
  }

  function resolveRemovedSkillPath({ skillDir, skillsRoot }: any) {
    const root = path.resolve(skillsRoot);
    const candidate = path.resolve(skillsRoot, skillDir);
    if (pathIsWithin(candidate, root)) return candidate;
    throw Error(`Primary runtime removed skill path must stay within the Codex skills directory: ${skillDir}`);
  }

  function hasErrorCode(error: unknown, code: string) {
    return typeof error === "object" && error != null && "code" in error && error.code === code;
  }

  async function removeLegacySkills({ codexHome, skillsToRemove }: any) {
    if (skillsToRemove.length === 0) return;
    const skillsRoot = path.join(codexHome, "skills");
    for (const skillDir of skillsToRemove) {
      const skillRoot = resolveRemovedSkillPath({ skillDir, skillsRoot });
      const stat = await fs.stat(skillRoot).catch((error: unknown) => {
        if (hasErrorCode(error, "ENOENT")) return null;
        throw error;
      });
      if (!stat?.isDirectory()) continue;
      const backupPath = path.join(
        codexHome,
        ".tmp",
        "legacy-primary-runtime-skills",
        `${path.basename(skillRoot)}-${dependencies.now()}-${dependencies.randomUUID()}`,
      );
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      const moved = await fs.rename(skillRoot, backupPath).then(
        () => true,
        (error: unknown) => {
          if (hasErrorCode(error, "ENOENT")) return false;
          throw error;
        },
      );
      if (moved)
        installLogger().info("primary_runtime_legacy_skill_migrated", {
          safe: { skillDir },
          sensitive: { backupPath, skillRoot },
        });
    }
  }

  async function syncSkills(connection: any, runtimePaths: any, signal: AbortSignal) {
    if (runtimePaths.skillsToRemove.length === 0 && runtimePaths.bundledSkillPaths.length === 0) return;
    const codexHome = await connection.codexHome();
    signal.throwIfAborted();
    await removeLegacySkills({ codexHome, skillsToRemove: runtimePaths.skillsToRemove });
    if (runtimePaths.bundledSkillPaths.length === 0) return;
    const destination = path.join(codexHome, "skills", runtime.yn);
    await fs.rm(destination, { force: true, recursive: true });
    await fs.mkdir(destination, { recursive: true });
    await Promise.all(runtimePaths.bundledSkillPaths.map((skillPath: string) =>
      fs.cp(
        path.dirname(skillPath),
        path.join(destination, path.basename(path.dirname(skillPath))),
        { recursive: true },
      )));
  }

  function getWindowsRelease() {
    return buildRuntime.in.isInternal(buildRuntime.in.resolve()) ? "latest-alpha" : "latest";
  }

  function requiresWindowsFramework(target = runtime.bn(), release = getWindowsRelease()) {
    return release === getWindowsRelease() &&
      buildRuntime.t() &&
      buildRuntime.i(buildRuntime.in.resolve(), target.platform);
  }

  function logRuntimeSelection(desiredBundleVersion?: string) {
    const frameworkEnabled = buildRuntime.t();
    const frameworkEligible = buildRuntime.i(buildRuntime.in.resolve());
    const { runtimeSource, runtimeRoot } = runtime.kn();
    let reason = "awaiting-framework";
    if (frameworkEnabled) {
      if (frameworkEligible) {
        if (runtimeSource === "framework") reason = "framework-active";
      } else reason = "host-ineligible";
    } else reason = "gate-disabled";
    installLogger().info("primary_runtime_selection", {
      safe: {
        frameworkEnabled,
        frameworkEligible,
        runtimeSource,
        desiredBundleVersion,
        reason,
        buildFlavor: buildRuntime.in.resolve(),
        architecture: dependencies.processRef.arch,
        osRelease: os.release(),
      },
      sensitive: { runtimeRoot },
    });
  }

  function startInstallOperation(options: any): ActiveInstall {
    const key = JSON.stringify({
      forceReinstall: options.forceReinstall,
      requireWindowsFramework: options.requireWindowsFramework,
      release: options.release,
      runtimeOptions: options.runtimeOptions,
      target: options.target,
    });
    const existing = activeInstalls.get(key);
    if (existing != null) {
      options.onBundleOperationId(existing.bundleOperationId);
      return existing;
    }
    const bundleOperationId = dependencies.randomUUID();
    options.onBundleOperationId(bundleOperationId);
    const controller = new AbortController();
    const promise = operationQueue.then(() => {
      controller.signal.throwIfAborted();
      return options.installRuntime(options.target, options.runtimeOptions, options.release, {
        ...(options.requireWindowsFramework ? { installFrameworkPackage: buildRuntime.r } : {}),
        bundleOperationId,
        requireWindowsFramework: options.requireWindowsFramework,
        fetchImpl: (input: any, init: any) =>
          dependencies.electron.net.fetch(input instanceof URL ? input.toString() : input, init),
        forceReinstall: options.forceReinstall,
        getInternalUpdateCdnRequestHeaders: options.getInternalUpdateCdnRequestHeaders,
        onProgress: (progress: any) => options.onProgress?.({
          ...progress,
          errorMessage: null,
          release: options.release,
        }),
        signal: controller.signal,
        trigger: options.trigger,
      });
    }).catch((error) => {
      options.onProgress?.({
        bundleVersion: null,
        downloadedBytes: null,
        errorMessage: error instanceof Error ? error.message : String(error),
        phase: "error",
        release: options.release,
        totalBytes: null,
      });
      throw error;
    });
    const operation = {
      bundleOperationId,
      controller,
      requireWindowsFramework: options.requireWindowsFramework,
      postInstallStage: "sync_plugins",
      promise,
    } as ActiveInstall;
    operation.postInstallPromise = promise.then(async (result: any) => {
      controller.signal.throwIfAborted();
      await syncPluginMarketplaces(
        options.connection,
        result.paths,
        options.requireWindowsFramework,
        controller.signal,
      );
      operation.postInstallStage = "sync_skills";
      await syncSkills(options.connection, result.paths, controller.signal);
      controller.signal.throwIfAborted();
      if (result.frameworkRoot != null) {
        operation.postInstallStage = "activate_runtime";
        buildRuntime.o(result.frameworkRoot);
        runtime.jn(result.frameworkRoot);
      }
      logRuntimeSelection(result.bundleVersion);
      if (result.status === "installed") {
        operation.postInstallStage = "validate_payload";
        const diagnosis = await runtime.wn({
          target: options.target,
          probeExecutables: true,
          runtimeRoot: result.frameworkRoot ?? path.dirname(path.dirname(result.paths.binPath)),
          signal: controller.signal,
        });
        controller.signal.throwIfAborted();
        if (!diagnosis.installed)
          installLogger().error("primary_runtime_post_install_validation_failed", {
            safe: {
              bundleOperationId,
              bundleVersion: result.bundleVersion,
              trigger: options.trigger,
              release: options.release,
              target: `${options.target.platform}-${options.target.arch}`,
            },
            sensitive: { problems: diagnosis.problems },
          });
      }
      reloadSkills({
        connection: options.connection,
        release: options.release,
        targetKey: `${options.target.platform}-${options.target.arch}`,
      });
    });
    activeInstalls.set(key, operation);
    operationQueue = operation.postInstallPromise.then(() => undefined, () => undefined);
    operation.postInstallPromise.finally(() => {
      operation.controller = null;
      activeInstalls.delete(key);
    }).catch(() => undefined);
    return operation;
  }

  async function installRuntime({
    connection,
    errorReporter,
    forceReinstall = false,
    getInternalUpdateCdnRequestHeaders,
    installRuntime: installRuntimeImplementation = runtime.An,
    onProgress,
    runtimeConfig,
    release,
    target = runtime.bn(),
    trigger = "manual_install",
  }: any) {
    const callId = dependencies.randomUUID();
    const startedAt = dependencies.now();
    const runtimeOptions = runtimeConfig?.runtimes[runtime.yn] ?? runtime.Ka;
    const targetKey = `${target.platform}-${target.arch}`;
    const hasConfiguredRuntime = runtimeConfig?.runtimes[runtime.yn] != null;
    let bundleOperationId: string | null = null;
    const operation = startInstallOperation({
      connection,
      requireWindowsFramework: requiresWindowsFramework(target, release),
      forceReinstall,
      getInternalUpdateCdnRequestHeaders,
      installRuntime: installRuntimeImplementation,
      onBundleOperationId: (value: string) => { bundleOperationId = value; },
      onProgress,
      release,
      runtimeOptions,
      target,
      trigger,
    });
    installLogger().info("primary_runtime_install_started", {
      safe: {
        bundleOperationId,
        callId,
        forceReinstall,
        hasConfiguredRuntime,
        release,
        target: targetKey,
        trigger,
      },
    });
    let result: any;
    try {
      result = await operation.promise;
    } catch (error) {
      const attribution = runtime.Dn(error, { bundleOperationId, failureStage: "unknown" });
      const common = {
        bundleOperationId,
        bundleVersion: attribution.bundleVersion,
        callId,
        durationMs: dependencies.now() - startedAt,
        error,
        errorCategory: attribution.errorCategory,
        errorCode: attribution.errorCode,
        failureDomain: "bundle",
        failureStage: attribution.failureStage,
        hasConfiguredRuntime,
        release,
        retryable: attribution.retryable,
        targetKey,
        trigger,
      };
      if (!isAbortError(error)) reportInstallFailure({ ...common, errorReporter });
      logCallOutcome({
        ...common,
        forceReinstall,
        outcome: isAbortError(error)
          ? "aborted"
          : attribution.errorCategory === "unsupported_host"
            ? "unsupported"
            : "failed",
      });
      throw error;
    }
    try {
      onProgress?.({
        bundleVersion: result.bundleVersion,
        downloadedBytes: null,
        errorMessage: null,
        phase: "configuring",
        release,
        totalBytes: null,
      });
      await operation.postInstallPromise;
    } catch (error) {
      const failureStage = operation.postInstallStage;
      const attribution = runtime.Dn(error, {
        bundleOperationId,
        bundleVersion: result.bundleVersion,
        failureStage,
      });
      const common = {
        bundleOperationId,
        bundleVersion: result.bundleVersion,
        callId,
        durationMs: dependencies.now() - startedAt,
        error,
        errorCategory: attribution.errorCategory,
        errorCode: attribution.errorCode,
        failureDomain: "post_install",
        failureStage,
        hasConfiguredRuntime,
        release,
        retryable: attribution.retryable,
        targetKey,
        trigger,
      };
      if (!isAbortError(error)) reportInstallFailure({ ...common, errorReporter });
      onProgress?.({
        bundleVersion: result.bundleVersion,
        downloadedBytes: null,
        errorMessage: error instanceof Error ? error.message : String(error),
        phase: "error",
        release,
        totalBytes: null,
      });
      logCallOutcome({ ...common, forceReinstall, outcome: isAbortError(error) ? "aborted" : "failed" });
      throw error;
    }
    installLogger().info("primary_runtime_install_finished", {
      safe: {
        bundleOperationId,
        bundleVersion: result.bundleVersion,
        callId,
        durationMs: dependencies.now() - startedAt,
        release,
        status: result.status,
        target: targetKey,
        trigger,
      },
    });
    logCallOutcome({
      bundleOperationId,
      bundleVersion: result.bundleVersion,
      callId,
      durationMs: dependencies.now() - startedAt,
      error: null,
      errorCategory: null,
      errorCode: null,
      failureDomain: null,
      failureStage: null,
      forceReinstall,
      hasConfiguredRuntime,
      outcome: result.status,
      release,
      retryable: false,
      targetKey,
      trigger,
    });
    onProgress?.({
      bundleVersion: result.bundleVersion,
      downloadedBytes: null,
      errorMessage: null,
      phase: "ready",
      release,
      totalBytes: null,
    });
    return { bundleVersion: result.bundleVersion, status: result.status };
  }

  function restoreRuntime(connection: any, signal: AbortSignal) {
    const restoration = operationQueue.then(async () => {
      signal.throwIfAborted();
      const target = runtime.bn();
      const requireFramework = requiresWindowsFramework(target);
      signal.throwIfAborted();
      if (requireFramework) {
        const buildFlavor = buildRuntime.in.resolve();
        const progress = { step: "configuration" };
        try {
          await buildRuntime.n({ buildFlavor, progress, signal });
        } catch (error) {
          if (!isAbortError(error))
            installLogger().warning("windows_primary_runtime_framework_activation_failed", {
              safe: {
                buildFlavor,
                failureStep: progress.step,
                architecture: dependencies.processRef.arch,
                ...buildRuntime.c(error),
              },
              sensitive: { error },
            });
          throw error;
        }
      } else runtime.jn(null);
      const runtimePaths = await runtime.Sn({ target });
      signal.throwIfAborted();
      if (runtimePaths == null) {
        logRuntimeSelection();
        return;
      }
      await syncPluginMarketplaces(connection, runtimePaths, requireFramework, signal);
      signal.throwIfAborted();
      await syncSkills(connection, runtimePaths, signal);
      logRuntimeSelection();
      signal.throwIfAborted();
      reloadSkills({
        connection,
        release: requireFramework ? getWindowsRelease() : "latest",
        targetKey: `${target.platform}-${target.arch}`,
      });
    });
    operationQueue = restoration.catch(() => undefined);
    return restoration;
  }

  async function diagnoseRuntime({ hostId, probeExecutables = false }: any) {
    installLogger().info("primary_runtime_dependencies_diagnose_started", {
      safe: { hostId },
      sensitive: {},
    });
    const resourcesPath = dependencies.resolveElectronResourcesPath({
      env: dependencies.processRef.env,
      resourcesPath: dependencies.processRef.resourcesPath,
    });
    const preferredGitPath = hostId === "local" &&
      buildRuntime.in.isInternal(buildRuntime.in.resolve()) &&
      dependencies.processRef.platform === "darwin" &&
      resourcesPath != null
      ? dependencies.processRef.env.CODEX_PREFERRED_GIT_EXECUTABLE?.trim() ||
        path.join(resourcesPath, "git", "bin", "git")
      : undefined;
    const diagnosis = await runtime.wn({ preferredGitPath, probeExecutables });
    installLogger().info("primary_runtime_dependencies_diagnose_finished", {
      safe: {
        bundleVersion: diagnosis.bundleVersion,
        installed: diagnosis.installed,
        problemCount: diagnosis.problems.length,
      },
      sensitive: {},
    });
    return diagnosis;
  }

  async function readDependencies({ hostId }: any) {
    const { runtimeSource } = runtime.kn();
    const diagnosis = await diagnoseRuntime({ hostId, probeExecutables: false });
    const active = [...activeInstalls.values()].find((operation) => operation.controller != null);
    let outcome = diagnosis.installed ? "available" : "unavailable";
    if (!diagnosis.installed && active != null) outcome = "installing";
    installLogger().info("primary_runtime_dependencies_loaded", {
      safe: {
        bundleVersion: diagnosis.bundleVersion,
        runtimeSource,
        outcome,
        bundleOperationId: active?.bundleOperationId ?? null,
      },
    });
    return {
      bundleVersion: diagnosis.bundleVersion,
      installed: diagnosis.installed,
      instructions: diagnosis.installed ? diagnosis.instructions : null,
    };
  }

  async function repairRuntime({
    connection,
    errorReporter,
    getInternalUpdateCdnRequestHeaders,
    installRuntime: installRuntimeImplementation = runtime.An,
    onProgress,
    release,
    runtimeConfig,
    target = runtime.bn(),
  }: any) {
    return installRuntime({
      connection,
      errorReporter,
      forceReinstall: true,
      getInternalUpdateCdnRequestHeaders,
      installRuntime: installRuntimeImplementation,
      onProgress,
      release,
      runtimeConfig,
      target,
      trigger: "repair",
    });
  }

  function assertLocalHost(hostId: string) {
    if (hostId !== "local")
      throw Error("Codex runtime installation only supports the local host.");
  }

  return {
    assertLocalHost,
    cancelInstalls,
    copySafePluginMarketplace,
    diagnoseRuntime,
    executeDependencyTool,
    getActiveInstallCount: () => activeInstalls.size,
    getWindowsRelease,
    installRuntime,
    isAbortError,
    isFeatureEnabled,
    logger: installLogger,
    logRuntimeSelection,
    pathIsWithin,
    readDependencies,
    readFeatureEnabled,
    removeLegacySkills,
    repairRuntime,
    requiresWindowsFramework,
    resolveRemovedSkillPath,
    restoreRuntime,
    retryIntervalMs,
    startInstallOperation,
    syncPluginMarketplaces,
    syncSkills,
    toolFailure,
    updateIntervalMs,
  };
}
