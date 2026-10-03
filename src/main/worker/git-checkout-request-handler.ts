type CheckoutDependencies = {
  gitManager: any;
  host: any;
  signal?: AbortSignal;
  normalizeRoot: (cwd: string) => string;
  runGit: (cwd: string, args: string[], host: any, options?: any) => Promise<any>;
  formatExecOutput: (args: any) => any;
};

function parseCheckoutConflictPaths(output: string) {
  const lines = output.split(/\r?\n/);
  const header = /^(error:\s*)?.*\bwould be overwritten by checkout:\s*$/i;
  const conflictedPaths = new Set<string>();
  let collecting = false;
  let hasConflictHeader = false;
  for (const lineValue of lines) {
    const line = lineValue.replace(/\r$/, ``).trim();
    if (!collecting) {
      if (header.test(line)) {
        hasConflictHeader = true;
        collecting = true;
      }
      continue;
    }
    if (!line) continue;
    const lower = line.toLowerCase();
    if (lower.startsWith(`please `) || lower.startsWith(`error:`) || lower === `aborting`) break;
    conflictedPaths.add(line);
  }
  return { conflictedPaths: Array.from(conflictedPaths), hasConflictHeader };
}

function classifyCheckoutFailure(stdout: string, stderr: string) {
  const parsed = parseCheckoutConflictPaths([stderr, stdout].filter(Boolean).join(`\n`));
  return parsed.hasConflictHeader || parsed.conflictedPaths.length > 0
    ? { errorType: `blocked-by-working-tree-changes`, conflictedPaths: parsed.conflictedPaths }
    : { errorType: `unknown`, conflictedPaths: [] };
}

async function resolveCheckoutArgs(cwd: string, branch: string, deps: CheckoutDependencies) {
  if (!branch.startsWith(`-`) && (await deps.runGit(cwd, [`check-ref-format`, `refs/heads/${branch}`], deps.host, { signal: deps.signal })).success) {
    if ((await deps.runGit(cwd, [`show-ref`, `--verify`, `--quiet`, `refs/heads/${branch}`], deps.host, { signal: deps.signal })).success) {
      return { status: `success`, args: [`checkout`, branch] };
    }
    const remotes = await deps.runGit(cwd, [`for-each-ref`, `--count=2`, `--format=%(refname)`, `refs/remotes/*/${branch}`], deps.host, { signal: deps.signal });
    if (remotes.success) {
      const refs = remotes.stdout.split(`\n`).map((value: string) => value.trim()).filter(Boolean);
      if (refs.length === 1) return { status: `success`, args: [`checkout`, `--track`, `-b`, branch, refs[0]] };
      if (refs.length > 1) return { status: `error`, error: `Branch '${branch}' exists on multiple remotes`, errorType: `unknown` };
    }
  }
  const revision = await deps.runGit(cwd, [`rev-parse`, `--verify`, `--quiet`, `--end-of-options`, `${branch}^{commit}`], deps.host, { signal: deps.signal });
  const sha = revision.stdout.trim();
  if (revision.success && /^[0-9a-f]{40,64}$/.test(sha)) return { status: `success`, args: [`checkout`, `--detach`, sha] };
  const fallbackOutput = revision.stderr || revision.stdout || `Branch or ref '${branch}' was not found`;
  return {
    status: `error`,
    error: fallbackOutput,
    errorType: `unknown`,
    execOutput: deps.formatExecOutput({ command: revision.command, stdout: revision.stdout, stderr: revision.stderr, fallbackOutput }),
  };
}

async function rollbackStash(cwd: string, stashRollbackRef: string | null, deps: CheckoutDependencies) {
  if (stashRollbackRef == null) return null;
  const result = await deps.runGit(cwd, [`stash`, `pop`, stashRollbackRef], deps.host);
  return result.success ? null : result.stderr || result.stdout || `Failed to restore stashed changes`;
}

