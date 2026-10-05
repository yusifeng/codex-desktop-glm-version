type LocalEnvironmentDependencies = {
  getExcludedEnvironmentVariables: () => Set<string>;
  getProcessCwd: () => string;
  getProcessEnvironment: () => Record<string, string | undefined>;
  getShellDescriptor: (platform: string, environment: Record<string, string | undefined>) => any;
  getShellEnvironment: (
    host: any,
    platform: string,
    environment: Record<string, string | undefined>,
    cwd: string,
  ) => Promise<Record<string, string | undefined>>;
  logger: {
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string, detail: any) => void;
  };
  now: () => number;
  randomUUID: () => string;
};
import {
  TERMINAL_ENVIRONMENT,
  containsLineBreak,
  createCmdWrapper,
  createPosixWrapper,
  createPowerShellWrapper,
  createWrapperScript,
  diffEnvironment,
  indexEnvironment,
  isExcludedEnvironmentKey,
  normalizeEnvironmentKey,
  parseEnvironment,
  quoteCmd,
  quotePosix,
  quotePowerShell,
  scriptLabel,
  selectEnvironmentScript,
  selectPlatformScript,
} from './git-local-environment-policy';

async function detectPlatform(host: any) {
  const [family, os] = await Promise.all([host.platformFamily(), host.platformOs()]);
  if (family === `windows`) return `win32`;
  const normalized = os.toLowerCase();
  return normalized.includes(`darwin`) || normalized.includes(`macos`) ? `darwin` : `linux`;
}

async function readStream(stream: any, onChunk: (chunk: Uint8Array) => void) {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      onChunk(value);
    }
  } finally {
    reader.releaseLock();
  }
}

async function captureEnvironmentDiff(
  capturePath: string,
  platform: string,
  host: any,
  beforeCapturePath: string,
  dependencies: LocalEnvironmentDependencies,
) {
  try {
    const after = await new Response(await host.readFile(capturePath)).text();
    const before = await new Response(await host.readFile(beforeCapturePath)).text();
    return diffEnvironment(
      parseEnvironment(before),
      parseEnvironment(after),
      platform,
      dependencies.getExcludedEnvironmentVariables(),
    );
  } catch (error) {
    dependencies.logger.warning(`[local-environment] failed to capture shell env`, {
      safe: {},
      sensitive: { error },
    });
    return null;
  }
}

