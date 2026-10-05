import {
  resolveCommonDirRoot,
  resolveIndexFallbackRoot,
} from "./git-automation-writable-roots-policy";

type AutomationWritableRootsDependencies = {
  gitManager: any;
  host: any;
  getIndexPath: (repository: any) => Promise<string | null>;
  path: {
    isAbsolute: (value: string) => boolean;
    resolve: (...parts: string[]) => string;
    dirname: (value: string) => string;
    join: (...parts: string[]) => string;
  };
};

async function resolveAutomationWritableRoots(
  params: any,
  deps: AutomationWritableRootsDependencies,
) {
  const roots: string[] = [];
  const worktreeRepository = await deps.gitManager.getWorktreeRepository(
    params.worktreeCwd,
    deps.host,
  );
  const worktreeRoot = worktreeRepository?.root;
  if (worktreeRoot && worktreeRoot !== params.worktreeCwd)
    roots.push(worktreeRoot);

  const sourceRepository = await deps.gitManager.getWorktreeRepository(
    params.sourceCwd,
    deps.host,
  );
  const sourceRoot = sourceRepository?.root;
  if (
    sourceRoot &&
    sourceRoot !== params.worktreeCwd &&
    sourceRoot !== worktreeRoot
  )
    roots.push(sourceRoot);

  const commonDir = (
    await deps.gitManager.getRepoRepository(
      worktreeRepository?.root ?? params.sourceCwd,
      deps.host,
    )
  )?.getCommonDir();
  if (commonDir) {
    roots.push(resolveCommonDirRoot(commonDir, sourceRoot ?? params.sourceCwd, deps.path));
    return roots;
  }

  const repository = worktreeRepository ?? sourceRepository;
  const indexPath =
    repository == null ? null : await deps.getIndexPath(repository);
  const fallbackRoot = resolveIndexFallbackRoot(indexPath, sourceRoot, deps.path);
  if (fallbackRoot) roots.push(fallbackRoot);
  return roots;
}

export { resolveAutomationWritableRoots };
if (typeof module !== `undefined`)
  module.exports = { resolveAutomationWritableRoots };
