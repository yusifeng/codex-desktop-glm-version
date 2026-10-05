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

import { classifyGitPushFailure } from './git-push-policy';

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
