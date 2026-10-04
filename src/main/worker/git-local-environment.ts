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

const TERMINAL_ENVIRONMENT = {
  COLORTERM: `truecolor`,
  FORCE_COLOR: `1`,
  TERM: `xterm-256color`,
};

function parseEnvironment(text: string) {
  const environment: Record<string, string> = {};
  for (const line of text.replace(/^\uFEFF/, ``).split(/\r?\n/)) {
    if (line.length === 0) continue;
    const separator = line.indexOf(`=`);
    if (separator > 0) environment[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return environment;
}

function normalizeEnvironmentKey(key: string, platform: string) {
  return platform === `win32` ? key.toUpperCase() : key;
}

function indexEnvironment(environment: Record<string, string | undefined>, platform: string) {
  const indexed = new Map<string, { key: string; value: string }>();
  for (const [key, value] of Object.entries(environment))
    if (value != null)
      indexed.set(normalizeEnvironmentKey(key, platform), { key, value });
  return indexed;
}

function containsLineBreak(value: string | undefined) {
  return value == null ? false : value.includes(`\n`) || value.includes(`\r`);
}

function isExcludedEnvironmentKey(
  key: string,
  platform: string,
  excludedEnvironmentVariables: Set<string>,
) {
  const normalized = normalizeEnvironmentKey(key, platform);
  return excludedEnvironmentVariables.has(normalized) || normalized.startsWith(`BASH_FUNC_`);
}

function diffEnvironment(
  before: Record<string, string | undefined>,
  after: Record<string, string | undefined>,
  platform: string,
  excludedEnvironmentVariables: Set<string>,
) {
  const beforeIndexed = indexEnvironment(before, platform);
  const afterIndexed = indexEnvironment(after, platform);
  const keys = new Set([...beforeIndexed.keys(), ...afterIndexed.keys()]);
  const set: Record<string, string> = {};
  const exclude: string[] = [];
  for (const key of keys) {
    const beforeEntry = beforeIndexed.get(key);
    const afterEntry = afterIndexed.get(key);
    const originalKey = afterEntry?.key ?? beforeEntry?.key;
    if (
      originalKey != null &&
      !isExcludedEnvironmentKey(originalKey, platform, excludedEnvironmentVariables) &&
      !containsLineBreak(beforeEntry?.value) &&
      !containsLineBreak(afterEntry?.value)
    ) {
      if (afterEntry == null) {
        exclude.push(originalKey);
        continue;
      }
      if (beforeEntry?.value !== afterEntry.value) set[originalKey] = afterEntry.value;
    }
  }
  if (exclude.length === 0 && Object.keys(set).length === 0) return null;
  exclude.sort();
  return {
    version: 1,
    set: Object.fromEntries(Object.entries(set).sort(([left], [right]) => left.localeCompare(right))),
    exclude,
  };
}

function quoteCmd(path: string) {
  return `"${path.replace(/"/g, `""`)}"`;
}

function quotePosix(path: string) {
  return `'${path.replace(/'/g, `'\\''`)}'`;
}

function quotePowerShell(path: string) {
  return `'${path.replace(/'/g, `''`)}'`;
}

function createPosixWrapper(scriptPath: string, capturePath: string, beforeCapturePath: string) {
  return [
    `set -xeo pipefail`,
    `capture_path=${quotePosix(capturePath)}`,
    `before_capture_path=${quotePosix(beforeCapturePath)}`,
    `env > "$before_capture_path"`,
    `trap 'code=$?; if [ "$code" -eq 0 ]; then env > "$capture_path"; fi' EXIT`,
    `. ${quotePosix(scriptPath)}`,
  ].join(`\n`);
}

function createCmdWrapper(scriptPath: string, capturePath: string, beforeCapturePath: string) {
  return [
    `@echo off`,
    `set > ${quoteCmd(beforeCapturePath)}`,
    `call ${quoteCmd(scriptPath)}`,
    `set CODEX_SETUP_EXIT_CODE=%ERRORLEVEL%`,
    `if "%CODEX_SETUP_EXIT_CODE%"=="0" set > ${quoteCmd(capturePath)}`,
    `exit /b %CODEX_SETUP_EXIT_CODE%`,
  ].join(`\r\n`);
}

function createPowerShellWrapper(
  scriptPath: string,
  capturePath: string,
  beforeCapturePath: string,
) {
  const script = quotePowerShell(scriptPath);
  const capture = quotePowerShell(capturePath);
  return [
    `$ErrorActionPreference = 'Stop'`,
    `$PSNativeCommandUseErrorActionPreference = $true`,
    `$exitCode = 0`,
    `Get-ChildItem Env: | Sort-Object Name | ForEach-Object { '{0}={1}' -f $_.Name, $_.Value } | Set-Content -LiteralPath ${quotePowerShell(beforeCapturePath)} -Encoding utf8`,
    `try {`,
    `  & ${script}`,
    `} finally {`,
    `  $exitCode = if ($null -eq $LASTEXITCODE) {`,
    `    if ($?) { 0 } else { 1 }`,
    `  } else {`,
    `    [int]$LASTEXITCODE`,
    `  }`,
    `  if ($exitCode -eq 0) {`,
    `    Get-ChildItem Env: | Sort-Object Name | ForEach-Object { '{0}={1}' -f $_.Name, $_.Value } | Set-Content -LiteralPath ${capture} -Encoding utf8`,
    `  }`,
    `}`,
    `exit $exitCode`,
  ].join(`\n`);
}

function createWrapperScript(
  shellKind: string,
  scriptPath: string,
  capturePath: string,
  beforeCapturePath: string,
) {
  switch (shellKind) {
    case `cmd`:
      return createCmdWrapper(scriptPath, capturePath, beforeCapturePath);
    case `powershell`:
      return createPowerShellWrapper(scriptPath, capturePath, beforeCapturePath);
    case `posix`:
      return createPosixWrapper(scriptPath, capturePath, beforeCapturePath);
  }
}

async function detectPlatform(host: any) {
  const [family, os] = await Promise.all([host.platformFamily(), host.platformOs()]);
  if (family === `windows`) return `win32`;
  const normalized = os.toLowerCase();
  return normalized.includes(`darwin`) || normalized.includes(`macos`) ? `darwin` : `linux`;
}

function selectPlatformScript(script: any, platform: string) {
  const platformScript = script[platform]?.script;
  return platformScript && platformScript.length > 0 ? platformScript : script.script;
}

function selectEnvironmentScript(localEnvironment: any, scriptType: string) {
  return scriptType === `cleanup`
    ? (localEnvironment.environment.cleanup ?? null)
    : localEnvironment.environment.setup;
}

function scriptLabel(scriptType: string) {
  return scriptType === `cleanup` ? `Cleanup script` : `Setup script`;
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
