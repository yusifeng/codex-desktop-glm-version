/** Pure policy helpers for local-environment shell setup and capture. */

export const TERMINAL_ENVIRONMENT = {
  COLORTERM: `truecolor`,
  FORCE_COLOR: `1`,
  TERM: `xterm-256color`,
};

export function parseEnvironment(text: string) {
  const environment: Record<string, string> = {};
  for (const line of text.replace(/^\uFEFF/, ``).split(/\r?\n/)) {
    if (line.length === 0) continue;
    const separator = line.indexOf(`=`);
    if (separator > 0) environment[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return environment;
}

export function normalizeEnvironmentKey(key: string, platform: string) {
  return platform === `win32` ? key.toUpperCase() : key;
}

export function indexEnvironment(environment: Record<string, string | undefined>, platform: string) {
  const indexed = new Map<string, { key: string; value: string }>();
  for (const [key, value] of Object.entries(environment))
    if (value != null)
      indexed.set(normalizeEnvironmentKey(key, platform), { key, value });
  return indexed;
}

export function containsLineBreak(value: string | undefined) {
  return value == null ? false : value.includes(`\n`) || value.includes(`\r`);
}

export function isExcludedEnvironmentKey(
  key: string,
  platform: string,
  excludedEnvironmentVariables: Set<string>,
) {
  const normalized = normalizeEnvironmentKey(key, platform);
  return excludedEnvironmentVariables.has(normalized) || normalized.startsWith(`BASH_FUNC_`);
}

export function diffEnvironment(
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

export function quoteCmd(path: string) { return `"${path.replace(/"/g, `""`)}"`; }
export function quotePosix(path: string) { return `'${path.replace(/'/g, `'\\''`)}'`; }
export function quotePowerShell(path: string) { return `'${path.replace(/'/g, `''`)}'`; }

export function createPosixWrapper(scriptPath: string, capturePath: string, beforeCapturePath: string) {
  return [`set -xeo pipefail`, `capture_path=${quotePosix(capturePath)}`, `before_capture_path=${quotePosix(beforeCapturePath)}`, `env > "$before_capture_path"`, `trap 'code=$?; if [ "$code" -eq 0 ]; then env > "$capture_path"; fi' EXIT`, `. ${quotePosix(scriptPath)}`].join(`\n`);
}
export function createCmdWrapper(scriptPath: string, capturePath: string, beforeCapturePath: string) {
  return [`@echo off`, `set > ${quoteCmd(beforeCapturePath)}`, `call ${quoteCmd(scriptPath)}`, `set CODEX_SETUP_EXIT_CODE=%ERRORLEVEL%`, `if "%CODEX_SETUP_EXIT_CODE%"=="0" set > ${quoteCmd(capturePath)}`, `exit /b %CODEX_SETUP_EXIT_CODE%`].join(`\r\n`);
}
export function createPowerShellWrapper(scriptPath: string, capturePath: string, beforeCapturePath: string) {
  const script = quotePowerShell(scriptPath), capture = quotePowerShell(capturePath);
  return [`$ErrorActionPreference = 'Stop'`, `$PSNativeCommandUseErrorActionPreference = $true`, `$exitCode = 0`, `Get-ChildItem Env: | Sort-Object Name | ForEach-Object { '{0}={1}' -f $_.Name, $_.Value } | Set-Content -LiteralPath ${quotePowerShell(beforeCapturePath)} -Encoding utf8`, `try {`, `  & ${script}`, `} finally {`, `  $exitCode = if ($null -eq $LASTEXITCODE) {`, `    if ($?) { 0 } else { 1 }`, `  } else {`, `    [int]$LASTEXITCODE`, `  }`, `  if ($exitCode -eq 0) {`, `    Get-ChildItem Env: | Sort-Object Name | ForEach-Object { '{0}={1}' -f $_.Name, $_.Value } | Set-Content -LiteralPath ${capture} -Encoding utf8`, `  }`, `}`, `exit $exitCode`].join(`\n`);
}
export function createWrapperScript(shellKind: string, scriptPath: string, capturePath: string, beforeCapturePath: string) {
  switch (shellKind) {
    case `cmd`: return createCmdWrapper(scriptPath, capturePath, beforeCapturePath);
    case `powershell`: return createPowerShellWrapper(scriptPath, capturePath, beforeCapturePath);
    case `posix`: return createPosixWrapper(scriptPath, capturePath, beforeCapturePath);
  }
}

export function selectPlatformScript(script: any, platform: string) {
  const platformScript = script[platform]?.script;
  return platformScript && platformScript.length > 0 ? platformScript : script.script;
}
export function selectEnvironmentScript(localEnvironment: any, scriptType: string) {
  return scriptType === `cleanup` ? (localEnvironment.environment.cleanup ?? null) : localEnvironment.environment.setup;
}
export function scriptLabel(scriptType: string) { return scriptType === `cleanup` ? `Cleanup script` : `Setup script`; }

