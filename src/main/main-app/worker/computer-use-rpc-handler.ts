export function createComputerUseRpcHandler(deps: {
  invalidateManagedComputerUseService(processIdentifier: unknown): Promise<unknown>;
  ensureManagedComputerUseService(): unknown;
}) {
  return async (request: { method?: string; params?: { processIdentifier?: unknown } }) => {
    switch (request.method) {
      case `computer-use-invalidate-service-pid`:
        await deps.invalidateManagedComputerUseService(request.params?.processIdentifier);
        return {};
      case `computer-use-service-pid`:
        return deps.ensureManagedComputerUseService();
      case `ces-telemetry`:
        throw Error(`Unsupported computer-use worker request`);
      default:
        return undefined;
    }
  };
}

if (typeof module !== `undefined`) module.exports = { createComputerUseRpcHandler };
