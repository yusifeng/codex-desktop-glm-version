type CoreRequestDispatchDependencies = {
  signal: AbortSignal;
  checkAvailability: (signal: AbortSignal) => Promise<boolean>;
  createBranch: (params: any, signal: AbortSignal) => Promise<unknown>;
  discoverOrigins: (dirs: string[]) => Promise<{ origins: unknown[] }>;
};

async function dispatchGitCoreRequest(
  method: string,
  params: any,
  deps: CoreRequestDispatchDependencies,
) {
  switch (method) {
    case `availability`:
      return { handled: true, result: { available: await deps.checkAvailability(deps.signal) } };
    case `create-branch`:
      return { handled: true, result: await deps.createBranch(params, deps.signal) };
    case `git-origins`:
      return { handled: true, result: await deps.discoverOrigins(params.dirs) };
    default:
      return { handled: false, result: undefined };
  }
}

export { dispatchGitCoreRequest };
if (typeof module !== `undefined`)
  module.exports = { dispatchGitCoreRequest };
