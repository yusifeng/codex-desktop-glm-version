const operationSources = new Set([
  `async_task_starting_state_dropdown`, `commit_modal`, `composer_branch_switcher`,
  `composer_worktree_source`, `create_pull_request_modal`, `local_conversation_git_actions`,
]);
const mutatingRequestKinds = new Set([
  `checkout-branch`, `create-branch`, `git-checkout-branch`, `git-create-branch`, `git-init-repo`,
]);
const gitHubOperations = new Set([
  `auth.status`, `auth.token`, `pr.checks`, `pr.close`, `pr.comment`, `pr.create`, `pr.diff`,
  `pr.edit`, `pr.list`, `pr.merge`, `pr.ready`, `pr.reopen`, `pr.review`, `pr.view`,
]);
const sshOptionsWithArguments = new Set([`-B`, `-b`, `-c`, `-D`, `-E`, `-e`, `-F`, `-I`, `-i`, `-J`, `-L`, `-l`, `-m`, `-O`, `-o`, `-p`, `-P`, `-Q`, `-R`, `-S`, `-W`, `-w`]);

function createGitCommandStats(concurrentOperationCount: number) {
  return {
    canceledCommandCount: 0, closed: false, commandCount: 0, commandDurationMsMax: 0,
    commandDurationMsSum: 0, concurrentOperationCount, diffCommandCount: 0,
    failedCommandCount: 0, slowestFailedCommand: null, outputLimitExceededCount: 0,
    peakCommandConcurrency: 0, statusCommandCount: 0, stderrBytes: 0, stdoutBytes: 0,
    timedOutCommandCount: 0, untrackedCacheCoalescedCount: 0, untrackedCacheHitCount: 0,
    untrackedCacheMissCount: 0, untrackedListCommandCount: 0, untrackedStatusCommandCount: 0,
  };
}

function isGitMutationRequest({ requestKind, source }: { requestKind?: string | null; source?: string | null }): boolean {
  return mutatingRequestKinds.has(requestKind ?? ``) || operationSources.has(source ?? ``);
}

function buildGitHostCacheKey(host: Record<string, unknown>): string {
  const config = host.hostConfig as Record<string, unknown>;
  return JSON.stringify([host.id, config.kind, config.codex_cli_command, config.terminal_command,
    config.websocket_url, config.env_id, config.host_name, config.environment_kind, config.os,
    config.arch, config.app_server_version, config.online, config.distro]);
}

function exitCodeBucket(exitCode: number | null): string | null {
  switch (exitCode) {
    case null: return null;
    case 1: return `1`;
    case 2: return `2`;
    case 128: return `128`;
    case 129: return `129`;
    default: return `other`;
  }
}

function recordUntrackedCacheOutcome(attribution: { closed?: boolean; untrackedCacheCoalescedCount: number; untrackedCacheHitCount: number; untrackedCacheMissCount: number } | null | undefined, outcome: string): void {
  if (attribution == null || attribution.closed) return;
  if (outcome === `coalesced`) attribution.untrackedCacheCoalescedCount += 1;
  else if (outcome === `hit`) attribution.untrackedCacheHitCount += 1;
  else if (outcome === `miss`) attribution.untrackedCacheMissCount += 1;
}

/** Classifies a subprocess executable for process telemetry. */
function classifyProcessExecutable(command: string | null | undefined): string {
  if (command == null) return `other`;
  const posixBasename = command.split(`/`).at(-1)?.toLowerCase() ?? ``;
  const windowsBasename = command.split(`\\`).at(-1)?.toLowerCase() ?? ``;
  const basename = posixBasename.length <= windowsBasename.length ? posixBasename : windowsBasename;
  const name = basename.replace(/\.(?:bat|cmd|com|exe)$/u, ``);
  if (/^python(?:3(?:\.\d+)*)?$/u.test(name)) return `python`;
  switch (name) {
    case `bash`:
    case `cmd`:
    case `powershell`:
    case `pwsh`:
    case `sh`:
    case `zsh`:
      return `shell`;
    case `codex`:
    case `gh`:
    case `node`:
    case `rg`:
    case `ssh`:
    case `tar`:
    case `tectonic`:
    case `wsl`:
      return name;
    default:
      return `other`;
  }
}

/** Maps GitHub CLI arguments to the bounded process.operation telemetry values. */
function classifyGitHubOperation(args: string[], processKind: string): string | undefined {
  let command: string | undefined;
  let subcommand: string | undefined;
  if (processKind === `gh`) [command, subcommand] = args.slice(1, 3);
  else if (processKind === `shell` && (args[1] === `-c` || args[1] === `-lc`)) {
    const match = /^gh(?:\s+([a-z-]+))?(?:\s+([a-z-]+))?(?:\s|$)/u.exec(args[2] ?? ``);
    if (match == null) return undefined;
    [, command, subcommand] = match;
  } else return undefined;
  if (command === `--version` || command === `version`) return `version`;
  if (command === `api`) return subcommand === `graphql` ? `api.graphql` : `api.rest`;
  const operation = `${command}.${subcommand}`;
  return gitHubOperations.has(operation) ? operation : `other`;
}

/** Classifies SSH command intent while ignoring option arguments and the `--` separator. */
function classifySshOperation(args: string[]): `config` | `control` | `port_forward` | `remote_command` | `connection` {
  const options = args.slice(1);
  let config = false;
  let control = false;
  let portForward = false;
  let positionalCount = 0;
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option == null) continue;
    if (option === `--`) {
      positionalCount += options.length - index - 1;
      break;
    }
    if (option === `-G`) config = true;
    if (/^-O(?:.|$)/u.test(option)) control = true;
    if (/^-(?:D|L|R|W)(?:.|$)/u.test(option) || /^-o(?:DynamicForward|LocalForward|RemoteForward)=/iu.test(option) || (option === `-o` && /^(?:DynamicForward|LocalForward|RemoteForward)(?:=|\s)/iu.test(options[index + 1] ?? ``))) portForward = true;
    if (sshOptionsWithArguments.has(option)) {
      index += 1;
      continue;
    }
    if (!option.startsWith(`-`)) {
      positionalCount += 1;
      if (positionalCount > 1) break;
    }
  }
  return config ? `config` : control ? `control` : portForward ? `port_forward` : positionalCount > 1 ? `remote_command` : `connection`;
}

/** Builds the stable telemetry envelope for a non-Git subprocess. */
function createProcessTelemetryEvent(processKind: string, operation?: string, operationIsGitHub = false): { attributes: Record<string, string>; op: `process.exec`; name: `subprocess` } {
  return {
    attributes: {
      [`process.kind`]: operationIsGitHub ? `gh` : processKind,
      ...(operation == null ? {} : { [`process.operation`]: operation }),
    },
    op: `process.exec`,
    name: `subprocess`,
  };
}

export { buildGitHostCacheKey, classifyGitHubOperation, classifyProcessExecutable, classifySshOperation, createGitCommandStats, createProcessTelemetryEvent, exitCodeBucket, isGitMutationRequest, recordUntrackedCacheOutcome };
if (typeof module !== `undefined`) module.exports = { buildGitHostCacheKey, classifyGitHubOperation, classifyProcessExecutable, classifySshOperation, createGitCommandStats, createProcessTelemetryEvent, exitCodeBucket, isGitMutationRequest, recordUntrackedCacheOutcome };
