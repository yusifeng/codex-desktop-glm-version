type UpstreamRefreshDependencies = {
  classifyGitError: (stderr: string) => string;
  clearInterval: (timer: any) => void;
  getCurrentBranch: (repository: any) => Promise<string | null>;
  logger: {
    warning: (message: string, detail: any) => void;
  };
  now: () => number;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  setInterval: (callback: () => void, delay: number) => any;
};

const UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS = 15_000;
const MAX_PROGRESS_LINE_LENGTH = 1_024;
const GIT_PROGRESS_PATTERN =
  /^(?:remote:\s*)?(Enumerating objects|Counting objects|Compressing objects|Receiving objects|Resolving deltas):\s+(?:(\d{1,3})%\s+\((\d+)\/(\d+)\)|(\d+))(?:,.*)?$/;
const textEncoder = new TextEncoder();

function createGitProgressParser(onProgress: (bytes: Uint8Array) => void) {
  const decoder = new TextDecoder();
  let remainder = ``;
  let overflowed = false;
  let endedWithCarriageReturn = false;

  const emit = (line: string, ending: string) => {
    const match = GIT_PROGRESS_PATTERN.exec(line);
    if (match == null) return;
    const [, operation, percent, current, total, count] = match;
    const value = percent == null ? count : `${percent}% (${current}/${total})`;
    onProgress(textEncoder.encode(`${operation}: ${value}${ending}`));
    endedWithCarriageReturn = ending === `\r`;
  };

  const consume = (text: string) => {
    const parts = text.split(/(\r\n|\r|\n)/);
    for (let index = 0; index < parts.length; index += 2) {
      if (!overflowed) {
        remainder += parts[index] ?? ``;
        if (remainder.length > MAX_PROGRESS_LINE_LENGTH) {
          remainder = ``;
          overflowed = true;
        }
      }
      const ending = parts[index + 1];
      if (ending != null) {
        if (!overflowed) emit(remainder, ending === `\r` ? `\r` : `\n`);
        remainder = ``;
        overflowed = false;
      }
    }
  };

  return {
    write(bytes: Uint8Array) {
      consume(decoder.decode(bytes, { stream: true }));
    },
    finish() {
      consume(decoder.decode());
      if (!overflowed && remainder.length > 0) emit(remainder, `\n`);
      if (endedWithCarriageReturn) onProgress(textEncoder.encode(`\n`));
    },
  };
}

async function readCredentialConfigOverrides(
  repository: any,
  signal: AbortSignal | undefined,
  upstreamRefreshSignal: AbortSignal | undefined,
  dependencies: Pick<UpstreamRefreshDependencies, `runGit`>,
) {
  const results = await Promise.all(
    [`--system`, `--global`].map((scope) =>
      dependencies.runGit(
        repository.root,
        [`config`, scope, `--includes`, `--null`, `--get-regexp`, `^credential\\.`],
        repository.host,
        {
          allowedNonZeroExitCodes: [1],
          signal,
          trim: false,
          waitForExitOnAbortSignal: upstreamRefreshSignal,
        },
      ),
    ),
  );
  const overrides: string[] = [];
  for (const result of results)
    if (result.success)
      for (const entry of result.stdout.split(`\0`)) {
        const separator = entry.indexOf(`\n`);
        if (separator > 0)
          overrides.push(`-c`, `${entry.slice(0, separator)}=${entry.slice(separator + 1)}`);
      }
  return overrides;
}

