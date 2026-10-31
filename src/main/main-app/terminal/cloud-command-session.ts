export type CloudCommandSessionRuntimeDependencies = {
  schema: any;
  posixPath: any;
  fileUrlToPath(value: string, options: { windows: false }): string;
  randomUUID(): string;
  raceWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T>;
  getShellCommand(): string[];
  CommandSessionBackend: new (
    session: Promise<any>,
    callbacks: Record<string, any>,
    options: Record<string, any>,
  ) => any;
};

type CloudConnection = {
  sendAppServerExtensionRequest(
    method: string,
    params: Record<string, any>,
    extra?: unknown,
    options?: Record<string, any>,
  ): Promise<any>;
  registerInternalNotificationHandler(handler: (notification: any) => void): () => void;
};

/** Owns cloud-terminal cwd validation, command streaming, cap handling, and termination races. */
export function createCloudCommandSessionRuntime(
  dependencies: CloudCommandSessionRuntimeDependencies,
) {
  const outputDeltaSchema = dependencies.schema.wf({
    deltaBase64: dependencies.schema.Of(),
    capReached: dependencies.schema.gf(),
  });

  const resolveCloudEnvironmentCwd = async (
    connection: CloudConnection,
    {
      environmentId,
      cwd,
      signal,
    }: { environmentId: string; cwd?: string | null; signal?: AbortSignal },
  ) => {
    const request = (method: string, params: Record<string, any>) => {
      signal?.throwIfAborted();
      const result = connection.sendAppServerExtensionRequest(method, params);
      return signal == null ? result : dependencies.raceWithAbort(result, signal);
    };
    const isDirectory = async (path: string) => {
      try {
        return dependencies.schema
          .wf({ isDirectory: dependencies.schema.gf() })
          .parse(await request(`fs/getMetadata`, { environmentId, path })).isDirectory;
      } catch (error) {
        if (
          error instanceof Error &&
          [
            `No such file or directory (os error 2)`,
            `Not a directory (os error 20)`,
          ].includes(error.message)
        ) {
          return false;
        }
        throw error;
      }
    };

    if (cwd != null && dependencies.posixPath.isAbsolute(cwd) && (await isDirectory(cwd)))
      return cwd;
    const environment = dependencies.schema
      .wf({ cwd: dependencies.schema.Of().nullish() })
      .parse(await request(`environment/info`, { environmentId }));
    if (environment.cwd == null) return null;
    const reportedCwd = environment.cwd.startsWith(`file:`)
      ? dependencies.fileUrlToPath(environment.cwd, { windows: false })
      : environment.cwd;
    return dependencies.posixPath.isAbsolute(reportedCwd) && (await isDirectory(reportedCwd))
      ? reportedCwd
      : null;
  };

  const createCloudCommandSession = async (
    connection: CloudConnection,
    {
      environmentId,
      cwd,
      cols,
      rows,
      callbacks,
      signal,
    }: {
      environmentId: string;
      cwd?: string | null;
      cols: number;
      rows: number;
      callbacks: { onData(data: string): void; onExit(exit: Record<string, any>): void };
      signal?: AbortSignal;
    },
  ) => {
    const resolvedCwd = await resolveCloudEnvironmentCwd(connection, {
      environmentId,
      cwd,
      signal,
    });
    if (resolvedCwd == null)
      throw Error(`The terminal environment did not report a valid working directory`);
    signal?.throwIfAborted();

    const processId = dependencies.randomUUID();
    const outputStarted = Promise.withResolvers<void>();
    let commandFinished = false;
    let receivedOutput = false;
    let terminating = false;
    let terminalError: string | undefined;
    let backend: any;
    let terminationRequest: Promise<any> | undefined;

    const terminate = async () => {
      terminating = true;
      outputStarted.resolve();
      if (receivedOutput && !commandFinished) {
        terminationRequest ??= connection.sendAppServerExtensionRequest(`command/exec/terminate`, {
          processId,
        });
        await terminationRequest;
      }
      return {};
    };

    const unregisterNotification = connection.registerInternalNotificationHandler(
      (notification) => {
        if (
          notification.method !== `command/exec/outputDelta` ||
          notification.params?.processId !== processId
        ) {
          return;
        }
        receivedOutput = true;
        outputStarted.resolve();
        if (terminating) {
          terminate().catch(() => undefined);
          return;
        }
        const parsed = outputDeltaSchema.safeParse(notification.params);
        if (!parsed.success) {
          terminalError = `Cloud terminal received invalid output`;
          callbacks.onData(
            `\r\n[Cloud terminal received invalid output; closing this shell.]\r\n`,
          );
          terminate().catch(() => undefined);
          return;
        }
        backend.handleOutputDelta({
          chunk: Buffer.from(parsed.data.deltaBase64, `base64`),
          capReached: parsed.data.capReached,
        });
        if (parsed.data.capReached) {
          terminalError = `Cloud terminal reached the server's 1 MiB output limit`;
          callbacks.onData(
            `\r\n[Cloud terminal reached the server's 1 MiB output limit; closing this shell. Open a new terminal tab to continue.]\r\n`,
          );
          terminate().catch(() => undefined);
        }
      },
    );

    const session = {
      processHandle: processId,
      response: connection
        .sendAppServerExtensionRequest(
          `command/exec`,
          {
            environmentId,
            processId,
            command: [
              `sh`,
              `-c`,
              `stty cols "$1" rows "$2"; printf "\\033[0m"; shift 2; exec "$@"`,
              `sh`,
              String(cols),
              String(rows),
              ...dependencies.getShellCommand(),
            ],
            cwd: resolvedCwd,
            env: { TERM: `xterm-256color`, TERMINFO: null, TERMINFO_DIRS: null },
            tty: true,
            streamStdin: true,
            streamStdoutStderr: true,
            disableTimeout: true,
            outputBytesCap: 1_048_576,
          },
          undefined,
          { timeoutMs: null },
        )
        .then((result) =>
          dependencies.schema
            .wf({
              exitCode: dependencies.schema.Cf(),
              stdout: dependencies.schema.Of(),
              stderr: dependencies.schema.Of(),
            })
            .parse(result),
        )
        .finally(() => {
          commandFinished = true;
          outputStarted.resolve();
          unregisterNotification();
        }),
      write: async (data: string | Uint8Array) => {
        await outputStarted.promise;
        if (!commandFinished && !terminating)
          await connection.sendAppServerExtensionRequest(`command/exec/write`, {
            processId,
            deltaBase64: Buffer.from(data).toString(`base64`),
          });
        return {};
      },
      resize: async () => ({}),
      terminate,
    };

    backend = new dependencies.CommandSessionBackend(
      Promise.resolve(session),
      {
        onData: callbacks.onData,
        onExit: (exit: Record<string, any>) =>
          callbacks.onExit({ ...exit, error: terminalError ?? exit.error }),
      },
      { serializeWrites: true },
    );
    callbacks.onData(
      `[Temporary Cloud terminal: fixed ${cols}x${rows} PTY; closes at 1 MiB of output.]\r\n`,
    );
    return { backend, cwd: resolvedCwd, shell: `sh` };
  };

  return { createCloudCommandSession, resolveCloudEnvironmentCwd };
}

if (typeof module !== `undefined`) {
  module.exports = { createCloudCommandSessionRuntime };
}
