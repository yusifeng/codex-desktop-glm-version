import { runWorktreeSetup } from "./git-worktree-setup";
import { shouldSetUpSyncedBranch } from "./git-worktree-branch-setup-policy";

type WorktreeCreateDependencies = {
  copyAgentOverrideFiles: (sourceRoot: string, targetRoot: string, host: any) => Promise<void>;
  copyWorktreeFiles: (params: any) => Promise<void>;
  createWorktreeCheckout: (...args: any[]) => Promise<any>;
  createWorktreePath: (...args: any[]) => Promise<any>;
  ensureWorktreesRoot: (host: any, root?: string) => Promise<void>;
  findWorktreeIncludeFiles: (root: string, host: any) => Promise<string[]>;
  formatLocalBranchRef: (branch: string) => string;
  getCommitTree: (repository: any, ref: string, signal?: AbortSignal) => Promise<string>;
  getDefaultRemoteBranch: (repository: any) => Promise<any>;
  normalizeCwd: (value: string) => string;
  normalizeRoot: (value: string) => string;
  originalWorkspaceEnv: string;
  readLocalEnvironmentConfig: (path: string, host: any) => Promise<any>;
  removeWorktreeShellEnvironment: (repository: any, signal?: AbortSignal) => Promise<void>;
  reserveWorktreeNameDirectory: (path: string, host: any, signal?: AbortSignal) => Promise<string>;
  resolveCreatedWorktreeBranchName: (...args: any[]) => Promise<string | null>;
  resolveWorktreeLocalEnvironmentConfig: (params: any) => Promise<string | null>;
  runSetupScript: (...args: any[]) => Promise<any>;
  setSyncedBranchConfig: (...args: any[]) => Promise<void>;
  worktreeIncludeFile: string;
  worktreeNameMarker: string;
  worktreeWorkspaceEnv: string;
  writeWorktreeShellEnvironment: (repository: any, value: any, signal?: AbortSignal) => Promise<void>;
};

const encoder = new TextEncoder();
const requestCanceled = () => ({ success: false, error: Error(`Request canceled`) });

