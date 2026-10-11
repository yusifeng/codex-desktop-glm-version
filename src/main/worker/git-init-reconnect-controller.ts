type GitInitReconnectDependencies = {
  isDisposed: () => boolean;
  initialDelayMs: number;
  maxDelayMs: number;
  nextDelay: (delayMs: number, maxDelayMs: number) => number;
  setTimeout: (callback: () => void, delayMs: number) => any;
  clearTimeout: (timer: any) => void;
  startSessions: (gitDirectoryPath: string, pathSeparator: string) => Promise<boolean>;
};

function createGitInitReconnectController(dependencies: GitInitReconnectDependencies) {
  let reconnectDelayMs = dependencies.initialDelayMs;
  let reconnectTimer: any = null;
  const schedule = (gitDirectoryPath: string, pathSeparator: string) => {
    if (dependencies.isDisposed() || reconnectTimer != null) return;
    const delayMs = reconnectDelayMs;
    reconnectDelayMs = dependencies.nextDelay(reconnectDelayMs, dependencies.maxDelayMs);
    reconnectTimer = dependencies.setTimeout(() => {
      reconnectTimer = null;
      dependencies.startSessions(gitDirectoryPath, pathSeparator).then((started) => {
        if (started) reconnectDelayMs = dependencies.initialDelayMs;
        else schedule(gitDirectoryPath, pathSeparator);
      });
    }, delayMs);
  };
  const dispose = () => {
    if (reconnectTimer != null) {
      dependencies.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
  return { schedule, dispose };
}

export { createGitInitReconnectController };
if (typeof module !== `undefined`) module.exports = { createGitInitReconnectController };
