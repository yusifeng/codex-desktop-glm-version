type TurnDiffDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  isRepoWatched: (root: string) => boolean;
  startCapture: (args: any) => Promise<any>;
  completeCapture: (args: any) => Promise<any>;
};

async function startTurnDiffCapture(params: any, deps: TurnDiffDependencies) {
  return deps.startCapture({
    host: deps.host,
    baseTurnId: params.baseTurnId,
    checkpointKey: params.checkpointKey,
    cwd: params.cwd,
    gitManager: deps.gitManager,
    isRepoWatched: deps.isRepoWatched,
    signal: deps.signal,
    turnId: params.turnId,
  });
}

async function completeTurnDiffCapture(params: any, deps: TurnDiffDependencies) {
  return deps.completeCapture({
    host: deps.host,
    capture: params.capture,
    gitManager: deps.gitManager,
    retainCheckpoint: params.retainCheckpoint,
    signal: deps.signal,
  });
}

export { completeTurnDiffCapture, startTurnDiffCapture };
if (typeof module !== `undefined`) module.exports = { completeTurnDiffCapture, startTurnDiffCapture };
