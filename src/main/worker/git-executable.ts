import {
  getEnvironmentValue,
  hasPathOverride,
  mergeProcessEnvironment,
} from "./git-executable-policy";

/** Windows Git executable resolution and command-line adaptation. */

export type GitExecutableDependencies = {
  platform?: string;
  spawnSync?: (command: string, args: string[], options: Record<string, unknown>) => {
    status: number | null;
    stdout?: unknown;
  };
  whereCommand?: string;
};

const GIT_EXECUTABLE_NAMES = [`git.exe`, `git`];

function resolveGitCandidate(name: string, environment: Record<string, string | undefined>, deps: Required<GitExecutableDependencies>): string | null {
  const result = deps.spawnSync(deps.whereCommand, [`$PATH:${name}`], {
    env: environment,
    windowsHide: true,
    encoding: `utf8`,
  });
  if (result.status !== 0 || typeof result.stdout !== `string`) return null;
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0) ?? null;
}

export function createGitExecutableResolver(
  dependencies: GitExecutableDependencies = {},
  processEnvironment: Record<string, string | undefined> = process.env,
): (environment: Record<string, string | undefined>, bypassCache?: boolean) => string {
  const platform = dependencies.platform ?? process.platform;
  const spawnSync = dependencies.spawnSync ?? ((command, args, options) => require(`node:child_process`).spawnSync(command, args, options));
  const whereCommand = dependencies.whereCommand ?? `C:\\Windows\\System32\\where.exe`;
  const deps = { platform, spawnSync, whereCommand } as Required<GitExecutableDependencies>;
  let cached: string | null = null;
  return (environment, bypassCache = false) => {
    if (platform !== `win32`) throw Error(`Git executable resolution is only supported on Windows`);
    if (!bypassCache && cached != null) return cached;
    const merged = mergeProcessEnvironment(environment, processEnvironment);
    const executable = GIT_EXECUTABLE_NAMES.map((name) => resolveGitCandidate(name, merged, deps)).find((value) => value != null);
    if (executable == null) throw Error(`Failed to locate git executable in PATH`);
    if (!bypassCache) cached = executable;
    return executable;
  };
}

export function rewriteGitCommandForWindows(
  args: string[],
  environment: Record<string, string | undefined> | undefined,
  runsInsideWsl: boolean,
  dependencies: GitExecutableDependencies = {},
): string[] {
  if (runsInsideWsl || (dependencies.platform ?? process.platform) !== `win32` || args[0] !== `git`) return args;
  const merged = mergeProcessEnvironment(environment);
  const executable = createGitExecutableResolver(dependencies)(merged, hasPathOverride(environment));
  if (/\.(cmd|bat)$/i.test(executable)) {
    return [getEnvironmentValue(merged, `ComSpec`) ?? `cmd.exe`, `/d`, `/s`, `/c`, executable, ...args.slice(1)];
  }
  return [executable, ...args.slice(1)];
}

module.exports = { createGitExecutableResolver, getEnvironmentValue, hasPathOverride, mergeProcessEnvironment, rewriteGitCommandForWindows };
