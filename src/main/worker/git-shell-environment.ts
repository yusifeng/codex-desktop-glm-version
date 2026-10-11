import { parseShellEnvironmentOutput } from './shell-environment-parser';

const SHELL_ENV_DELIMITER = `_SHELL_ENV_DELIMITER_`;
const SHELL_ENV_COMMAND = `printf '\\0%s\\0' '${SHELL_ENV_DELIMITER}'; command env -0 || exit; printf '\\0%s\\0' '${SHELL_ENV_DELIMITER}'; exit`;
const SHELL_ENVIRONMENT = {
  DISABLE_AUTO_UPDATE: `true`,
  ZSH_TMUX_AUTOSTARTED: `true`,
  ZSH_TMUX_AUTOSTART: `false`,
  CODEX_SHELL: `1`,
};
const LOGIN_SHELLS = [`/bin/zsh`, `/bin/bash`];

type ShellEnvironmentDependencies = {
  runProcess: (process: any) => Promise<{ code: number; stdout: string }>;
  logger: { warning: (message: string, detail: any) => void };
};

function stripShellMarker(environment: Record<string, string>) {
  const { CODEX_SHELL: _marker, ...withoutMarker } = environment;
  return withoutMarker;
}

export function createShellEnvironmentResolver(dependencies: ShellEnvironmentDependencies) {
  const cache = new Map<string, Promise<Record<string, string>>>();

  async function resolveLoginShell(host: any, cwd: string) {
    const result = await dependencies.runProcess(
      await host.spawn({ args: [`sh`, `-c`, `entry=$(getent passwd "$(id -u)" 2>/dev/null) || entry=$(id -P 2>/dev/null) || exit 1; shell=\${entry##*:}; test -n "$shell" || exit 1; printf "%s\\n" "$shell"`], cwd, timeoutMs: 5e3 }),
    );
    return result.code === 0
      ? result.stdout.split(/\r?\n/).map((line: string) => line.trim()).find((line: string) => line.length > 0) ?? null
      : null;
  }

  async function resolveShellEnvironment(
    host: any,
    platform: string,
    environment: Record<string, string | undefined>,
    cwd: string,
  ) {
    if (platform === `win32`) return { ...environment };
    const key = host.id;
    const cached = cache.get(key);
    if (cached != null) return cached;
    const pending = loadShellEnvironment(host, environment, cwd);
    cache.set(key, pending);
    return pending;
  }

  async function loadShellEnvironment(host: any, environment: Record<string, string | undefined>, cwd: string) {
    const detected = await resolveLoginShell(host, cwd).catch(() => null);
    const shells = [detected ?? `/bin/sh`, ...LOGIN_SHELLS.filter((shell) => shell !== detected)];
    let lastError: unknown = null;
    for (const shell of shells) {
      try {
        const result = await dependencies.runProcess(
          await host.spawn({
            args: [shell, `-ilc`, SHELL_ENV_COMMAND],
            cwd,
            env: SHELL_ENVIRONMENT,
            timeoutMs: 1e4,
          }),
        );
        if (result.code !== 0) {
          lastError = new Error(`Login shell exited unsuccessfully`);
          continue;
        }
        return stripShellMarker({ ...environment, ...parseShellEnvironmentOutput(result.stdout, SHELL_ENV_DELIMITER, `\0`) });
      } catch (error) {
        lastError = error;
      }
    }
    dependencies.logger.warning(`[local-environment] failed to load shell env`, {
      safe: {},
      sensitive: { error: lastError },
    });
    return stripShellMarker({ ...environment });
  }

  return resolveShellEnvironment;
}

if (typeof module !== `undefined`) module.exports = { createShellEnvironmentResolver };
