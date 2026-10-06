import { isNonRepositoryError } from "./git-root-resolution-policy";
class GitMetadataResolutionError extends Error {}

type RootResolutionDependencies = {
  createGitUnavailableError: () => Error;
  isMissingPathError: (error: unknown) => boolean;
  logger: { debug: (message: string, detail: any) => void };
  normalizeCommonDir: (path: string) => string;
  normalizeRoot: (path: string) => string;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

async function checkLocalPath(cwd: string, host: any, dependencies: RootResolutionDependencies) {
  if (!host.isLocal) return true;
  try {
    await host.stat(cwd, { bypassCache: true });
    return true;
  } catch (error) {
    if (dependencies.isMissingPathError(error)) return false;
    throw error;
  }
}

async function resolveGitRoot(
  cwd: string,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: RootResolutionDependencies,
) {
  if (!(await checkLocalPath(cwd, host, dependencies))) return null;
  const result = await dependencies.runGit(
    cwd,
    [`rev-parse`, `--show-toplevel`],
    host,
    { allowedNonZeroExitCodes: [128], signal },
  );
  if (result.success && result.stdout) return dependencies.normalizeRoot(result.stdout);
  if (result.code === 128 && isNonRepositoryError(result.stderr)) return null;
  if (result.stderr === `Git is unavailable`) throw dependencies.createGitUnavailableError();
  dependencies.logger.debug(`[getGitRoot] failed to resolve git root`, {
    safe: {},
    sensitive: { stderr: result.stderr, stdout: result.stdout },
  });
  throw Error(
    `Failed to resolve git root: ${result.stderr || result.stdout || `Unknown error`}`,
  );
}

async function resolveGitRootAndCommonDir(
  cwd: string,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: RootResolutionDependencies,
) {
  if (!(await checkLocalPath(cwd, host, dependencies))) return null;
  const result = await dependencies.runGit(
    cwd,
    [`rev-parse`, `--path-format=absolute`, `--show-toplevel`, `--git-common-dir`],
    host,
    { allowedNonZeroExitCodes: [128], signal },
  );
  if (result.success && result.code === 0) {
    const lines = result.stdout.split(/\r?\n/);
    const root = lines[0];
    const commonDir = lines[1];
    if (
      lines.length !== 2 ||
      root == null ||
      root.length === 0 ||
      commonDir == null ||
      commonDir.length === 0
    )
      throw new GitMetadataResolutionError(
        `Failed to resolve git root and common dir: malformed output`,
      );
    if (!(await host.platformPath()).isAbsolute(commonDir))
      throw new GitMetadataResolutionError(
        `Failed to resolve git root and common dir: relative common dir output`,
      );
    return {
      commonDir: dependencies.normalizeCommonDir(commonDir),
      root: dependencies.normalizeRoot(root),
    };
  }
  if (result.code === 128 && isNonRepositoryError(result.stderr)) return null;
  if (result.stderr === `Git is unavailable`) throw dependencies.createGitUnavailableError();
  if (result.code === 129 || result.stderr.toLowerCase().includes(`unknown option`))
    throw new GitMetadataResolutionError(
      `Failed to resolve git root and common dir: ${
        result.stderr || result.stdout || `Unknown error`
      }`,
    );
  throw Error(
    `Failed to resolve git root and common dir: ${
      result.stderr || result.stdout || `Unknown error`
    }`,
  );
}

async function resolveGitCommonDir(
  cwd: string,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: RootResolutionDependencies,
) {
  if (host.isLocal)
    try {
      await host.stat(cwd, { bypassCache: true });
    } catch (error) {
      throw dependencies.isMissingPathError(error)
        ? Error(`ENOENT: path does not exist: ${cwd}`)
        : error;
    }
  const result = await dependencies.runGit(
    cwd,
    [`rev-parse`, `--git-common-dir`],
    host,
    { signal },
  );
  if (result.success && result.stdout) {
    const platformPath = await host.platformPath();
    return dependencies.normalizeCommonDir(
      platformPath.isAbsolute(result.stdout)
        ? result.stdout
        : platformPath.resolve(cwd, result.stdout),
    );
  }
  if (
    result.code === 128 &&
    result.stderr.toLowerCase().includes(`not a git repository`)
  )
    return null;
  throw Error(
    `Failed to resolve git common dir: ${
      result.stderr || result.stdout || `Unknown error`
    }`,
  );
}

export {
  GitMetadataResolutionError,
  isNonRepositoryError,
  resolveGitCommonDir,
  resolveGitRoot,
  resolveGitRootAndCommonDir,
};
if (typeof module !== `undefined`)
  module.exports = {
    GitMetadataResolutionError,
    isNonRepositoryError,
    resolveGitCommonDir,
    resolveGitRoot,
    resolveGitRootAndCommonDir,
  };
