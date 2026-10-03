type CommitDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  environment: Record<string, string | undefined>;
  invalidateUntrackedPathsCache: (repository: any) => void;
  getUntrackedPaths: (repository: any) => Promise<any>;
  stageWorktree: (args: any) => Promise<any>;
  runGit: (root: string, args: string[], host: any, options: { signal: AbortSignal }) => Promise<any>;
  formatCommitMessage: (message: string, attribution: any) => string;
  formatCommitAttribution: (attribution: unknown) => any;
  formatExecOutput: (args: any) => any;
};

type CommitMessageDependencies = {
  escapeRegExp: (value: string) => string;
};

const DEFAULT_COMMIT_ATTRIBUTION = `Codex <noreply@openai.com>`;

function trimOptionalString(value: any) {
  return value == null ? value : value.trim() || null;
}

function formatCommitAttribution(value: any) {
  const attribution = trimOptionalString(value);
  return attribution === undefined ? DEFAULT_COMMIT_ATTRIBUTION : attribution;
}

function formatCoAuthorTrailer(attribution: string) {
  return `Co-authored-by: ${attribution}`;
}

function hasCommitTrailerLine(line: string) {
  return /^[A-Za-z][A-Za-z0-9-]*:\s+\S/.test(line);
}

function endsWithCommitTrailerBlock(message: string) {
  const lines = message.split(/\r?\n/);
  let index = lines.length - 1;
  let foundTrailer = false;
  while (index >= 0 && lines[index]?.trim() !== ``) {
    if (!hasCommitTrailerLine(lines[index])) return false;
    foundTrailer = true;
    index--;
  }
  return foundTrailer;
}

function hasCommitAttribution(
  message: string,
  trailer: string,
  dependencies: CommitMessageDependencies,
) {
  return RegExp(`^${dependencies.escapeRegExp(trailer)}$`, `gim`).test(message);
}

function formatCommitMessage(
  message: string,
  attribution: string | null | undefined,
  dependencies: CommitMessageDependencies,
) {
  if (!attribution) return message;
  const trailer = formatCoAuthorTrailer(attribution);
  if (hasCommitAttribution(message, trailer, dependencies)) return message;
  const trimmedMessage = message.trimEnd();
  if (!trimmedMessage) return trailer;
  return `${trimmedMessage}${
    endsWithCommitTrailerBlock(trimmedMessage) ? `\n` : `\n\n`
  }${trailer}`;
}

function commandFailure(execution: any, fallback: string, deps: CommitDependencies) {
  const error = execution.stderr || execution.stdout || fallback;
  return {
    error,
    execOutput: deps.formatExecOutput({
      command: execution.command,
      stdout: execution.stdout,
      stderr: execution.stderr,
      fallbackOutput: error,
    }),
  };
}

async function commitGitChanges(params: any, deps: CommitDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  if (repository != null) deps.invalidateUntrackedPathsCache(repository);
  const root = repository?.root ?? String(params.cwd);
  let refreshRoot: string | null = null;

  if (params.includeUnstaged) {
    const staged = repository != null
      ? await deps.stageWorktree({
          gitRoot: repository.root,
          env: deps.host.isLocal ? deps.environment : {},
          signal: deps.signal,
          host: deps.host,
          untrackedPathsPromise: deps.getUntrackedPaths(repository),
        })
      : await deps.runGit(root, [`add`, `-A`], deps.host, { signal: deps.signal });
    if (!staged.success) {
      const failure = commandFailure(staged, `Failed to stage changes`, deps);
      return { result: { status: `error`, ...failure }, refreshRoot: null };
    }
    refreshRoot = params.cwd;
  }

  const committed = await deps.runGit(
    root,
    [`commit`, `-m`, deps.formatCommitMessage(params.message, deps.formatCommitAttribution(params.commitAttribution))],
    deps.host,
    { signal: deps.signal },
  );
  if (!committed.success) {
    const failure = commandFailure(committed, `Failed to commit changes`, deps);
    const cachedDiff = await deps.runGit(root, [`diff`, `--cached`, `--quiet`, `--exit-code`], deps.host, { signal: deps.signal });
    return {
      result: {
        status: `error`,
        ...failure,
        errorType: cachedDiff.success ? `nothing-to-commit` : undefined,
      },
      refreshRoot,
    };
  }

  const revision = await deps.runGit(root, [`rev-parse`, `HEAD`], deps.host, { signal: deps.signal });
  return {
    result: { status: `success`, commitSha: revision.success ? revision.stdout : null },
    refreshRoot: params.cwd,
  };
}

export {
  DEFAULT_COMMIT_ATTRIBUTION,
  commitGitChanges,
  endsWithCommitTrailerBlock,
  formatCoAuthorTrailer,
  formatCommitAttribution,
  formatCommitMessage,
  hasCommitAttribution,
  hasCommitTrailerLine,
  trimOptionalString,
};
if (typeof module !== `undefined`)
  module.exports = {
    DEFAULT_COMMIT_ATTRIBUTION,
    commitGitChanges,
    endsWithCommitTrailerBlock,
    formatCoAuthorTrailer,
    formatCommitAttribution,
    formatCommitMessage,
    hasCommitAttribution,
    hasCommitTrailerLine,
    trimOptionalString,
  };
