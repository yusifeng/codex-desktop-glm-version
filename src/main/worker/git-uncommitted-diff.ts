type UncommittedDiffDependencies = {
  copyIndex: (temporaryDirectory: string, index: any, host: any) => Promise<string>;
  createTemporaryDirectory: (
    host: any,
    prefix: string,
    signal: AbortSignal | undefined,
  ) => Promise<string>;
  getIndexContext: (repository: any, signal: AbortSignal | undefined) => Promise<any>;
  logger: {
    error: (message: string, detail: any) => void;
    warning: (message: string, detail: any) => void;
  };
  parseGitError: (result: any) => any;
  runDiff: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
};

function serializeGitProcessResult(result: any) {
  return {
    command: result.command,
    success: result.success,
    code: result.code,
    stdout: result.stdout,
    stderr: result.stderr,
    outputLimitExceeded: result.outputLimitExceeded,
  };
}

async function collectTrackedUncommittedDiff(
  repository: any,
  configOverrides: string[] = [],
  signal: AbortSignal | undefined,
  { binary = false }: { binary?: boolean } = {},
  dependencies: UncommittedDiffDependencies,
) {
  const index = await dependencies.getIndexContext(repository, signal);
  if (!index) return { type: `error`, error: { type: `unknown` } };

  let temporaryDirectory: string | null = null;
  try {
    temporaryDirectory = await dependencies.createTemporaryDirectory(
      repository.host,
      `codex-git-index-`,
      signal,
    );
    const environment = {
      GIT_INDEX_FILE: await dependencies.copyIndex(
        temporaryDirectory,
        index,
        repository.host,
      ),
    };
    const stageResult = await dependencies.runGit(
      repository.root,
      [`add`, `-u`],
      repository.host,
      { configOverrides, env: environment, signal },
    );
    if (!stageResult.success) {
      dependencies.logger.warning(`Failed to stage uncommitted diff`, {
        safe: {},
        sensitive: { ...serializeGitProcessResult(stageResult) },
      });
      return { type: `error`, error: { type: `unknown` } };
    }
    const diffResult = await dependencies.runDiff(
      repository.root,
      [`--cached`],
      repository.host,
      {
        binary,
        trim: false,
        allowedNonZeroExitCodes: [0, 1],
        env: environment,
        signal,
      },
    );
    if (diffResult.outputLimitExceeded || !diffResult.success) {
      dependencies.logger.warning(`Failed to collect uncommitted diff`, {
        safe: {},
        sensitive: { ...serializeGitProcessResult(diffResult) },
      });
      return { type: `error`, error: dependencies.parseGitError(diffResult) };
    }
    return {
      type: `success`,
      unifiedDiff: diffResult.stdout,
      unifiedDiffBytes: diffResult.stdoutBytes,
    };
  } catch (error) {
    dependencies.logger.error(`failed to collect tracked uncommitted diff`, {
      safe: {},
      sensitive: { error },
    });
    return { type: `error`, error: { type: `unknown` } };
  } finally {
    if (temporaryDirectory)
      await repository.host.remove(temporaryDirectory, {
        recursive: true,
        force: true,
      });
  }
}

export { collectTrackedUncommittedDiff, serializeGitProcessResult };
if (typeof module !== `undefined`)
  module.exports = { collectTrackedUncommittedDiff, serializeGitProcessResult };
