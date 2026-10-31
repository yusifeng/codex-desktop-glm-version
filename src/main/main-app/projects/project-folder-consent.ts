// @ts-nocheck

/** Creates the project-folder trust confirmation manager and its per-window RPC service. */
export function createProjectFolderConsentRuntime(
  dependencies: Record<string, any>,
) {
  const {
    runtime: n,
    BrowserWindow,
    normalizeProjectRoot,
    configSchema = n.wf({
      projects: n.Ef(
        n.Of(),
        n.wf({ trust_level: n.Of().optional() }),
      ).optional(),
    }),
  } = dependencies;

  class ProjectFolderConsentSubscription extends n.Uf {
    cleanup;
    #unsubscribed = false;

    constructor(cleanup: () => void) {
      super();
      this.cleanup = cleanup;
    }

    unsubscribe() {
      if (this.#unsubscribed) return;
      this.#unsubscribed = true;
      this.cleanup();
    }

    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  class ProjectFolderConsentService extends n.Uf {
    register;

    constructor(register: (callback: any) => any) {
      super();
      this.register = register;
    }

    subscribe(callback: any) {
      return this.register(callback);
    }
  }

  class ProjectFolderConsentManager {
    connectionForHost;
    hostConfig;
    ensureWindow;
    #callbacks = new Map();
    #windowWaiters = new Map();
    #confirmationQueue = Promise.resolve();

    constructor(connectionForHost: any, hostConfig: any, ensureWindow: any) {
      this.connectionForHost = connectionForHost;
      this.hostConfig = hostConfig;
      this.ensureWindow = ensureWindow;
    }

    async confirm(hostId: string, folders: string[]) {
      if (folders.length === 0) return true;
      const confirmation = this.#confirmationQueue.then(async () => {
        const { config } = await this.connectionForHost(
          hostId,
        ).sendAppServerRequest("config/read", { includeLayers: false });
        const parsed = configSchema.safeParse(config);
        const host = this.hostConfig(hostId);
        const useWslPaths = n.zi(host);
        const pendingFolders = [...new Set(folders)].filter(
          (folder) =>
            !parsed.success ||
            parsed.data.projects?.[
              normalizeProjectRoot(folder, useWslPaths)
            ]?.trust_level !== "trusted",
        );
        if (pendingFolders.length === 0) return true;

        const focusedWindow = BrowserWindow.getFocusedWindow();
        const window =
          focusedWindow != null &&
          this.#callbacks.has(focusedWindow.webContents.id)
            ? focusedWindow
            : await this.ensureWindow();
        if (window == null || window.isDestroyed()) return false;

        const webContents = window.webContents;
        if (!this.#callbacks.has(webContents.id))
          await new Promise<void>((resolve) => {
            const stopWaiting = () => {
              webContents.removeListener("destroyed", stopWaiting);
              webContents.removeListener("render-process-gone", stopWaiting);
              this.#windowWaiters.delete(webContents.id);
              resolve();
            };
            this.#windowWaiters.set(webContents.id, stopWaiting);
            webContents.once("destroyed", stopWaiting);
            webContents.once("render-process-gone", stopWaiting);
          });

        const registration = this.#callbacks.get(webContents.id);
        if (registration == null || window.isDestroyed()) return false;
        window.show();

        const unknown = [];
        const explicitlyUntrusted = [];
        for (const folder of pendingFolders)
          (parsed.success &&
          parsed.data.projects?.[
            normalizeProjectRoot(folder, useWslPaths)
          ]?.trust_level === "untrusted"
            ? explicitlyUntrusted
            : unknown
          ).push(folder);

        for (const [isExplicitlyUntrusted, group] of [
          [false, unknown],
          [true, explicitlyUntrusted],
        ]) {
          if (group.length === 0) continue;
          if (registration.signal.aborted) return false;
          let onAbort;
          try {
            const accepted = await Promise.race([
              registration.callback({
                hostName: hostId === "local" ? null : host.display_name,
                folders: group,
                explicitlyUntrusted: isExplicitlyUntrusted,
              }),
              new Promise((resolve) => {
                onAbort = () => resolve(false);
                registration.signal.addEventListener("abort", onAbort, {
                  once: true,
                });
              }),
            ]);
            if (!accepted) return false;
          } catch {
            return false;
          } finally {
            if (onAbort != null)
              registration.signal.removeEventListener("abort", onAbort);
          }
        }
        return true;
      });
      this.#confirmationQueue = confirmation.then(
        () => undefined,
        () => undefined,
      );
      return confirmation;
    }

    serviceForWindow(webContents: any) {
      return new ProjectFolderConsentService((callback: any) => {
        const duplicate = callback.dup();
        const controller = new AbortController();
        this.#callbacks.set(webContents.id, {
          callback: duplicate,
          signal: controller.signal,
        });
        this.#windowWaiters.get(webContents.id)?.();

        const subscription = new ProjectFolderConsentSubscription(() => {
          webContents.removeListener("destroyed", unsubscribe);
          webContents.removeListener("render-process-gone", unsubscribe);
          if (this.#callbacks.get(webContents.id)?.callback === duplicate)
            this.#callbacks.delete(webContents.id);
          controller.abort();
          duplicate[Symbol.dispose]();
        });
        const unsubscribe = () => subscription.unsubscribe();
        webContents.once("destroyed", unsubscribe);
        webContents.once("render-process-gone", unsubscribe);
        duplicate.onRpcBroken(unsubscribe);
        return subscription;
      });
    }
  }

  return {
    ProjectFolderConsentManager,
    ProjectFolderConsentService,
    ProjectFolderConsentSubscription,
  };
}

if (typeof module !== "undefined")
  module.exports = { createProjectFolderConsentRuntime };
