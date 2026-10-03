type HandoffBranchDependencies = {
  runGit: (cwd: string, args: string[], host: any) => Promise<any>;
  formatBranchRef: (branch: string) => string;
  formatExecOutput: (input: any) => any;
  isObjectId: (value: string) => boolean;
};

async function inspectHandoffBranch(
  { branch, cwd, commitSha, host }: any,
  deps: HandoffBranchDependencies,
) {
  const branchRef = deps.formatBranchRef(branch);
  const exists = await deps.runGit(cwd, [`show-ref`, `--verify`, branchRef], host);
  if (!exists.success || exists.code !== 0) return { status: `missing` };
  const resolved = await deps.runGit(cwd, [`rev-parse`, branchRef], host);
  if (resolved.success && resolved.stdout.trim() === commitSha) return { status: `same-commit` };
  const message = `Branch ${branch} already exists at a different commit`;
  return {
    status: `different-commit`,
    message,
    execOutput: deps.formatExecOutput({
      command: resolved.command,
      stdout: resolved.stdout,
      stderr: resolved.stderr,
      fallbackOutput: message,
    }),
  };
}

async function ensureHandoffBranch(params: any, deps: HandoffBranchDependencies) {
  const state = await inspectHandoffBranch(params, deps);
  if (state.status === `same-commit`) return null;
  if (state.status === `different-commit`) {
    return { message: state.message, execOutput: state.execOutput };
  }
  const result = await deps.runGit(params.cwd, [`branch`, params.branch, params.commitSha], params.host);
  if (result.success) return null;
  const message = result.stderr || result.stdout || `Failed to create branch`;
  return {
    message,
    execOutput: deps.formatExecOutput({
      command: result.command,
      stdout: result.stdout,
      stderr: result.stderr,
      fallbackOutput: message,
    }),
  };
}

async function forceHandoffBranch(
  { branch, cwd, commitSha, host }: any,
  deps: HandoffBranchDependencies,
) {
  const result = await deps.runGit(cwd, [`branch`, `-f`, branch, commitSha], host);
  if (result.success) return null;
  const message = result.stderr || result.stdout || `Failed to update destination branch`;
  return {
    message,
    execOutput: deps.formatExecOutput({
      command: result.command,
      stdout: result.stdout,
      stderr: result.stderr,
      fallbackOutput: message,
    }),
  };
}

async function resolveHandoffStashReference(
  cwd: string,
  stashRef: string,
  host: any,
  deps: HandoffBranchDependencies,
) {
  if (!deps.isObjectId(stashRef)) return stashRef;
  const result = await deps.runGit(cwd, [`stash`, `list`, `--format=%H %gd`], host);
  if (!result.success || result.stdout.length === 0) return stashRef;
  return result.stdout
    .split(`\n`)
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .map((line: string) => line.split(/\s+/, 2))
    .find(([objectId]: string[]) => objectId === stashRef)?.[1] ?? stashRef;
}

async function applyHandoffStash(
  { cwd, stashRef, mode = `apply` }: any,
  host: any,
  deps: HandoffBranchDependencies,
) {
  const workspace = cwd.trim();
  if (!workspace) return { status: `error`, error: `No workspace available for stash apply` };
  const requestedRef = stashRef.trim();
  if (!requestedRef) return { status: `error`, error: `Stash reference is required` };
  const resolvedRef = await resolveHandoffStashReference(workspace, requestedRef, host, deps);
  const result = await deps.runGit(workspace, [`stash`, mode, resolvedRef], host);
  if (!result.success) {
    const error = result.stderr || result.stdout || `Failed to apply stash`;
    return {
      status: `error`,
      error,
      execOutput: deps.formatExecOutput({
        command: result.command,
        stdout: result.stdout,
        stderr: result.stderr,
        fallbackOutput: error,
      }),
    };
  }
  return { status: `success`, stashRef: requestedRef, mode };
}

export {
  applyHandoffStash,
  ensureHandoffBranch,
  forceHandoffBranch,
  inspectHandoffBranch,
  resolveHandoffStashReference,
};
if (typeof module !== `undefined`) module.exports = {
  applyHandoffStash,
  ensureHandoffBranch,
  forceHandoffBranch,
  inspectHandoffBranch,
  resolveHandoffStashReference,
};
