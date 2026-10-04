type WorktreeShellEnvironmentDependencies = {
  logger: { warning: (message: string, detail: any) => void };
  parseSchema: (value: unknown) => {
    success: boolean;
    data?: any;
    error?: { message?: string };
  };
  resolveGitPath: (
    repository: any,
    fileName: string,
    signal?: AbortSignal,
  ) => Promise<string | null>;
};

const WORKTREE_SHELL_ENVIRONMENT_FILE = `codex-shell-environment.json`;

async function resolveWorktreeShellEnvironmentPath(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: WorktreeShellEnvironmentDependencies,
) {
  return dependencies.resolveGitPath(
    repository,
    WORKTREE_SHELL_ENVIRONMENT_FILE,
    signal,
  );
}

async function readWorktreeShellEnvironment(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: WorktreeShellEnvironmentDependencies,
) {
  const path = await resolveWorktreeShellEnvironmentPath(
    repository,
    signal,
    dependencies,
  );
  if (path == null) return null;
  try {
    const body = await new Response(await repository.host.readFile(path)).text();
    const result = dependencies.parseSchema(JSON.parse(body));
    if (result.success) return result.data;
    dependencies.logger.warning(`Invalid worktree shell environment config`, {
      safe: {},
      sensitive: { error: result.error?.message },
    });
    return null;
  } catch (error) {
    if ((error as { code?: string })?.code !== `ENOENT`)
      dependencies.logger.warning(`Failed to read worktree shell environment config`, {
        safe: {},
        sensitive: { error },
      });
    return null;
  }
}

async function writeWorktreeShellEnvironment(
  repository: any,
  value: any,
  signal: AbortSignal | undefined,
  dependencies: WorktreeShellEnvironmentDependencies,
) {
  const path = await resolveWorktreeShellEnvironmentPath(
    repository,
    signal,
    dependencies,
  );
  if (path == null) throw Error(`No git repository found for worktree shell env`);
  await repository.host.writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function removeWorktreeShellEnvironment(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: WorktreeShellEnvironmentDependencies,
) {
  const path = await resolveWorktreeShellEnvironmentPath(
    repository,
    signal,
    dependencies,
  );
  if (path != null) await repository.host.remove(path);
}

export {
  WORKTREE_SHELL_ENVIRONMENT_FILE,
  readWorktreeShellEnvironment,
  removeWorktreeShellEnvironment,
  resolveWorktreeShellEnvironmentPath,
  writeWorktreeShellEnvironment,
};
if (typeof module !== `undefined`)
  module.exports = {
    WORKTREE_SHELL_ENVIRONMENT_FILE,
    readWorktreeShellEnvironment,
    removeWorktreeShellEnvironment,
    resolveWorktreeShellEnvironmentPath,
    writeWorktreeShellEnvironment,
  };
