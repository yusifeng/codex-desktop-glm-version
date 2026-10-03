type ApplyRequestDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  applyChanges: (params: any) => Promise<any>;
  applyPatch: (params: any, gitManager: any, host: any, options: { signal: AbortSignal }) => Promise<any>;
  applyReviewSectionChanges: (params: any) => Promise<any>;
};

async function applyGitChanges(params: any, deps: ApplyRequestDependencies) {
  const result = await deps.applyChanges({
    ...params,
    gitManager: deps.gitManager,
    host: deps.host,
    signal: deps.signal,
  });
  return {
    result,
    refreshRoot: result.status === `command-error` ? null : params.destinationRoot,
  };
}

async function applyGitPatch(params: any, deps: ApplyRequestDependencies) {
  const result = await deps.applyPatch(params, deps.gitManager, deps.host, { signal: deps.signal });
  return {
    result,
    refreshRoot: result.status !== `error` || result.appliedPaths.length > 0 ? params.cwd : null,
  };
}

async function applyGitReviewSectionChanges(params: any, deps: ApplyRequestDependencies) {
  const result = await deps.applyReviewSectionChanges({
    ...params,
    gitManager: deps.gitManager,
    host: deps.host,
    signal: deps.signal,
  });
  return {
    result,
    refreshRoot: result.status !== `error` || result.appliedPaths.length > 0 ? params.cwd : null,
  };
}

export { applyGitChanges, applyGitPatch, applyGitReviewSectionChanges };
if (typeof module !== `undefined`) module.exports = { applyGitChanges, applyGitPatch, applyGitReviewSectionChanges };
