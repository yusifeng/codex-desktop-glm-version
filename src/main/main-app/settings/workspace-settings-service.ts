// @ts-nocheck

export function createWorkspaceSettingsServiceClass({
  DisposableBase,
  agentReadableSettings,
  conversationDetailModeKey,
  createUsingScope,
  getDefaultLinkTarget,
  normalizeSettingValue,
  openLinkTargetPreferenceKey,
  parseWorkModeAccess,
  settingDefinitionFor,
  settingKeys,
}) {
  class UnsubscribeHandle extends DisposableBase {
    constructor(cleanup) {
      super();
      this.cleanup = cleanup;
    }
    unsubscribe() {
      const cleanup = this.cleanup;
      this.cleanup = null;
      cleanup?.();
    }
    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  class SettingsServiceBase extends DisposableBase {
    async readAll() {
      const entries = await Promise.all(this.keys().map(async (key) => [key, await this.read(key)]));
      const values = {};
      const configuredValues = {};
      for (const [key, result] of entries) {
        Object.assign(values, { [key]: result.effective });
        Object.assign(configuredValues, { [key]: result.configured });
      }
      return { values, configuredValues };
    }

    async readForAgent(identity) {
      const keys = new Set(this.keys());
      const definitions = agentReadableSettings.filter(({ key }) => keys.has(key));
      const entries = await Promise.all(
        definitions.map(async ({ key }) => [key, await this.read(key, identity)]),
      );
      return {
        filePath: this.settingsFilePath(),
        settings: Object.fromEntries(
          entries.flatMap(([key, result]) => result.configured === undefined ? [] : [[key, result.configured]]),
        ),
        effectiveSettings: Object.fromEntries(
          entries.flatMap(([key, result]) => result.effective === undefined ? [] : [[key, result.effective]]),
        ),
        definitions,
      };
    }

    async subscribe(key, stream) {
      const duplicated = stream.dup();
      let generation = 0;
      let active = true;
      const push = async () => {
        const current = ++generation;
        const result = await this.read(key);
        if (active && current === generation) {
          const scope = createUsingScope();
          try {
            scope.u(duplicated(result));
          } catch (error) {
            scope.e = error;
          } finally {
            scope.d();
          }
        }
      };
      const unsubscribeFromStore = this.onDidChange(key, () => {
        push().catch(() => handle.unsubscribe());
      });
      const handle = new UnsubscribeHandle(() => {
        active = false;
        unsubscribeFromStore();
        duplicated[Symbol.dispose]();
      });
      duplicated.onRpcBroken(() => handle.unsubscribe());
      try {
        await push();
        return handle;
      } catch (error) {
        handle.unsubscribe();
        throw error;
      }
    }
  }

  const pendingKey = ({ hostId, threadId }) => JSON.stringify([hostId, threadId]);

  class AgentWriteConfirmationBroker extends DisposableBase {
    pending = new Map();
    listeners = new Map();
    subscriptions = new Set();
    disposed = false;

    request = (request, signal) => {
      signal.throwIfAborted();
      if (this.disposed) throw new Error("Settings service unavailable.");
      const key = pendingKey(request.key);
      if (this.pending.has(key)) return Promise.resolve(false);
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          signal.removeEventListener("abort", onAbort);
          this.pending.delete(key);
          this.notify(key);
        };
        const onAbort = () => {
          cleanup();
          reject(signal.reason instanceof Error
            ? signal.reason
            : new Error(signal.aborted ? "The operation was aborted" : "Settings service unavailable."));
        };
        this.pending.set(key, {
          request,
          settle: (value) => { cleanup(); resolve(value); },
          cancel: onAbort,
        });
        signal.addEventListener("abort", onAbort, { once: true });
        this.notify(key);
      });
    };

    async subscribe(request, stream) {
      if (this.disposed) throw new Error("Settings service unavailable.");
      const key = pendingKey(request);
      const duplicated = stream.dup();
      const notify = () => {
        const scope = createUsingScope();
        try {
          scope.u(duplicated(this.pending.get(key)?.request ?? null)).catch(() => handle.unsubscribe());
        } catch (error) {
          scope.e = error;
        } finally {
          scope.d();
        }
      };
      const listeners = this.listeners.get(key) ?? new Set();
      listeners.add(notify);
      this.listeners.set(key, listeners);
      const handle = new UnsubscribeHandle(() => {
        listeners.delete(notify);
        if (listeners.size === 0) this.listeners.delete(key);
        duplicated[Symbol.dispose]();
        this.subscriptions.delete(handle);
      });
      this.subscriptions.add(handle);
      duplicated.onRpcBroken(() => handle.unsubscribe());
      notify();
      return handle;
    }

    async answer(request, approved) {
      const pending = this.pending.get(pendingKey(request));
      if (
        pending == null ||
        pending.request.key.turnId !== request.turnId ||
        pending.request.key.callId !== request.callId
      ) return false;
      pending.settle(approved);
      return true;
    }

    dispose = () => {
      this.disposed = true;
      for (const pending of this.pending.values()) pending.cancel();
      for (const subscription of this.subscriptions) subscription.unsubscribe();
    };

    notify(key) {
      this.listeners.get(key)?.forEach((listener) => listener());
    }
  }

  function accountMatches(left, right) {
    return left.accountId == null
      ? right.accountId == null &&
          left.authMethod === right.authMethod &&
          (left.authMethod != null || (left.stableId != null && left.stableId === right.stableId))
      : left.accountId === right.accountId && left.userId === right.userId;
  }

  return class WorkspaceSettingsService extends SettingsServiceBase {
    configWriteConfirmations = new AgentWriteConfirmationBroker();
    desktopFeatureAvailabilityListeners = new Set();
    workModeAccessListeners = new Set();
    workModeAccessByAccount = [];

    constructor(store, afterWrite, statsig) {
      super();
      this.store = store;
      this.afterWrite = afterWrite;
      this.statsig = statsig;
    }
    settingsFilePath() { return this.store.getStateFilePath(); }
    keys() { return settingKeys.map(({ key }) => key); }
    async read(key, identity) {
      return { configured: this.store.get(key), effective: await this.getEffective(key, identity) };
    }
    async getEffective(key, identity) {
      if (key === conversationDetailModeKey) {
        const assignments = await this.statsig?.readExecutionAssignments();
        const access = assignments == null
          ? undefined
          : this.workModeAccessByAccount.find((entry) => accountMatches(assignments.identity, entry));
        if (assignments == null || access == null || (identity != null && !accountMatches(assignments.identity, identity))) {
          return undefined;
        }
        return access.policy === "preference"
          ? this.store.getEffective(key)
          : normalizeSettingValue(key, access.policy === "everyday" ? "STEPS_PROSE" : "STEPS_COMMANDS");
      }
      return key === openLinkTargetPreferenceKey
        ? normalizeSettingValue(key, getDefaultLinkTarget(this.store))
        : this.store.getEffective(key);
    }
    async write(key, value) {
      this.store.set(key, value);
      this.afterWrite(key, this.store.get(key));
    }
    async writeForAgent(values, identity) {
      const entries = Object.entries(values).map(([name, value]) => {
        const definition = settingDefinitionFor(name);
        if (definition == null) throw new Error(`Unknown setting: ${name}`);
        if (definition.agentAccess !== "read-write") {
          throw new Error(`Setting cannot be written by Codex: ${name}`);
        }
        return { key: definition.key, value: normalizeSettingValue(definition.key, value) };
      });
      await Promise.all(entries.map(({ key, value }) => this.write(key, value)));
      await this.store.flush();
      const { settings, effectiveSettings } = await this.readForAgent(identity);
      return { settings, effectiveSettings };
    }
    async publish(value) {
      const access = parseWorkModeAccess(value);
      this.workModeAccessByAccount = [
        ...this.workModeAccessByAccount.filter((entry) => !accountMatches(entry, access)),
        access,
      ];
      this.workModeAccessListeners.forEach((listener) => listener());
    }
    onDidChange(key, listener) {
      const unsubscribe = this.store.onDidChange(key, listener);
      if (key === openLinkTargetPreferenceKey) this.desktopFeatureAvailabilityListeners.add(listener);
      if (key === conversationDetailModeKey) this.workModeAccessListeners.add(listener);
      const unsubscribeStatsig = key === conversationDetailModeKey
        ? this.statsig?.onDidChange(listener)
        : undefined;
      return () => {
        unsubscribe();
        this.desktopFeatureAvailabilityListeners.delete(listener);
        this.workModeAccessListeners.delete(listener);
        unsubscribeStatsig?.();
      };
    }
    notifyDesktopFeatureAvailabilityChanged() {
      this.desktopFeatureAvailabilityListeners.forEach((listener) => listener());
    }
    dispose() {
      this.configWriteConfirmations.dispose();
      this.workModeAccessByAccount = [];
      this.desktopFeatureAvailabilityListeners.clear();
      this.workModeAccessListeners.clear();
    }
  };
}

