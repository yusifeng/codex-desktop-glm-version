type PushDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  normalizeRoot: (cwd: string) => string;
  getDefaultRemoteBranch: (repository: any) => Promise<{ remote?: string | null } | null | undefined>;
  getRemotes: (repository: any) => Promise<string[]>;
  runGit: (cwd: string, args: string[], host: any, options: { signal: AbortSignal }) => Promise<any>;
  formatCommand: (args: string[]) => string;
  formatExecOutput: (args: any) => any;
};

function extractPushStatus(line: string): string | null {
  const values: string[] = [];
  const bracketed = line.match(/\[([^\]]+)\]/);
  if (bracketed) values.push(bracketed[1]);
  const parenthesized = line.match(/\(([^)]+)\)\s*$/);
  if (parenthesized) values.push(parenthesized[1]);
  const error = line.match(/^error[: ]+(.+)$/i);
  if (error) values.push(error[1]);
  return values.length === 0 ? null : values.join(` `).toLowerCase();
}

function isPushStatusLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (lower.startsWith(`ok `) || lower.startsWith(`error`)) return true;
  return [`!`, `=`, `+`, `-`, `*`, `?`].includes(line[0]);
}

function classifyGitPushFailure(stdout: string, stderr: string) {
  const statusLines: string[] = [];
  for (const lineValue of stdout.split(`\n`)) {
    const line = lineValue.trim();
    if (line && isPushStatusLine(line)) statusLines.push(line);
  }
  for (const line of statusLines) {
    const status = extractPushStatus(line);
    if (!status) continue;
    if (status.includes(`non-fast-forward`) || status.includes(`fetch first`) || status.includes(`stale info`)) return `remote-updated`;
    if (status.includes(`remote rejected`) || status.includes(`remote failure`) || status.includes(`pre-receive hook declined`)) return `remote-rejected`;
  }
  const error = stderr.toLowerCase();
  if (error.includes(`no upstream`) || error.includes(`set the remote as upstream`) || error.includes(`has no upstream branch`)) return `no-upstream`;
  if (error.includes(`authentication failed`) || error.includes(`could not read username`) || error.includes(`permission denied`) || error.includes(`access denied`)) return `auth`;
  return `unknown`;
}

async function pushGitRepository(params: any, deps: PushDependencies) {
  const args = [`push`, `--porcelain`];
  if (params.force) args.push(`--force-with-lease`);
  if (params.setUpstream) args.push(`-u`);
  const cwd = params.cwd.trim();
  if (!cwd) {
    return {
      result: {
        status: `error`,
        error: `unknown`,
        execOutput: { command: deps.formatCommand([`git`, ...args]), output: `No workspace available for push` },
      },
      refreshRoot: null,
    };
  }

  let remote = ``;
  const repository = await deps.gitManager.getWorktreeRepository(deps.normalizeRoot(cwd), deps.host);
  if (repository != null) {
    remote = (await deps.getDefaultRemoteBranch(repository))?.remote ?? ``;
    remote ||= (await deps.getRemotes(repository))[0] ?? ``;
  }
  if (!remote) {
    return {
      result: {
        status: `error`,
        error: `unknown`,
        execOutput: { command: deps.formatCommand([`git`, ...args]), output: `No git remote configured for push` },
      },
      refreshRoot: null,
    };
  }

  args.push(remote);
  const refspec = params.refspec?.trim();
  if (refspec) args.push(refspec);
  const execution = await deps.runGit(cwd, args, deps.host, { signal: deps.signal });
  if (!execution.success) {
    const fallbackOutput = execution.stderr || execution.stdout || `Failed to push changes`;
    return {
      result: {
        status: `error`,
        error: classifyGitPushFailure(execution.stdout, execution.stderr),
        execOutput: deps.formatExecOutput({ command: execution.command, stdout: execution.stdout, stderr: execution.stderr, fallbackOutput }),
      },
      refreshRoot: null,
    };
  }
  return {
    result: { status: `success`, remote, refspec: refspec ?? null },
    refreshRoot: deps.normalizeRoot(params.cwd),
  };
}

export { classifyGitPushFailure, pushGitRepository };
if (typeof module !== `undefined`) module.exports = { classifyGitPushFailure, pushGitRepository };
