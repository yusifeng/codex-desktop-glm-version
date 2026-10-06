type WorktreeCopyDependencies = {
  createSemaphore: (capacity: number) => {
    acquire: () => Promise<void>;
    release: () => void;
  };
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
};
import { splitGitWorktreeNullSeparatedPaths } from "./git-worktree-copy-path-policy";

const AGENTS_OVERRIDE_FILE = `AGENTS.override.md`;
const WORKTREE_INCLUDE_FILE = `.worktreeinclude`;
const WORKTREE_FILE_COPY_CONCURRENCY = 16;
const textEncoder = new TextEncoder();

function hasErrorCode(error: unknown, code: string) {
  return typeof error === `object` && error != null && `code` in error && error.code === code;
}

const splitNullSeparatedPaths = splitGitWorktreeNullSeparatedPaths;

async function ensureCopyTargetPath(
  worktreeRoot: string,
  targetDirectory: string,
  platformPath: any,
  host: any,
  label: string,
) {
  let currentPath = worktreeRoot;
  const relativeDirectory = platformPath.relative(worktreeRoot, targetDirectory);
  for (const segment of relativeDirectory.split(platformPath.sep).filter((value: string) => value !== ``)) {
    currentPath = platformPath.join(currentPath, segment);
    try {
      if ((await host.stat(currentPath, { followSymlinks: false })).isSymbolicLink())
        throw Error(`Cannot copy ${label} through a symlinked workspace path`);
    } catch (error) {
      if (!hasErrorCode(error, `ENOENT`)) throw error;
      await host.createDirectory(targetDirectory, { recursive: true });
      return;
    }
  }
}

async function copyWorktreeFileIfAbsent(
  sourcePath: string,
  targetPath: string,
  worktreeRoot: string,
  platformPath: any,
  label: string,
  host: any,
) {
  try {
    if (!(await host.stat(sourcePath, { followSymlinks: false })).isFile()) return false;
  } catch (error) {
    if (hasErrorCode(error, `ENOENT`)) return false;
    throw error;
  }
  await ensureCopyTargetPath(
    worktreeRoot,
    platformPath.dirname(targetPath),
    platformPath,
    host,
    label,
  );
  try {
    await host.copyFile(sourcePath, targetPath, { exclusive: true });
    return true;
  } catch (error) {
    if (hasErrorCode(error, `EEXIST`)) return false;
    throw error;
  }
}

async function copyWorktreeFiles({
  sourceGitRoot,
  worktreeGitRoot,
  relativePaths,
  label,
  host,
  onLog,
}: any, dependencies: Pick<WorktreeCopyDependencies, `createSemaphore`>) {
  if (relativePaths.length === 0) return 0;
  const platformPath = await host.platformPath();
  const semaphore = dependencies.createSemaphore(WORKTREE_FILE_COPY_CONCURRENCY);
  let copied = 0;
  await Promise.all(
    relativePaths.map(async (relativePath: string) => {
      await semaphore.acquire();
      try {
        if (
          await copyWorktreeFileIfAbsent(
            platformPath.join(sourceGitRoot, relativePath),
            platformPath.join(worktreeGitRoot, relativePath),
            worktreeGitRoot,
            platformPath,
            label,
            host,
          )
        )
          copied += 1;
      } finally {
        semaphore.release();
      }
    }),
  );
  if (copied > 0)
    onLog?.(
      `info`,
      textEncoder.encode(`Copied ${copied} file${copied === 1 ? `` : `s`} from ${label}\n`),
    );
  return copied;
}

async function findAgentOverrideFiles(
  sourceGitRoot: string,
  host: any,
  dependencies: Pick<WorktreeCopyDependencies, `runGit`>,
) {
  const result = await dependencies.runGit(
    sourceGitRoot,
    [
      `ls-files`,
      `--others`,
      `--ignored`,
      `--exclude-standard`,
      `-z`,
      `--`,
      `:(glob)**/${AGENTS_OVERRIDE_FILE}`,
    ],
    host,
    { trim: false },
  );
  if (!result.success) throw Error(`git ls-files failed while locating ${AGENTS_OVERRIDE_FILE}`);
  const paths = new Set<string>();
  for (const path of result.stdout.split(`\0`))
    if (path === AGENTS_OVERRIDE_FILE || path.endsWith(`/${AGENTS_OVERRIDE_FILE}`)) paths.add(path);
  return [...paths];
}

async function copyAgentOverrideFiles(
  sourceGitRoot: string,
  worktreeGitRoot: string,
  host: any,
  dependencies: WorktreeCopyDependencies,
) {
  await copyWorktreeFiles(
    {
      sourceGitRoot,
      worktreeGitRoot,
      relativePaths: await findAgentOverrideFiles(sourceGitRoot, host, dependencies),
      label: AGENTS_OVERRIDE_FILE,
      host,
    },
    dependencies,
  );
}

