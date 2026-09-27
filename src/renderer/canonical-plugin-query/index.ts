import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface CanonicalPluginQueryOptions {
  enabled: boolean;
  queryKey: readonly ["plugins", "canonical-app", string | null, string];
  retry: false;
  staleTime: number;
}

function canonicalPluginQuery(appId: string, accountId: string | null): CanonicalPluginQueryOptions {
  return {
    queryKey: ["plugins", "canonical-app", accountId, appId],
    enabled: accountId != null,
    retry: false,
    staleTime: 300_000,
  };
}
function initializeCanonicalPluginQuery(): void {}
export { initializeCanonicalPluginQuery as n, canonicalPluginQuery as t };
