import {
  completeTurnDiffCapture,
  startTurnDiffCapture,
} from "./git-turn-diff-request-handlers";

type TurnDiffDispatchDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  isRepoWatched: (root: string) => boolean;
  startCapture: (args: any) => Promise<any>;
  completeCapture: (args: any) => Promise<any>;
};

async function dispatchTurnDiffRequest(
  method: string,
  params: any,
  deps: TurnDiffDispatchDependencies,
) {
  if (method === `turn-diff-capture-start`) {
    return {
      handled: true,
      result: await startTurnDiffCapture(params, deps),
    };
  }
  if (method === `turn-diff-capture-complete`) {
    return {
      handled: true,
      result: await completeTurnDiffCapture(params, deps),
    };
  }
  return { handled: false, result: undefined };
}

export { dispatchTurnDiffRequest };
if (typeof module !== `undefined`)
  module.exports = { dispatchTurnDiffRequest };
