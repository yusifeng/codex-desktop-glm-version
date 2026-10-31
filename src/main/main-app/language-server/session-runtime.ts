type SessionRuntimeDependencies = {
  LanguageServerManager: any;
  RpcHandlerBase: new (...args: any[]) => any;
  createLogger(tag: string): () => any;
  filePathToUri(path: string, pathApi: any): string;
  messageTransport: any;
  normalizeHover(value: unknown, position: unknown): unknown;
  path: any;
  protocol: any;
  providerClasses: {
    JavaLanguageServerProvider: new (dataRoot: string) => any;
    KotlinLanguageServerProvider: new (dataRoot: string) => any;
    PyrightLanguageServerProvider: new () => any;
    RustAnalyzerProvider: new () => any;
    SourceKitLanguageServerProvider: new () => any;
    TypeScriptLanguageServerProvider: new () => any;
  };
  randomUUID(): string;
  resolveCapabilities(value: unknown): unknown;
  resolveLocations(value: unknown, pathApi: any): unknown[];
  stream: any;
};

const REQUEST_TIMEOUT_MS = 30_000;
const SESSION_IDLE_TIMEOUT_MS = 120_000;
const PROCESS_EXIT_GRACE_MS = 1_000;

export function createLanguageServerSessionRuntime(dependencies: SessionRuntimeDependencies) {
  const {
    LanguageServerManager,
    RpcHandlerBase,
    createLogger,
    filePathToUri,
    messageTransport,
    normalizeHover,
    path: pathModule,
    protocol,
    providerClasses,
    randomUUID,
    resolveCapabilities,
    resolveLocations,
    stream,
  } = dependencies;
  const path = pathModule.default ?? pathModule;
  const retryableMethods = [
    protocol.DefinitionRequest.method,
    protocol.HoverRequest.method,
    protocol.ImplementationRequest.method,
    protocol.ReferencesRequest.method,
    protocol.TypeDefinitionRequest.method,
  ];
  const locationMethods = {
    definition: protocol.DefinitionRequest.method,
    implementation: protocol.ImplementationRequest.method,
    references: protocol.ReferencesRequest.method,
    typeDefinition: protocol.TypeDefinitionRequest.method,
  };

  async function requestWithTimeout(
    connection: any,
    method: string,
    params: unknown,
    retryContentModified = true,
  ): Promise<unknown> {
    const cancellation = new protocol.CancellationTokenSource();
    const timeout = Promise.withResolvers<never>();
    const timer = setTimeout(() => {
      cancellation.cancel();
      timeout.reject(Error(`Language server request timed out: ${method}`));
    }, REQUEST_TIMEOUT_MS);
    timer.unref();
    try {
      return await Promise.race([
        connection.sendRequest(method, params, cancellation.token),
        timeout.promise,
      ]);
    } catch (error) {
      if (
        retryContentModified &&
        error instanceof protocol.ResponseError &&
        error.code === protocol.LSPErrorCodes.ContentModified &&
        retryableMethods.includes(method)
      ) {
        return requestWithTimeout(connection, method, params, false);
      }
      throw error;
    } finally {
      clearTimeout(timer);
      cancellation.dispose();
    }
  }

  class LanguageServerSession {
    disposed = false;
    idleTimeout: any = null;
    documentRequests = Promise.resolve();
    documents = new Map<string, { contents: string; version: number }>();

    constructor(
      readonly connection: any,
      readonly processHandle: any,
      readonly hostPath: any,
      readonly capabilities: any,
      readonly onDispose: (reason: Record<string, unknown>) => void,
    ) {
      processHandle.wait().then(
        ({ code, signal }: any) => this.stop({ code, reason: "process_exit", signal }, false),
        () => this.stop({ reason: "process_exit" }, false),
      );
      this.scheduleIdleShutdown();
    }

    fileUri(path: string) {
      return filePathToUri(path, this.hostPath);
    }

    getLocations(value: unknown) {
      return resolveLocations(value, this.hostPath);
    }

    async requestForDocument(document: any, method: string, params: unknown) {
      const request = this.documentRequests.then(async () => {
        await this.syncDocument(document);
        return this.request(method, params);
      });
      this.documentRequests = request.then(
        () => undefined,
        () => undefined,
      );
      return request;
    }

    async syncDocument({ contents, languageId, path }: any) {
      this.scheduleIdleShutdown();
      const uri = this.fileUri(path);
      await Promise.all(
        Array.from(this.documents.keys())
          .filter((openUri) => openUri !== uri)
          .map((openUri) => {
            this.documents.delete(openUri);
            return this.connection.sendNotification(
              protocol.DidCloseTextDocumentNotification.type,
              { textDocument: { uri: openUri } },
            );
          }),
      );
      const openDocument = this.documents.get(uri);
      if (openDocument == null) {
        this.documents.set(uri, { contents, version: 1 });
        await this.connection.sendNotification(protocol.DidOpenTextDocumentNotification.type, {
          textDocument: { languageId, text: contents, uri, version: 1 },
        });
        return;
      }
      if (openDocument.contents === contents) return;
      const version = openDocument.version + 1;
      this.documents.set(uri, { contents, version });
      await this.connection.sendNotification(protocol.DidChangeTextDocumentNotification.type, {
        contentChanges: [{ text: contents }],
        textDocument: { uri, version },
      });
    }

    async request(method: string, params: unknown) {
      this.scheduleIdleShutdown();
      return requestWithTimeout(this.connection, method, params);
    }

    dispose() {
      this.stop({ reason: "disposed" }, true);
    }

    stop(reason: Record<string, unknown>, kill: boolean) {
      if (this.disposed) return;
      this.disposed = true;
      if (this.idleTimeout != null) {
        clearTimeout(this.idleTimeout);
        this.idleTimeout = null;
      }
      this.connection.dispose();
      if (kill) this.processHandle.kill();
      this.onDispose(reason);
    }

    scheduleIdleShutdown() {
      if (this.idleTimeout != null) clearTimeout(this.idleTimeout);
      this.idleTimeout = setTimeout(
        () => this.stop({ reason: "idle_timeout" }, true),
        SESSION_IDLE_TIMEOUT_MS,
      );
      this.idleTimeout.unref();
    }
  }

  async function startLanguageServerSession(
    document: any,
    provider: any,
    workspaceRoot: string,
    pathApi: any,
    workspaceName: string,
    getLocalRuntimeRoot: unknown,
    onDispose: (reason: Record<string, unknown>) => void,
  ) {
    const context = {
      getLocalRuntimeRoot,
      host: document.host,
      sessionId: randomUUID(),
      workspaceRoot,
    };
    const command = await provider.findCommand(context);
    if (command == null) return { status: "unavailable" };

    const sessionOptions = provider.findSessionOptions == null
      ? undefined
      : await provider.findSessionOptions(context);
    if (provider.findSessionOptions != null && sessionOptions == null)
      return { status: "unavailable" };
    const initializationOptions = sessionOptions?.initializationOptions ??
      (provider.findInitializationOptions == null
        ? undefined
        : await provider.findInitializationOptions(context));
    if (provider.findInitializationOptions != null && initializationOptions == null)
      return { status: "unavailable" };

    const workspaceConfiguration = sessionOptions?.workspaceConfiguration ??
      provider.workspaceConfiguration;
    const mergedInitializationOptions = workspaceConfiguration == null
      ? initializationOptions
      : { ...initializationOptions, settings: workspaceConfiguration };
    const languageServerWorkspaceRoot = sessionOptions?.languageServerWorkspaceRoot ?? workspaceRoot;
    const workingDirectory = provider.findWorkingDirectory == null
      ? languageServerWorkspaceRoot
      : await provider.findWorkingDirectory(context);
    const processHandle = await document.host.spawn({
      args: command,
      cwd: workingDirectory,
      env: sessionOptions?.env,
      killProcessTree: true,
      outputBytesCap: null,
    });
    drainReadable(processHandle.stderr);
    const connection = protocol.createProtocolConnection(
      new messageTransport.StreamMessageReader(stream.Readable.from(processHandle.stdout)),
      new messageTransport.StreamMessageWriter(stream.Writable.fromWeb(processHandle.stdin)),
    );
    const rootUri = filePathToUri(languageServerWorkspaceRoot, pathApi);
    const workspaceFolder = { name: workspaceName, uri: rootUri };
    connection.onRequest(protocol.ConfigurationRequest.type, ({ items }: any) =>
      items.map(({ section }: any) => section == null
        ? null
        : (workspaceConfiguration?.[section] ?? null)),
    );
    connection.onRequest(protocol.WorkspaceFoldersRequest.type, () => [workspaceFolder]);
    connection.onRequest(protocol.RegistrationRequest.type, () => undefined);
    connection.onRequest(protocol.UnregistrationRequest.type, () => undefined);
    connection.onRequest(protocol.WorkDoneProgressCreateRequest.type, () => undefined);
    connection.onRequest(protocol.ApplyWorkspaceEditRequest.type, () => ({
      applied: false,
      failureReason: "The Codex file viewer is read-only",
    }));
    connection.listen();

    try {
      const initializeResult: any = await requestWithTimeout(
        connection,
        protocol.InitializeRequest.method,
        {
          capabilities: {
            textDocument: {
              definition: { linkSupport: true },
              hover: { contentFormat: ["markdown", "plaintext"] },
              implementation: { linkSupport: true },
              references: {},
              typeDefinition: { linkSupport: true },
            },
            general: {
              positionEncodings: ["utf-16"],
              staleRequestSupport: { cancel: true, retryOnContentModified: retryableMethods },
            },
            workspace: { configuration: true, workspaceFolders: true },
          },
          clientInfo: { name: "Codex" },
          initializationOptions: mergedInitializationOptions,
          processId: null,
          rootUri,
          workspaceFolders: [workspaceFolder],
        },
      );
      await connection.sendNotification(protocol.InitializedNotification.type, {});
      if (workspaceConfiguration != null) {
        await connection.sendNotification(protocol.DidChangeConfigurationNotification.type, {
          settings: workspaceConfiguration,
        });
      }
      return {
        session: new LanguageServerSession(
          connection,
          processHandle,
          pathApi,
          resolveCapabilities(initializeResult.capabilities),
          onDispose,
        ),
        status: "started",
      };
    } catch (error) {
      connection.dispose();
      const exit = await waitForProcessExit(processHandle);
      if (exit == null) processHandle.kill();
      else if (provider.classifyProcessExit != null) {
        const classification = await provider.classifyProcessExit(context, command, exit);
        if (classification != null) return classification;
      }
      throw error;
    }
  }

  async function waitForProcessExit(processHandle: any) {
    const timeout = Promise.withResolvers<null>();
    const timer = setTimeout(() => timeout.resolve(null), PROCESS_EXIT_GRACE_MS);
    timer.unref();
    try {
      return await Promise.race([
        processHandle.wait().then(
          ({ code, signal }: any) => ({ code, signal }),
          () => null,
        ),
        timeout.promise,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async function drainReadable(readable: ReadableStream<Uint8Array>) {
    const reader = readable.getReader();
    try {
      while (!(await reader.read()).done) {}
    } catch {
      // Language-server stderr is intentionally discarded.
    } finally {
      reader.releaseLock();
    }
  }

  class LanguageServerRpcHandler extends RpcHandlerBase {
    readonly languageServers: any;

    constructor(
      readonly getExecutionHost: (hostId: string) => any,
      dataRoot: string,
      localRuntimeManager: { getRoot: unknown; markExpired(id: string): void },
      onLocalRuntimeExpired: (id: string) => void,
    ) {
      super();
      const {
        JavaLanguageServerProvider,
        KotlinLanguageServerProvider,
        PyrightLanguageServerProvider,
        RustAnalyzerProvider,
        SourceKitLanguageServerProvider,
        TypeScriptLanguageServerProvider,
      } = providerClasses;
      this.languageServers = new LanguageServerManager(
        [
          new TypeScriptLanguageServerProvider(),
          new PyrightLanguageServerProvider(),
          new JavaLanguageServerProvider(path.join(dataRoot, "java")),
          new KotlinLanguageServerProvider(path.join(dataRoot, "kotlin")),
          new RustAnalyzerProvider(),
          new SourceKitLanguageServerProvider(),
        ],
        {
          createLogger: createLogger("language-server-manager"),
          createSession: ({
            document,
            provider,
            workspaceRoot,
            pathApi,
            workspaceName,
            getLocalRuntimeRoot,
            onDispose,
          }: any) => startLanguageServerSession(
            document,
            provider,
            workspaceRoot,
            pathApi,
            workspaceName,
            getLocalRuntimeRoot,
            onDispose,
          ),
          getLocalRuntimeRoot: localRuntimeManager.getRoot,
          getLocationMethod: (kind: keyof typeof locationMethods) => locationMethods[kind],
          hoverMethod: protocol.HoverRequest.method,
          markLocalRuntimeExpired: (id: string) => localRuntimeManager.markExpired(id),
          normalizeHover,
          onLocalRuntimeExpired,
        },
      );
    }

    async capabilities({ hostId, ...request }: any) {
      const host = this.findExecutionHost(hostId);
      return host == null ? null : this.languageServers.capabilities({ ...request, host });
    }

    async locations({ hostId, ...request }: any) {
      const host = this.findExecutionHost(hostId);
      return host == null ? [] : this.languageServers.locations({ ...request, host });
    }

    async hover({ hostId, ...request }: any) {
      const host = this.findExecutionHost(hostId);
      return host == null ? null : this.languageServers.hover({ ...request, host });
    }

    dispose() {
      this.languageServers.dispose();
    }

    findExecutionHost(hostId: string) {
      try {
        return this.getExecutionHost(hostId);
      } catch {
        return null;
      }
    }
  }

  return {
    LanguageServerRpcHandler,
    LanguageServerSession,
    drainReadable,
    requestWithTimeout,
    startLanguageServerSession,
    waitForProcessExit,
  };
}
