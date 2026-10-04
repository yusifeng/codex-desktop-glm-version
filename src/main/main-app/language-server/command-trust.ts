/** Pure command-trust and launch-argument policy for language-server providers.
 *
 * Extracted from main-C-Mhak1n.ts 128,444-128,557 (QQ/H1e/U1e).
 * The host performs lookup/stat/spawn I/O; this module keeps only the security
 * boundary and deterministic argument construction so those effects remain in
 * the original provider/session adapter.
 */

export interface HostPathApi {
  dirname(path: string): string;
  isAbsolute(path: string): boolean;
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
  sep: string;
}

/** Original marker used to distinguish command -v output from shell noise. */
export const LANGUAGE_SERVER_LOOKUP_MARKER = "__CODEX_LANGUAGE_SERVER__=";

/** Original 10s lookup timeout and 1 MiB node-module script limit. */
export const LANGUAGE_SERVER_LOOKUP_TIMEOUT_MS = 10_000;
export const LANGUAGE_SERVER_NODE_SCRIPT_MAX_BYTES = 1_048_576;

/**
 * Accept only absolute executables outside the workspace (the language-server
 * executable must not be supplied by workspace content), and reject
 * node_modules paths. A null result is intentional:
 * callers must treat an untrusted lookup as unavailable.
 */
export function resolveTrustedLanguageServerPath(
  candidate: string | null | undefined,
  workspaceRoot: string,
  hostPath: HostPathApi,
): string | null {
  if (
    candidate == null ||
    candidate === "" ||
    !hostPath.isAbsolute(candidate) ||
    candidate.split(/[\\/]/u).includes("node_modules")
  )
    return null;
  const relative = hostPath.relative(workspaceRoot, candidate);
  return relative === "" ||
    (!relative.startsWith(`..${hostPath.sep}`) && relative !== ".." && !hostPath.isAbsolute(relative))
    ? null
    : candidate;
}

/** Parse the last shell lookup marker emitted by the Unix resolver. */
export function parseUnixTrustedLookup(output: string | null | undefined, marker = LANGUAGE_SERVER_LOOKUP_MARKER): string | null {
  return resolveLastMarkedLine(output, marker, (line) => line.slice(marker.length).trim());
}

/** Parse the first Windows `where.exe` candidate with an executable suffix. */
export function parseWindowsTrustedLookup(output: string | null | undefined): string | null {
  if (output == null) return null;
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => /\.(?:bat|cmd|com|exe)$/iu.test(line)) ?? null;
}

function resolveLastMarkedLine(
  output: string | null | undefined,
  marker: string,
  read: (line: string) => string,
): string | null {
  if (output == null) return null;
  const lines = output.split(/\r?\n/u);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].startsWith(marker)) {
      const value = read(lines[index]);
      return value === "" ? null : value;
    }
  }
  return null;
}

/** Construct the direct command used by Unix hosts and remote shells. */
export function buildUnixDirectLaunchCommand(
  executable: string,
  args: string[],
  isLocal: boolean,
  platform: string,
): string[] {
  return isLocal && platform !== "win32"
    ? [executable, ...args]
    : ["/bin/sh", "-lc", 'exec "$@"', "sh", executable, ...args];
}

/** Construct the Windows node wrapper for .cmd/.bat language-server scripts. */
export function buildWindowsNodeModuleLaunchCommand(
  executable: string,
  packagePath: string,
  packageEntry: string,
  nodeExecutable: string,
  hostPath: HostPathApi,
): string[] {
  const script = hostPath.join(hostPath.dirname(executable), "node_modules", packagePath, packageEntry);
  return [nodeExecutable, script];
}

export const languageServerCommandTrust = {
  resolveTrustedLanguageServerPath,
  parseUnixTrustedLookup,
  parseWindowsTrustedLookup,
  buildUnixDirectLaunchCommand,
  buildWindowsNodeModuleLaunchCommand,
};

if (typeof module !== "undefined") module.exports = languageServerCommandTrust;