async function createWorktree(params: any, dependencies: WorktreeCreateDependencies) {
  const {
    name,
    gitManager,
    workspaceRoot,
    startingState,
    upstreamRefreshMode,
    localEnvironmentConfigPath,
    allowSetupFailure = false,
    setUpSyncedBranch = true,
    host,
    signal,
    upstreamRefreshSignal,
    onLog,
    onWorktreePathAllocated,
    onSetupStart,
    worktreesRoot,
    useWorkspaceDir = false,
  } = params;
  if (signal?.aborted) return requestCanceled();
  const sourceRepository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(workspaceRoot),
    host,
  );
  if (!sourceRepository) return { success: false, error: Error(`Not a git repository`) };
  if (signal?.aborted) return requestCanceled();
  const defaultBranch = (await dependencies.getDefaultRemoteBranch(sourceRepository))?.branch ?? null;
  let resolvedWorktreesRoot = worktreesRoot;
  if (!resolvedWorktreesRoot?.trim() && !useWorkspaceDir) {
    const [codexHome, platformPath] = await Promise.all([
      host.codexHome(),
      host.platformPath(),
    ]);
    resolvedWorktreesRoot = platformPath.join(codexHome, `worktrees`);
  }
  await dependencies.ensureWorktreesRoot(host, resolvedWorktreesRoot);
  const pathResult = await dependencies.createWorktreePath(
    sourceRepository.root,
    gitManager,
    workspaceRoot,
    host,
    resolvedWorktreesRoot,
    name,
  );
  if (!pathResult.success) return { success: false, error: pathResult.error };
  if (signal?.aborted) return requestCanceled();
  let {
    worktreeGitRoot,
    worktreeWorkspaceRoot,
  } = pathResult;
  const platformPath = await host.platformPath();
  let namedDirectory = name == null ? null : platformPath.dirname(worktreeGitRoot);
  if (namedDirectory != null) {
    let reservedDirectory: string | null = null;
    try {
      namedDirectory = await dependencies.reserveWorktreeNameDirectory(
        namedDirectory,
        host,
        signal,
      );
      reservedDirectory = namedDirectory;
      const relativeWorkspace = platformPath.relative(worktreeGitRoot, worktreeWorkspaceRoot);
      worktreeGitRoot = dependencies.normalizeRoot(
        platformPath.join(namedDirectory, platformPath.basename(worktreeGitRoot)),
      );
      worktreeWorkspaceRoot = dependencies.normalizeCwd(
        platformPath.join(worktreeGitRoot, relativeWorkspace),
      );
      await host.writeFile(
        platformPath.join(namedDirectory, dependencies.worktreeNameMarker),
        ``,
      );
    } catch (error) {
      if (reservedDirectory != null)
        await host
          .remove(reservedDirectory, { recursive: true, force: true })
          .catch(() => undefined);
      return {
        success: false,
        error: Error(
          `Could not reserve the worktree name. Choose an unused name and check the worktrees directory permissions.`,
          { cause: error },
        ),
      };
    }
  }
  onWorktreePathAllocated?.(worktreeGitRoot);
  const checkout = await dependencies.createWorktreeCheckout(
    sourceRepository.root,
    worktreeGitRoot,
    startingState,
    gitManager,
    host,
    { onLog, signal, upstreamRefreshMode, upstreamRefreshSignal },
  );
  if (!checkout.success) {
    if (namedDirectory != null)
      await host.remove(namedDirectory, { recursive: true, force: true });
    return { success: false, error: checkout.error };
  }
  if (signal?.aborted) return requestCanceled();
  const worktreeRepository = gitManager.getWorktreeRepositoryForRoot(worktreeGitRoot, host);
  const branch = await dependencies.resolveCreatedWorktreeBranchName(
    sourceRepository,
    startingState,
    checkout.startingRef,
    signal,
  );
  const shouldConfigureSyncedBranch = shouldSetUpSyncedBranch({
    setUpSyncedBranch,
    branch,
    defaultBranch,
    startingState,
  });
  if (host.isLocal) {
    await dependencies.copyAgentOverrideFiles(
      sourceRepository.root,
      worktreeGitRoot,
      host,
    );
    const includedFiles = await dependencies.findWorktreeIncludeFiles(
      sourceRepository.root,
      host,
    );
    await dependencies.copyWorktreeFiles({
      sourceGitRoot: sourceRepository.root,
      worktreeGitRoot,
      relativePaths: includedFiles,
      label: dependencies.worktreeIncludeFile,
      host,
      onLog,
    });
  }
  if (shouldConfigureSyncedBranch && branch) {
    const branchRef = dependencies.formatLocalBranchRef(branch);
    await dependencies.setSyncedBranchConfig(
      worktreeRepository,
      branchRef,
      await dependencies.getCommitTree(sourceRepository, branchRef, signal),
      signal,
    );
  }
  onLog?.(`info`, encoder.encode(`Worktree created at ${worktreeWorkspaceRoot}\n`));
  const environmentPath =
    localEnvironmentConfigPath == null
      ? null
      : await dependencies
          .resolveWorktreeLocalEnvironmentConfig({
            localEnvironmentConfigPath,
            sourceGitRoot: sourceRepository.root,
            worktreeGitRoot,
            host,
            signal,
          })
          .catch(() => localEnvironmentConfigPath);
  const storedEnvironmentPath = environmentPath ?? `__none__`;
  if (
    !(await worktreeRepository.setConfigValueForScope(
      `codex.localEnvironmentConfigPath`,
      storedEnvironmentPath,
      `worktree`,
      signal,
    ))
  )
    onLog?.(
      `stderr`,
      encoder.encode(`Failed to store selected environment in git config\n`),
    );
  return runWorktreeSetup(environmentPath, {
    allowSetupFailure,
    host,
    signal,
    workspaceRoot,
    worktreeGitRoot,
    worktreeWorkspaceRoot,
    worktreeRepository,
    onLog,
    onSetupStart,
  }, dependencies);
}

export { createWorktree };
if (typeof module !== `undefined`) module.exports = { createWorktree };
