/** Build the setup script's workspace environment overrides. */
export function buildWorktreeSetupEnvironment(
  originalWorkspaceEnv: string,
  worktreeWorkspaceEnv: string,
  workspaceRoot: string,
  worktreeWorkspaceRoot: string,
): Record<string, string> {
  return {
    [originalWorkspaceEnv]: workspaceRoot,
    [worktreeWorkspaceEnv]: worktreeWorkspaceRoot,
  };
}
if (typeof module !== "undefined") module.exports = { buildWorktreeSetupEnvironment };
