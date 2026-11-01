import "@rchunk/rolldown-runtime";
import { $O as durations, ek as initializeQueryRuntime } from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

export interface CanonicalPluginQueryOptions {
  enabled: boolean;
  queryKey: readonly ["plugins", "canonical-app", string | null, string];
  queryFn(input: { signal?: AbortSignal }): Promise<unknown>;
  retry: false;
  staleTime: number;
}

const {
  G3t: getAdditionalHeaders,
  K3t: initializePluginQueries,
  pdn: initializeApiClient,
  q6t: canonicalPluginAppId,
  udn: apiClient,
} = appInitialChunk as unknown as {
  G3t(): Record<string, string>;
  K3t(): void;
  pdn(): void;
  q6t(appId: string): string;
  udn: {
    safeGet(path: string, options: Record<string, unknown>): Promise<unknown>;
  };
};

function canonicalPluginQuery(appId: string, accountId: string | null): CanonicalPluginQueryOptions {
  return {
    queryKey: ["plugins", "canonical-app", accountId, canonicalPluginAppId(appId)],
    enabled: accountId != null,
    queryFn: ({ signal }) => apiClient.safeGet(
      "/ps/plugins/canonical-app/{app_id}",
      {
        parameters: { path: { app_id: appId } },
        additionalHeaders: getAdditionalHeaders(),
        signal,
      },
    ),
    retry: false,
    staleTime: durations.FIVE_MINUTES,
  };
}
function initializeCanonicalPluginQuery(): void {
  initializePluginQueries();
  initializeQueryRuntime();
  initializeApiClient();
}
export { initializeCanonicalPluginQuery as n, canonicalPluginQuery as t };
