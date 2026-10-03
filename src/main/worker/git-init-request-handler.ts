type GitInitDependencies = {
  gitManager: { invalidateStableMetadata(): void };
  host: any;
  runGit: (root: string, args: string[], host: any) => Promise<{ success: boolean; stderr?: string; stdout?: string }>;
};

async function initializeGitRepository(params: { cwd: unknown }, deps: GitInitDependencies) {
  const root = String(params.cwd).trim();
  if (!root) throw new Error(`Workspace root is required`);
  const result = await deps.runGit(root, [`init`], deps.host);
  if (!result.success) throw new Error(result.stderr || result.stdout || `Failed to run git init`);
  deps.gitManager.invalidateStableMetadata();
  return { success: true };
}

export { initializeGitRepository };
if (typeof module !== `undefined`) module.exports = { initializeGitRepository };
