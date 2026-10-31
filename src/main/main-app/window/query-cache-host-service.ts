// Per-window query-cache host service extracted from main-C-Mhak1n.ts (`BO`).

interface QueryCacheInvalidation {
  queryKey: unknown[];
}

interface QueryCacheHostServiceDependencies {
  HostServiceBase: new (client: unknown, context: unknown, timeoutMs: number) => {
    invalidateQueryCache(request: QueryCacheInvalidation): unknown;
  };
  invalidatePluginCache(appServerConnection: unknown): void;
}

const QUERY_CACHE_TIMEOUT_MS = 500;

/**
 * Creates the shared-client host service while keeping the app-server plugin
 * cache invalidator explicit. The returned class preserves the original
 * four-argument constructor used by WindowContext.
 */
function createQueryCacheHostServiceClass({
  HostServiceBase,
  invalidatePluginCache,
}: QueryCacheHostServiceDependencies) {
  return class QueryCacheHostService extends HostServiceBase {
    appServerConnection: unknown;
    invalidateHostQueryCache: (queryKey: unknown[]) => void;

    constructor(
      client: unknown,
      appServerConnection: unknown,
      context: unknown,
      invalidateHostQueryCache: (queryKey: unknown[]) => void,
    ) {
      super(client, context, QUERY_CACHE_TIMEOUT_MS);
      this.appServerConnection = appServerConnection;
      this.invalidateHostQueryCache = invalidateHostQueryCache;
    }

    invalidateQueryCache(request: QueryCacheInvalidation): unknown {
      this.invalidateHostQueryCache(request.queryKey);
      if (request.queryKey[0] === "plugins") invalidatePluginCache(this.appServerConnection);
      return super.invalidateQueryCache(request);
    }
  };
}

export { QUERY_CACHE_TIMEOUT_MS, createQueryCacheHostServiceClass };

if (typeof module !== "undefined") module.exports = { QUERY_CACHE_TIMEOUT_MS, createQueryCacheHostServiceClass };
