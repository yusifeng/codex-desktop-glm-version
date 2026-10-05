/** Pure policy for Git config scope flags and scope-aware result handling. */

type ConfigScope = `local` | `worktree`;

type GitConfigResult = {
  success?: boolean;
  stdout?: string;
  stderr?: string;
  code?: number | null;
};

function getConfigScopeFlag(scope: ConfigScope): `--local` | `--worktree` {
  return scope === `local` ? `--local` : `--worktree`;
}

function isMissingConfigValue(result: GitConfigResult, scope: ConfigScope): boolean {
  const stderr = result.stderr ?? ``;
  return (result.code === 1 && stderr.trim() === ``) ||
    (scope === `worktree` && result.code === 128 && stderr.toLowerCase().includes(`worktreeconfig`));
}

function formatConfigScopeError(scope: ConfigScope, key: string, result: GitConfigResult): string {
  const details = result.stderr || result.stdout || `exit code ${result.code ?? `unknown`}`;
  return `git config ${getConfigScopeFlag(scope)} --get ${key} failed: ${details}`;
}

export { formatConfigScopeError, getConfigScopeFlag, isMissingConfigValue };
if (typeof module !== `undefined`)
  module.exports = { formatConfigScopeError, getConfigScopeFlag, isMissingConfigValue };
