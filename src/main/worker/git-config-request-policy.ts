/** Pure config mutation refresh policy. */

export function resolveConfigRefreshRoot(
  root: string,
  success: boolean,
  scope: string | undefined,
  key: string | undefined,
) {
  return success && !(scope === `worktree` && key === `codex.localEnvironmentConfigPath`)
    ? root
    : null;
}

if (typeof module !== `undefined`) module.exports = { resolveConfigRefreshRoot };