function createWorktreeUpstreamRefresh(dependencies: UpstreamRefreshDependencies) {
  return async function refreshWorktreeUpstream({
    worktreeRepo,
    startingState,
    mode,
    onLog,
    signal,
    upstreamRefreshSignal,
  }: any) {
    if (mode === `never` || startingState.type !== `branch` || startingState.remoteRef != null)
      return;
    const branchName =
      startingState.branchName === `HEAD`
        ? await dependencies.getCurrentBranch(worktreeRepo)
        : startingState.branchName;
    if (branchName == null) return;
    const [remote, mergeRef] = await Promise.all([
      worktreeRepo.getConfigValue(`branch.${branchName}.remote`, signal),
      worktreeRepo.getConfigValue(`branch.${branchName}.merge`, signal),
    ]);
    if (remote == null || mergeRef == null || remote === `.`) return;
    const [remoteUrl, upstream, platformFamily, credentialOverrides] = await Promise.all([
      worktreeRepo.getConfigValue(`remote.${remote}.url`, signal),
      dependencies.runGit(
        worktreeRepo.root,
        [`for-each-ref`, `--format=%(upstream)`, `--count=1`, `refs/heads/${branchName}`],
        worktreeRepo.host,
        { signal },
      ),
      worktreeRepo.host.platformFamily(),
      readCredentialConfigOverrides(
        worktreeRepo,
        signal,
        upstreamRefreshSignal,
        dependencies,
      ),
    ]);
    if (signal?.aborted) return;
    if (upstreamRefreshSignal?.aborted) {
      onLog?.(`info`, textEncoder.encode(`[info] Continuing without updating\n`));
      return;
    }
    if (remoteUrl == null || !upstream.success || !upstream.stdout) return;
    onLog?.(`info`, textEncoder.encode(`[info] Refreshing upstream before creating worktree`));
    const startedAt = dependencies.now();
    let lastProgressAt = startedAt;
    let needsInitialLineBreak = onLog != null;
    const progress = onLog
      ? createGitProgressParser((bytes) => {
          if (needsInitialLineBreak) {
            onLog(`info`, textEncoder.encode(`\n`));
            needsInitialLineBreak = false;
          }
          lastProgressAt = dependencies.now();
          onLog(`stderr`, bytes);
        })
      : undefined;
    const timer = onLog
      ? dependencies.setInterval(() => {
          const currentTime = dependencies.now();
          if (
            !signal?.aborted &&
            currentTime - lastProgressAt >= UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS
          )
            onLog(
              `info`,
              textEncoder.encode(
                `\r[info] Refreshing upstream before creating worktree (${Math.floor((currentTime - startedAt) / 1_000)}s elapsed)`,
              ),
            );
        }, UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS)
      : undefined;
    const result = await dependencies
      .runGit(
        worktreeRepo.root,
        [
          `fetch`,
          `--progress`,
          `--no-tags`,
          `--no-recurse-submodules`,
          `--`,
          remoteUrl,
          `+${mergeRef}:${upstream.stdout}`,
        ],
        worktreeRepo.host,
        {
          configOverrides: [...credentialOverrides, `-c`, `protocol.file.allow=always`],
          env: {
            GIT_CONFIG: platformFamily === `windows` ? `NUL` : `/dev/null`,
            GIT_CONFIG_GLOBAL: platformFamily === `windows` ? `NUL` : `/dev/null`,
            GIT_CONFIG_NOSYSTEM: `1`,
            GIT_PROTOCOL_FROM_USER: `0`,
          },
          onStderrRaw: progress?.write,
          signal,
          waitForExitOnAbortSignal: upstreamRefreshSignal,
        },
      )
      .finally(() => {
        if (timer != null) dependencies.clearInterval(timer);
        progress?.finish();
        if (needsInitialLineBreak) onLog?.(`info`, textEncoder.encode(`\n`));
      });
    if (signal?.aborted) return;
    if (upstreamRefreshSignal?.aborted) {
      onLog?.(`info`, textEncoder.encode(`[info] Continuing without updating\n`));
      return;
    }
    if (result.success) {
      worktreeRepo.invalidateGitReadCachesForRepoChange(`remote-refs`);
      onLog?.(`info`, textEncoder.encode(`[info] Upstream refreshed\n`));
      return;
    }
    dependencies.logger.warning(`[worktree-create] upstream-refresh-failed`, {
      safe: { exitCode: result.code },
      sensitive: { branchName, remote, stderr: result.stderr },
    });
    onLog?.(
      `stderr`,
      textEncoder.encode(
        (dependencies.classifyGitError(result.stderr) === `authentication`
          ? `[warning] Git authentication failed; sign in again before retrying\n`
          : ``) + `[warning] Could not refresh upstream; using cached Git state\n`,
      ),
    );
  };
}

export {
  GIT_PROGRESS_PATTERN,
  MAX_PROGRESS_LINE_LENGTH,
  UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS,
  createGitProgressParser,
  createWorktreeUpstreamRefresh,
  readCredentialConfigOverrides,
};
if (typeof module !== `undefined`)
  module.exports = {
    GIT_PROGRESS_PATTERN,
    MAX_PROGRESS_LINE_LENGTH,
    UPSTREAM_REFRESH_PROGRESS_INTERVAL_MS,
    createGitProgressParser,
    createWorktreeUpstreamRefresh,
    readCredentialConfigOverrides,
  };
