// @ts-nocheck

/** Creates the host-aware GitHub request adapter used by renderer RPC. */
export function createGithubRequestClientFactory({ RequestClient }: Record<string, any>) {
  return function createGithubRequestClient(sendRequest: any, getHostConfig: any) {
    return new RequestClient(async (
      method: string,
      params: Record<string, any>,
      operationSource: unknown,
      signal: AbortSignal,
    ) => {
      const defaultHostConfig = getHostConfig();
      const hostIds = `repos` in params
        ? params.repos.map((repo: Record<string, any>) => repo.hostId)
        : [`account` in params ? params.account.hostId : params.hostId];
      const hostConfigs = new Map([[defaultHostConfig.id, defaultHostConfig]]);
      for (const hostId of hostIds) {
        const hostConfig = getHostConfig(hostId);
        hostConfigs.set(hostConfig.id, hostConfig);
      }
      return sendRequest({
        method: `github-request`,
        params: {
          request: { method, params },
          hostConfig: defaultHostConfig,
          hostConfigs: [...hostConfigs.values()],
          operationSource,
        },
        signal,
      });
    });
  };
}

if (typeof module !== "undefined") {
  module.exports = { createGithubRequestClientFactory };
}
