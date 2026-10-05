type WorktreeSetupDependencies = {
  originalWorkspaceEnv: string;
  worktreeWorkspaceEnv: string;
  readLocalEnvironmentConfig: (path: string, host: any) => Promise<any>;
  runSetupScript: (...args: any[]) => Promise<any>;
  removeWorktreeShellEnvironment: (repository: any, signal?: AbortSignal) => Promise<void>;
  writeWorktreeShellEnvironment: (repository: any, value: any, signal?: AbortSignal) => Promise<void>;
};
import { getWorktreeSetupFailure } from "./git-worktree-setup-policy";

/** Persists the selected environment and runs its optional worktree setup lifecycle. */
async function runWorktreeSetup(
  environmentPath: string | null,
  params: {
    allowSetupFailure?: boolean;
    host: any;
    signal?: AbortSignal;
    workspaceRoot: string;
    worktreeGitRoot: string;
    worktreeWorkspaceRoot: string;
    worktreeRepository: any;
    onLog?: (kind: string, chunk: Uint8Array) => void;
    onSetupStart?: () => void;
  },
  dependencies: WorktreeSetupDependencies,
) {
  const encoder = new TextEncoder();
  const log = (kind: string, message: string) => params.onLog?.(kind, encoder.encode(`${message}\n`));
  const success = (setupResult: any = null, setupError: Error | null = null) => ({
    success: true,
    worktreeGitRoot: params.worktreeGitRoot,
    worktreeWorkspaceRoot: params.worktreeWorkspaceRoot,
    setupResult,
    setupError,
  });
  if (environmentPath == null) {
    log(`info`, `No local environment selected`);
    return success();
  }
  params.onSetupStart?.();
  const environment = await dependencies.readLocalEnvironmentConfig(environmentPath, params.host);
  if (environment.type === `error`) {
    const error = Error(environment.error.message);
    log(`stderr`, error.message);
    return params.allowSetupFailure ? success(null, error) : { success: false, error };
  }
  log(`info`, `Running setup script ${environment.configPath}`);
  const setup = await dependencies.runSetupScript(
    params.worktreeGitRoot,
    environment,
    (kind: string, chunk: Uint8Array) => params.onLog?.(kind, chunk),
    params.signal,
    {
      [dependencies.originalWorkspaceEnv]: params.workspaceRoot,
      [dependencies.worktreeWorkspaceEnv]: params.worktreeWorkspaceRoot,
    },
    params.host,
  );
  if (params.signal?.aborted) return { success: false, error: Error(`Request canceled`) };
  const setupResult = setup?.setupResult ?? null;
  const setupFailure = getWorktreeSetupFailure(setupResult);
  if (setupFailure != null) {
    const error = Error(setupFailure);
    log(`stderr`, setupFailure);
    return params.allowSetupFailure ? success(setupResult, error) : { success: false, error };
  }
  if (setupResult?.status === `succeeded`) log(`info`, `Setup script completed`);
  try {
    if (setup?.shellEnvironment == null)
      await dependencies.removeWorktreeShellEnvironment(params.worktreeRepository, params.signal);
    else
      await dependencies.writeWorktreeShellEnvironment(params.worktreeRepository, setup.shellEnvironment, params.signal);
  } catch (error) {
    log(`stderr`, `Failed to store worktree shell environment: ${String(error)}`);
  }
  return success(setupResult);
}

export { runWorktreeSetup };
if (typeof module !== `undefined`) module.exports = { runWorktreeSetup };