async function findWorktreeIncludeFiles(
  sourceGitRoot: string,
  host: any,
  dependencies: Pick<WorktreeCopyDependencies, `runGit`>,
) {
  const platformPath = await host.platformPath();
  const includePath = platformPath.join(sourceGitRoot, WORKTREE_INCLUDE_FILE);
  try {
    await host.stat(includePath);
  } catch (error) {
    if (hasErrorCode(error, `ENOENT`)) return [];
    throw error;
  }
  const [ignored, included] = await Promise.all([
    dependencies.runGit(
      sourceGitRoot,
      [`ls-files`, `--others`, `--ignored`, `--exclude-standard`, `-z`],
      host,
      { trim: false },
    ),
    dependencies.runGit(
      sourceGitRoot,
      [`ls-files`, `--others`, `--ignored`, `--exclude-from=${WORKTREE_INCLUDE_FILE}`, `-z`],
      host,
      { trim: false },
    ),
  ]);
  if (!ignored.success || !included.success)
    throw Error(`git ls-files failed while locating ${WORKTREE_INCLUDE_FILE} files`);
  const ignoredPaths = new Set(splitNullSeparatedPaths(ignored.stdout));
  return [...new Set(splitNullSeparatedPaths(included.stdout).filter((path) => ignoredPaths.has(path)))];
}

async function resolveWorktreeLocalEnvironmentConfig(
  {
    localEnvironmentConfigPath,
    sourceGitRoot,
    worktreeGitRoot,
    host,
    signal,
  }: any,
  dependencies: Pick<WorktreeCopyDependencies, `runGit`>,
) {
  const platformPath = await host.platformPath();
  const relativePath = platformPath.relative(sourceGitRoot, localEnvironmentConfigPath);
  const targetPath = platformPath.join(worktreeGitRoot, relativePath);
  const targetStat = await host.stat(targetPath, { followSymlinks: false }).catch((error: unknown) => {
    if (hasErrorCode(error, `ENOENT`)) return null;
    throw error;
  });
  if (targetStat != null) {
    if (!targetStat.isFile())
      throw Error(`Selected local environment configuration is not a regular file`);
    await ensureCopyTargetPath(
      worktreeGitRoot,
      platformPath.dirname(targetPath),
      platformPath,
      host,
      `selected local environment`,
    );
    return targetPath;
  }
  if (!host.isLocal) return localEnvironmentConfigPath;
  const tracked = await dependencies.runGit(
    sourceGitRoot,
    [`ls-files`, `--error-unmatch`, `--`, relativePath],
    host,
    { allowedNonZeroExitCodes: [1], signal },
  );
  if (!tracked.success) throw Error(`Failed to check selected environment tracking`);
  if (tracked.code === 0) return null;
  const sourceIgnored = await dependencies.runGit(
    sourceGitRoot,
    [`check-ignore`, `--quiet`, `--`, relativePath],
    host,
    { allowedNonZeroExitCodes: [1], signal },
  );
  if (!sourceIgnored.success) return localEnvironmentConfigPath;
  if (sourceIgnored.code === 0) {
    const targetIgnored = await dependencies.runGit(
      worktreeGitRoot,
      [`check-ignore`, `--quiet`, `--`, relativePath],
      host,
      { allowedNonZeroExitCodes: [1], signal },
    );
    if (!targetIgnored.success || targetIgnored.code !== 0) return localEnvironmentConfigPath;
  }
  await copyWorktreeFileIfAbsent(
    localEnvironmentConfigPath,
    targetPath,
    worktreeGitRoot,
    platformPath,
    `selected local environment`,
    host,
  );
  if (!(await host.stat(targetPath, { followSymlinks: false })).isFile())
    throw Error(`Selected local environment configuration is not a regular file`);
  return targetPath;
}

export {
  AGENTS_OVERRIDE_FILE,
  WORKTREE_FILE_COPY_CONCURRENCY,
  WORKTREE_INCLUDE_FILE,
  copyAgentOverrideFiles,
  copyWorktreeFileIfAbsent,
  copyWorktreeFiles,
  ensureCopyTargetPath,
  findAgentOverrideFiles,
  findWorktreeIncludeFiles,
  hasErrorCode,
  resolveWorktreeLocalEnvironmentConfig,
  splitNullSeparatedPaths,
};
if (typeof module !== `undefined`)
  module.exports = {
    AGENTS_OVERRIDE_FILE,
    WORKTREE_FILE_COPY_CONCURRENCY,
    WORKTREE_INCLUDE_FILE,
    copyAgentOverrideFiles,
    copyWorktreeFileIfAbsent,
    copyWorktreeFiles,
    ensureCopyTargetPath,
    findAgentOverrideFiles,
    findWorktreeIncludeFiles,
    hasErrorCode,
    resolveWorktreeLocalEnvironmentConfig,
    splitNullSeparatedPaths,
  };