async function checkoutGitBranch(
  params: { cwd: string; branch: string; stashUncommitted?: boolean },
  deps: CheckoutDependencies,
  callbacks: { onCheckoutStatusChange?: (status: string) => void; onStashStatusChange?: (status: string) => void } = {},
) {
  const cwd = params.cwd.trim();
  if (!cwd) return { result: { status: `error`, error: `No workspace available for branch checkout`, errorType: `unknown` }, refreshRoot: null };
  const branch = params.branch.trim();
  if (!branch) return { result: { status: `error`, error: `Branch name is required`, errorType: `unknown` }, refreshRoot: null };
  const resolved = await resolveCheckoutArgs(cwd, branch, deps);
  if (resolved.status === `error`) return { result: resolved, refreshRoot: null };

  let stashRef: string | null = null;
  let stashRollbackRef: string | null = null;
  if (params.stashUncommitted) {
    callbacks.onStashStatusChange?.(`started`);
    const stash = await deps.runGit(cwd, [`stash`, `push`, `--include-untracked`, `-m`, `Stashed Codex worktree changes`], deps.host, { signal: deps.signal, trim: false });
    const skipped = stash.stdout.includes(`No local changes to save`) || stash.stderr.includes(`No local changes to save`);
    if (!skipped && !stash.success) {
      callbacks.onStashStatusChange?.(`failed`);
      const fallbackOutput = stash.stderr || stash.stdout || `Failed to stash changes`;
      return { result: { status: `error`, error: fallbackOutput, errorType: `failed-to-stash-changes`, execOutput: deps.formatExecOutput({ command: stash.command, stdout: stash.stdout, stderr: stash.stderr, fallbackOutput }) }, refreshRoot: null };
    }
    if (skipped) callbacks.onStashStatusChange?.(`skipped`);
    else {
      stashRollbackRef = `stash@{0}`;
      const revision = await deps.runGit(cwd, [`rev-parse`, `--verify`, `refs/stash`], deps.host, { signal: deps.signal });
      if (!revision.success || revision.stdout.length === 0) {
        callbacks.onStashStatusChange?.(`failed`);
        const fallback = revision.stderr || revision.stdout || `Failed to resolve stash reference`;
        const rollbackError = await rollbackStash(cwd, stashRollbackRef, deps);
        const error = rollbackError ? `${fallback}\n${rollbackError}` : fallback;
        return { result: { status: `error`, error, errorType: `failed-to-stash-changes`, execOutput: deps.formatExecOutput({ command: revision.command, stdout: revision.stdout, stderr: revision.stderr, fallbackOutput: error }) }, refreshRoot: null };
      }
      stashRef = revision.stdout;
      callbacks.onStashStatusChange?.(`completed`);
    }
  } else callbacks.onStashStatusChange?.(`skipped`);

  callbacks.onCheckoutStatusChange?.(`started`);
  const checkout = await deps.runGit(cwd, resolved.args, deps.host, { signal: deps.signal });
  if (!checkout.success) {
    callbacks.onCheckoutStatusChange?.(`failed`);
    const rollbackError = await rollbackStash(cwd, stashRollbackRef, deps);
    const fallback = checkout.stderr || checkout.stdout || `Failed to checkout branch`;
    const failure = classifyCheckoutFailure(checkout.stdout, checkout.stderr);
    const error = rollbackError ? `${fallback}\n${rollbackError}` : fallback;
    return {
      result: {
        status: `error`, error, errorType: failure.errorType,
        ...(failure.conflictedPaths.length > 0 ? { conflictedPaths: failure.conflictedPaths } : {}),
        execOutput: deps.formatExecOutput({ command: checkout.command, stdout: checkout.stdout, stderr: checkout.stderr, fallbackOutput: error }),
      },
      refreshRoot: null,
    };
  }
  deps.gitManager.invalidateGitReadCachesForRepoChange(`head`, deps.host);
  deps.gitManager.invalidateGitReadCachesForRepoChange(`working-tree`, deps.host);
  callbacks.onCheckoutStatusChange?.(`completed`);
  return { result: { status: `success`, branch, stashRef }, refreshRoot: deps.normalizeRoot(params.cwd) };
}

export { checkoutGitBranch, classifyCheckoutFailure, parseCheckoutConflictPaths, resolveCheckoutArgs };
if (typeof module !== `undefined`) module.exports = { checkoutGitBranch, classifyCheckoutFailure, parseCheckoutConflictPaths, resolveCheckoutArgs };