function createLocalEnvironmentRuntime(dependencies: LocalEnvironmentDependencies) {
  const runLocalEnvironment = async ({
    workspaceRoot,
    localEnvironment,
    scriptType,
    host,
    injectedEnvironment,
    onLog,
    signal,
  }: any) => {
    const script = selectEnvironmentScript(localEnvironment, scriptType);
    if (script == null) return null;
    const label = scriptLabel(scriptType);
    const startedAt = dependencies.now();
    if (signal?.aborted)
      return {
        setupResult: {
          cwd: workspaceRoot,
          scriptPath: localEnvironment.configPath,
          status: `failed`,
          startedAt,
          finishedAt: dependencies.now(),
          error: `${label} canceled`,
          log: ``,
        },
        shellEnvironment: null,
      };
    let temporaryDirectory: string | null = null;
    try {
      const platform = await detectPlatform(host);
      const selectedScript = selectPlatformScript(script, platform);
      if (!selectedScript) return null;
      const platformPath = await host.platformPath();
      const cwd = platformPath.join(workspaceRoot, localEnvironment.cwdRelativeToGitRoot);
      temporaryDirectory = platformPath.join(
        await host.codexHome(),
        `tmp`,
        `local-environment`,
        dependencies.randomUUID(),
      );
      await host.createDirectory(temporaryDirectory, { recursive: true });
      const remote = !host.isLocal;
      const processEnvironment = remote ? {} : dependencies.getProcessEnvironment();
      const shell = dependencies.getShellDescriptor(platform, processEnvironment);
      const scriptPath = platformPath.join(
        temporaryDirectory,
        `${dependencies.randomUUID()}-setup_script.${shell.scriptExtension}`,
      );
      const wrapperPath = platformPath.join(
        temporaryDirectory,
        `${dependencies.randomUUID()}-setup_wrapper.${shell.scriptExtension}`,
      );
      const beforeCapturePath = platformPath.join(
        temporaryDirectory,
        `${dependencies.randomUUID()}-before_env.txt`,
      );
      const capturePath = platformPath.join(
        temporaryDirectory,
        `${dependencies.randomUUID()}-captured_env.txt`,
      );
      await host.writeFile(scriptPath, selectedScript.replace(/\r\n/g, `\n`));
      await host.writeFile(
        wrapperPath,
        createWrapperScript(shell.shellKind, scriptPath, capturePath, beforeCapturePath),
      );
      const environment = {
        ...(await dependencies.getShellEnvironment(
          host,
          platform,
          processEnvironment,
          remote ? cwd : dependencies.getProcessCwd(),
        )),
        ...TERMINAL_ENVIRONMENT,
        ...injectedEnvironment,
      };
      const log: string[] = [];
      const stdoutDecoder = new TextDecoder(`utf-8`, { ignoreBOM: true });
      const stderrDecoder = new TextDecoder(`utf-8`, { ignoreBOM: true });
      let stdoutRemainder = ``;
      let stderrRemainder = ``;
      const consume = (chunk: Uint8Array, write: (message: string) => void, kind: string) => {
        const bytes = new Uint8Array(chunk);
        onLog?.(kind, bytes);
        const decoder = kind === `stdout` ? stdoutDecoder : stderrDecoder;
        const lines = ((kind === `stdout` ? stdoutRemainder : stderrRemainder) + decoder.decode(bytes, { stream: true })).split(/\r?\n/);
        const remainder = lines.pop() ?? ``;
        if (kind === `stdout`) stdoutRemainder = remainder;
        else stderrRemainder = remainder;
        for (const line of lines)
          if (line) {
            log.push(line);
            write(`[${kind}] ${line}`);
          }
      };
      const flush = () => {
        const flushKind = (kind: string, write: (message: string) => void) => {
          const decoder = kind === `stdout` ? stdoutDecoder : stderrDecoder;
          const text = (kind === `stdout` ? stdoutRemainder : stderrRemainder) + decoder.decode();
          if (kind === `stdout`) stdoutRemainder = ``;
          else stderrRemainder = ``;
          for (const line of text.split(/\r?\n/))
            if (line) {
              log.push(line);
              write(`[${kind}] ${line}`);
            }
        };
        flushKind(`stdout`, dependencies.logger.info);
        flushKind(`stderr`, dependencies.logger.error);
      };
      const cleanupTemporaryDirectory = async () => {
        if (temporaryDirectory != null)
          await host.remove(temporaryDirectory, { recursive: true, force: true });
      };
      const process = await host.spawn({
        args: [shell.executable, ...shell.args, wrapperPath],
        cwd,
        env: environment,
      });
      let canceled = false;
      const abort = () => {
        canceled = true;
        process.kill();
      };
      signal?.addEventListener(`abort`, abort);
      try {
        if (signal?.aborted) abort();
        const [result] = await Promise.all([
          process.wait(),
          readStream(process.stdout, (chunk) =>
            consume(chunk, dependencies.logger.info, `stdout`),
          ),
          readStream(process.stderr, (chunk) =>
            consume(chunk, dependencies.logger.error, `stderr`),
          ),
        ]);
        flush();
        const shellEnvironment =
          scriptType === `setup` && !canceled && result.code === 0
            ? await captureEnvironmentDiff(
                capturePath,
                platform,
                host,
                beforeCapturePath,
                dependencies,
              )
            : null;
        await cleanupTemporaryDirectory();
        let status: string;
        let error: string | undefined;
        if (canceled) {
          status = `failed`;
          error = `${label} canceled`;
        } else if (result.code === 0) status = `succeeded`;
        else {
          status = `failed`;
          error =
            result.signal == null
              ? `${label} exited with code ${result.code}`
              : `${label} exited with signal ${result.signal}`;
        }
        return {
          setupResult: {
            scriptPath,
            cwd,
            status,
            startedAt,
            finishedAt: dependencies.now(),
            error,
            log: log.join(`\n`),
          },
          shellEnvironment,
        };
      } finally {
        signal?.removeEventListener(`abort`, abort);
      }
    } catch (error) {
      if (temporaryDirectory != null)
        await host.remove(temporaryDirectory, { recursive: true, force: true });
      dependencies.logger.warning(`[local-environment] ${scriptType} script failed`, {
        safe: {},
        sensitive: { error },
      });
      return {
        setupResult: {
          cwd: workspaceRoot,
          scriptPath: localEnvironment.configPath,
          status: `failed`,
          startedAt,
          finishedAt: dependencies.now(),
          error: String(error),
          log: ``,
        },
        shellEnvironment: null,
      };
    }
  };

  const runSetupScript = (
    workspaceRoot: string,
    localEnvironment: any,
    onLog: any,
    signal: AbortSignal | undefined,
    injectedEnvironment: any,
    host: any,
  ) =>
    runLocalEnvironment({
      workspaceRoot,
      localEnvironment,
      scriptType: `setup`,
      host,
      injectedEnvironment,
      onLog,
      signal,
    });

  const runCleanupScript = async (
    workspaceRoot: string,
    localEnvironment: any,
    onLog: any,
    signal: AbortSignal | undefined,
    host: any,
  ) =>
    (
      await runLocalEnvironment({
        workspaceRoot,
        localEnvironment,
        scriptType: `cleanup`,
        host,
        onLog,
        signal,
      })
    )?.setupResult ?? null;

  return { runCleanupScript, runLocalEnvironment, runSetupScript };
}

export {
  TERMINAL_ENVIRONMENT,
  captureEnvironmentDiff,
  containsLineBreak,
  createCmdWrapper,
  createLocalEnvironmentRuntime,
  createPosixWrapper,
  createPowerShellWrapper,
  createWrapperScript,
  detectPlatform,
  diffEnvironment,
  indexEnvironment,
  isExcludedEnvironmentKey,
  normalizeEnvironmentKey,
  parseEnvironment,
  quoteCmd,
  quotePosix,
  quotePowerShell,
  readStream,
  scriptLabel,
  selectEnvironmentScript,
  selectPlatformScript,
};
if (typeof module !== `undefined`)
  module.exports = {
    TERMINAL_ENVIRONMENT,
    captureEnvironmentDiff,
    containsLineBreak,
    createCmdWrapper,
    createLocalEnvironmentRuntime,
    createPosixWrapper,
    createPowerShellWrapper,
    createWrapperScript,
    detectPlatform,
    diffEnvironment,
    indexEnvironment,
    isExcludedEnvironmentKey,
    normalizeEnvironmentKey,
    parseEnvironment,
    quoteCmd,
    quotePosix,
    quotePowerShell,
    readStream,
    scriptLabel,
    selectEnvironmentScript,
    selectPlatformScript,
  };
