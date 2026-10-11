type OpenInTargetRequest = {
  target?: unknown;
  customTarget?: { command?: unknown } | null;
};

type TargetCommandRegistry = {
  getTargetCommand: (request: OpenInTargetRequest) => Promise<unknown>;
};

function getOpenInTargetCommandKey(request: OpenInTargetRequest) {
  return JSON.stringify([request.target, request.customTarget?.command]);
}

/** Deduplicates target detection while allowing a rejected probe to be retried. */
function createOpenInTargetCommandRegistry(
  detectTarget: (request: OpenInTargetRequest) => Promise<unknown>,
): TargetCommandRegistry {
  const commandPromises = new Map<string, Promise<unknown>>();
  return {
    getTargetCommand(request) {
      const key = getOpenInTargetCommandKey(request);
      const existing = commandPromises.get(key);
      if (existing != null) return existing;
      const promise = detectTarget(request);
      commandPromises.set(key, promise);
      promise.catch(() => {
        if (commandPromises.get(key) === promise) commandPromises.delete(key);
      });
      return promise;
    },
  };
}

export { createOpenInTargetCommandRegistry, getOpenInTargetCommandKey };
if (typeof module !== `undefined`)
  module.exports = { createOpenInTargetCommandRegistry, getOpenInTargetCommandKey };