export function createThirdPartyNoticesReader({
  cwd,
  dirname,
  execFile,
  existsSync,
  join,
  mkdir,
  nodeEnv,
  readFile,
  resolveNodeExecutable,
  resourcesPath,
  sanitizeEnvironment,
}) {
  const filename = "THIRD_PARTY_NOTICES.txt";
  const candidates = () => {
    const root = cwd();
    return [
      ...(resourcesPath ? [join(resourcesPath, filename)] : []),
      join(root, "assets", filename),
      join(root, "electron", "assets", filename),
    ];
  };
  const findWorkspaceRoot = () => {
    let directory = cwd();
    for (;;) {
      if (existsSync(join(directory, "pnpm-workspace.yaml"))) return directory;
      const parent = dirname(directory);
      if (parent === directory) return null;
      directory = parent;
    }
  };
  const regenerate = async () => {
    const root = findWorkspaceRoot();
    if (root == null) return;
    const output = join(root, "electron", "assets", filename);
    await mkdir(dirname(output), { recursive: true });
    await execFile(
      resolveNodeExecutable(root) ?? "node",
      ["./scripts/generate-third-party-notices.mjs", "--output-file", output],
      { cwd: root, env: sanitizeEnvironment(process.env), timeout: 120_000 },
    );
  };
  return async function readThirdPartyNotices() {
    for (const candidate of candidates()) if (existsSync(candidate)) return readFile(candidate, "utf8");
    if (nodeEnv !== "production") {
      try { await regenerate(); } catch { return null; }
      for (const candidate of candidates()) if (existsSync(candidate)) return readFile(candidate, "utf8");
    }
    return null;
  };
}

export function resolveSystemBackdropSupport({ platform, gpuFeatureStatus, isSupported }) {
  return platform === "win32" && gpuFeatureStatus().gpu_compositing !== "enabled"
    ? false
    : isSupported();
}

if (typeof module !== "undefined") {
  module.exports = {
    createThirdPartyNoticesReader,
    createWorkspaceSettingsServiceClass,
    resolveSystemBackdropSupport,
  };
}
