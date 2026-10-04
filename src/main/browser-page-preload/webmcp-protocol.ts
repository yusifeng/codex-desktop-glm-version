export {};
const { createWebMcpDescriptorSerializer } = require(`./webmcp-descriptor`);

/**
 * The WebMCP page bridge used by the browser-page preload.
 *
 * This module intentionally receives the bundled Zod factories and the
 * in-file WebMCP registry. The preload is a transform-only chunk, so moving
 * this protocol boundary must not introduce a second schema/runtime copy.
 */
type WebMcpProtocolDependencies = {
  electron: {
    ipcRenderer: {
      sendSync(channel: string): any;
      send(channel: string, payload?: any): void;
    };
    contextBridge: {
      internalContextBridge?: {
        overrideGlobalPropertyFromIsolatedWorld?: (path: string[], getter: () => unknown) => void;
      };
      exposeInMainWorld(name: string, value: unknown): void;
      executeInMainWorld(options: { args: string[]; func: (name: string) => void }): Promise<unknown>;
    };
  };
  createRegistry(options: { onToolsChanged(): void }): {
    codexGetTools(): Promise<unknown[]>;
    registerTool(name: string, options: any): Promise<unknown>;
  };
  zod: {
    object(shape: Record<string, unknown>): any;
    string(): any;
    boolean(): any;
    unknown(): any;
  };
  pageEventChannel: string;
  policyChannel: string;
  webmcpChangedEvent: { type: string; version: number };
  modelContextProperty: string;
};

function installWebMcpProtocol(deps: WebMcpProtocolDependencies): void {
  const { electron, createRegistry, zod } = deps;
  const annotationsSchema = zod.object({
    readOnlyHint: zod.boolean().optional(),
    untrustedContentHint: zod.boolean().optional(),
    consequentialHint: zod.boolean().optional(),
  });
  const descriptorSchema = zod.object({
    name: zod.string(),
    registration_id: zod.string(),
    title: zod.string().optional(),
    description: zod.string().optional(),
    input_schema: zod.unknown(),
    annotations: annotationsSchema.optional(),
    origin: zod.string().optional(),
    pageUrl: zod.string().optional(),
  });
  const descriptorForPageSchema = descriptorSchema
    .omit({ registration_id: true, input_schema: true })
    .extend({ inputSchema: descriptorSchema.shape.input_schema, name: descriptorSchema.shape.name.min(1) })
    .array();
  const changedEvent = deps.webmcpChangedEvent;

  function initialize(): void {
    if (
      globalThis.isSecureContext !== true ||
      !electron.ipcRenderer.sendSync(deps.policyChannel).enabled
    ) {
      return;
    }

    let pendingRefresh: ReturnType<typeof setTimeout> | undefined;
    let refreshPromise: Promise<unknown> | undefined;
    let refresh: () => void = () => undefined;
    const registry = createRegistry({
      onToolsChanged(): void {
        electron.ipcRenderer.send(deps.pageEventChannel, changedEvent);
        refresh();
      },
    });
    refresh = (): void => {
      if (refreshPromise != null) return;
      refreshPromise = new Promise<void>((resolve) => {
        pendingRefresh = setTimeout(resolve, 0);
      })
        .then(() => registry.codexGetTools())
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "SecurityError") return [];
          throw error;
        })
        .then((tools: unknown[]) => {
          const policy = electron.ipcRenderer.sendSync(deps.policyChannel);
          electron.ipcRenderer.send(deps.pageEventChannel, {
            ...changedEvent,
            payload: {
              tools: policy.enabled
                ? createWebMcpDescriptorSerializer({ descriptorForPageSchema, ...policy.limits }).collectDescriptors(tools)
                : [],
            },
          });
        })
        .finally(() => {
          pendingRefresh = undefined;
          refreshPromise = undefined;
        });
    };
    const onNavigation = (event: { from: { url: string } }): void => {
      if (event.from.url !== window.location.href) refresh();
    };

    window.addEventListener("pageshow", refresh);
    window.navigation.addEventListener("currententrychange", onNavigation);
    window.addEventListener("pagehide", (event) => {
      if (event.persisted) return;
      clearTimeout(pendingRefresh);
      pendingRefresh = undefined;
      window.removeEventListener("pageshow", refresh);
      window.navigation.removeEventListener("currententrychange", onNavigation);
    });

    const internalBridge = electron.contextBridge.internalContextBridge;
    if (internalBridge?.overrideGlobalPropertyFromIsolatedWorld == null) {
      electron.contextBridge.exposeInMainWorld(deps.modelContextProperty, registry);
      electron.contextBridge.executeInMainWorld({
        args: [deps.modelContextProperty],
        func: (propertyName: string): void => {
          const current = (window as any)[propertyName];
          const modelContext = Object.freeze({
            ...current,
            async registerTool(name: string, options: any): Promise<unknown> {
              const signal = options?.signal;
              const registration = current.registerTool(
                name,
                signal == null
                  ? options
                  : {
                      ...options,
                      signal: Object.assign({}, signal, {
                        aborted: signal.aborted,
                        reason: signal.reason,
                        addEventListener: (...args: any[]) => {
                          signal.addEventListener(...args);
                          if (signal.aborted) throw signal.reason;
                        },
                      }),
                    },
              );
              if (signal == null) return registration;
              return new Promise((resolve, reject) => {
                const onAbort = (): void => reject(signal.reason);
                signal.addEventListener("abort", onAbort, { once: true });
                registration.finally(() => signal.removeEventListener("abort", onAbort)).then(resolve, reject);
              });
            },
          });
          Object.defineProperty(document, "modelContext", {
            configurable: false,
            enumerable: false,
            value: modelContext,
            writable: false,
          });
        },
      });
    } else {
      internalBridge.overrideGlobalPropertyFromIsolatedWorld(
        ["document", "modelContext"],
        () => registry,
      );
    }
    electron.ipcRenderer.send(deps.pageEventChannel, changedEvent);
  }

  initialize();
}

declare const module: { exports: unknown };
module.exports = { installWebMcpProtocol };
