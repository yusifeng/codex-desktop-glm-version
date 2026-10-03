const operationSources = new Set([
  `async_task_starting_state_dropdown`, `commit_modal`, `composer_branch_switcher`,
  `composer_worktree_source`, `create_pull_request_modal`, `local_conversation_git_actions`,
]);
const mutatingRequestKinds = new Set([
  `checkout-branch`, `create-branch`, `git-checkout-branch`, `git-create-branch`, `git-init-repo`,
]);

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

export { buildGitHostCacheKey, createGitCommandStats, exitCodeBucket, isGitMutationRequest, recordUntrackedCacheOutcome };
if (typeof module !== `undefined`) module.exports = { buildGitHostCacheKey, createGitCommandStats, exitCodeBucket, isGitMutationRequest, recordUntrackedCacheOutcome };
