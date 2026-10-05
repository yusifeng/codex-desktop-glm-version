const maxTraceLinks = 4;

function isSampledTrace(trace: any) {
  const flags = Number.parseInt(trace.traceparent.slice(-2), 16);
  return Number.isFinite(flags) && flags % 2 === 1;
}

function appendTraceLink(links: any[], trace: any) {
  if (
    links.length < maxTraceLinks &&
    !links.some((link) => link.traceparent === trace.traceparent)
  )
    links.push(trace);
}

function mergeLiveQueryTrace(state: any, trace: any) {
  if (trace == null || state.trace?.traceparent === trace.traceparent) return;
  if (state.trace == null) state.trace = trace;
  else if (!isSampledTrace(state.trace) && isSampledTrace(trace)) {
    appendTraceLink(state.traceLinks, state.trace);
    state.trace = trace;
  } else appendTraceLink(state.traceLinks, trace);
}

function shouldRefreshLiveQuery(query: any, changeType: string) {
  switch (query.method) {
    case `status-summary`:
      switch (changeType) {
        case `config`:
        case `head`:
        case `index`:
        case `working-tree`:
          return true;
        case `remote-refs`:
        case `local-refs`:
        case `synced-branch`:
        case `worktree-topology`:
          return false;
      }
    case `review-summary`:
    case `branch-diff-stats`:
      switch (changeType) {
        case `config`:
        case `head`:
        case `index`:
        case `remote-refs`:
        case `working-tree`:
          return true;
        case `synced-branch`:
        case `local-refs`:
        case `worktree-topology`:
          return false;
      }
    case `recent-branches`:
      switch (changeType) {
        case `config`:
        case `head`:
        case `local-refs`:
        case `remote-refs`:
          return true;
        case `index`:
        case `synced-branch`:
        case `worktree-topology`:
        case `working-tree`:
          return false;
      }
    case `current-branch`:
      switch (changeType) {
        case `head`:
          return true;
        case `config`:
        case `index`:
        case `local-refs`:
        case `remote-refs`:
        case `synced-branch`:
        case `worktree-topology`:
        case `working-tree`:
          return false;
      }
    case `upstream-branch`:
      switch (changeType) {
        case `config`:
        case `head`:
          return true;
        case `index`:
        case `local-refs`:
        case `remote-refs`:
        case `synced-branch`:
        case `worktree-topology`:
        case `working-tree`:
          return false;
      }
    case `branch-ahead-count`:
    case `branch-commits`:
    case `default-branch`:
    case `base-branch`:
      switch (changeType) {
        case `config`:
        case `head`:
        case `remote-refs`:
          return true;
        case `index`:
        case `local-refs`:
        case `synced-branch`:
        case `worktree-topology`:
        case `working-tree`:
          return false;
      }
    case `list-worktrees`:
      switch (changeType) {
        case `head`:
        case `worktree-topology`:
          return true;
        case `config`:
        case `index`:
        case `local-refs`:
        case `remote-refs`:
        case `synced-branch`:
        case `working-tree`:
          return false;
      }
  }
}

/** Whether a shared-query wait needs an extra trace span/link projection. */
function shouldAttachSharedTrace(trace: any, sharedTrace: any, traceLinks: any[]): boolean {
  return trace != null && !(sharedTrace?.traceparent === trace.traceparent && traceLinks.length === 0);
}

export {
  appendTraceLink,
  isSampledTrace,
  mergeLiveQueryTrace,
  shouldRefreshLiveQuery,
  shouldAttachSharedTrace,
};
if (typeof module !== `undefined`)
  module.exports = {
    appendTraceLink,
    isSampledTrace,
    mergeLiveQueryTrace,
    shouldRefreshLiveQuery,
    shouldAttachSharedTrace,
  };
