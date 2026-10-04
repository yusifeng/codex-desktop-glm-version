type WorktreeDeleteDependencies = {
  createSemaphore: (capacity: number) => { acquire: () => Promise<void>; release: () => void };
  getHostId: (host: any) => string;
  getLocalEnvironmentConfigPath: (
    worktree: string,
    host: any,
    signal?: AbortSignal,
  ) => Promise<string | null>;
  getWorktreeId: (worktree: string) => Promise<string>;
  logger: {
    debug: (message: string, detail: any) => void;
    info: (message: string, detail: any) => void;
    warning: (message: string, detail: any) => void;
  };
  readLocalEnvironmentConfig: (configPath: string, host: any) => Promise<any>;
  runCleanupScript: (
    worktree: string,
    config: any,
    signal: AbortSignal | undefined,
    host: any,
  ) => Promise<any>;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

const WORKTREE_DELETE_CONCURRENCY = 3;

async function cleanupWorktreeEnvironment(
  worktree: string,
  worktreeId: string,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: WorktreeDeleteDependencies,
) {
  const configPath = await dependencies.getLocalEnvironmentConfigPath(worktree, host, signal);
  if (configPath == null || configPath === `__none__`) return;
  const config = await dependencies.readLocalEnvironmentConfig(configPath, host);
  if (config.type === `error`) {
    dependencies.logger.warning(`[worktree-delete] cleanup-config-unavailable`, {
      safe: { worktreeId },
      sensitive: { configPath, error: config.error },
    });
    return;
  }
  if (!config.environment.cleanup) return;
  dependencies.logger.info(`[worktree-delete] cleanup-script-start`, {
    safe: { worktreeId },
    sensitive: { configPath },
  });
  const result = await dependencies.runCleanupScript(worktree, config, signal, host);
  if (result != null) {
    if (result.status === `failed`) {
      dependencies.logger.warning(`[worktree-delete] cleanup-script-failed`, {
        safe: { worktreeId },
        sensitive: { configPath, error: result.error },
      });
      throw Error(result.error ?? `Cleanup script failed`);
    }
    dependencies.logger.info(`[worktree-delete] cleanup-script-finished`, {
      safe: { worktreeId },
      sensitive: { configPath },
    });
  }
}

async function removeWorktreeDirectory(
  worktree: string,
  worktreeId: string,
  host: any,
  dependencies: Pick<WorktreeDeleteDependencies, `logger`>,
) {
  const platformPath = await host.platformPath();
  let removedWorktreeDir = false;
  let removedParentDir = false;
  try {
    await host.remove(worktree, { recursive: true, force: true });
    removedWorktreeDir = true;
  } catch (error) {
    dependencies.logger.warning(`Failed to remove worktree directory`, {
      safe: {},
      sensitive: { error },
    });
  }
  try {
    const parent = platformPath.dirname(worktree);
    if (parent === worktree) return;
    if ((await host.readDirectory(parent)).length === 0) {
      await host.remove(parent, { recursive: true, force: true });
      removedParentDir = true;
    }
  } catch (error) {
    dependencies.logger.warning(`Failed to remove worktree parent directory`, {
      safe: {},
      sensitive: { error },
    });
  }
  dependencies.logger.debug(`[worktree-delete] cleanup-finished`, {
    safe: { worktreeId },
    sensitive: { removedWorktreeDir, removedParentDir },
  });
}

function createWorktreeDelete(dependencies: WorktreeDeleteDependencies) {
  const semaphores = new Map<string, ReturnType<WorktreeDeleteDependencies[`createSemaphore`]>>();
  const getSemaphore = (host: any) => {
    const hostId = dependencies.getHostId(host);
    const existing = semaphores.get(hostId);
    if (existing) return existing;
    const semaphore = dependencies.createSemaphore(WORKTREE_DELETE_CONCURRENCY);
    semaphores.set(hostId, semaphore);
    return semaphore;
  };

  const removeWorktree = async (
    worktree: string,
    host: any,
    force = false,
    signal?: AbortSignal,
  ) => {
    const worktreeId = await dependencies.getWorktreeId(worktree);
    const semaphore = getSemaphore(host);
    await semaphore.acquire();
    try {
      dependencies.logger.info(`[worktree-delete] start`, {
        safe: { worktreeId, force, hasHostConfig: host != null },
        sensitive: {},
      });
      await cleanupWorktreeEnvironment(worktree, worktreeId, host, signal, dependencies);
      const args = [`worktree`, `remove`];
      if (force) args.push(`--force`);
      args.push(worktree);
      const result = await dependencies.runGit(worktree, args, host, { signal });
      dependencies.logger.info(`[worktree-delete] git-remove-result`, {
        safe: {
          worktreeId,
          force,
          success: result.success,
          code: result.code,
          outputLimitExceeded: result.outputLimitExceeded != null,
        },
        sensitive: {},
      });
      if (result.success || force)
        await removeWorktreeDirectory(worktree, worktreeId, host, dependencies);
    } finally {
      semaphore.release();
    }
  };

  return { removeWorktree };
}

export {
  WORKTREE_DELETE_CONCURRENCY,
  cleanupWorktreeEnvironment,
  createWorktreeDelete,
  removeWorktreeDirectory,
};
if (typeof module !== `undefined`)
  module.exports = {
    WORKTREE_DELETE_CONCURRENCY,
    cleanupWorktreeEnvironment,
    createWorktreeDelete,
    removeWorktreeDirectory,
  };
