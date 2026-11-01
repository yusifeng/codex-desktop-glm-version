type AutoResolutionInstallerDependencies = {
  environmentSetupStateKey: string;
  environmentSetupServerConfigsKey: string;
  isLocalHostId(hostId: unknown): boolean;
  normalizeThreadId(threadId: unknown): unknown;
  normalizeRequestId(requestId: unknown): unknown;
};

function isEnvironmentConfigReference(value: unknown) {
  if (value == null || typeof value !== "object") return false;
  const reference = value as Record<string, unknown>;
  return [reference.accountId, reference.userId, reference.configId].every(
    (field) => typeof field === "string" && field.length > 0,
  );
}

export function createEnvironmentConfigRequestUserInputAutoResolutionInstaller(
  dependencies: AutoResolutionInstallerDependencies,
) {
  return function installEnvironmentConfigRequestUserInputAutoResolution(
    connection: any,
    scopedState: { get(key: string): unknown },
  ) {
    if (!dependencies.isLocalHostId(connection.hostId)) return;
    connection.registerInternalServerRequestHandler({
      methods: ["item/tool/requestUserInput"],
      handler: (request: any) => {
        if (
          request.method !== "item/tool/requestUserInput" ||
          request.params.isBlocking === true ||
          request.params.autoResolutionMs != null
        ) {
          return null;
        }
        const setupState = scopedState.get(dependencies.environmentSetupStateKey);
        const configs =
          setupState != null && typeof setupState === "object"
            ? (setupState as Record<string, unknown>)[dependencies.environmentSetupServerConfigsKey]
            : null;
        const threadConfig =
          configs != null && typeof configs === "object"
            ? (configs as Record<string, unknown>)[request.params.threadId]
            : null;
        if (isEnvironmentConfigReference(threadConfig)) {
          connection.requestUserInputAutoResolution.snoozeRequest(
            dependencies.normalizeThreadId(request.params.threadId),
            dependencies.normalizeRequestId(request.id),
          );
        }
        return null;
      },
    });
  };
}
