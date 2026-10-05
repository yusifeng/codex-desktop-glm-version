/** Owns per-overlay-host element caches and their teardown lifecycle. */
function createAnnotationElementCacheRegistry() {
  const elementCaches = new WeakMap<object, Map<any, any>>();
  const cacheSets = new Set<Map<any, any>>();
  let disposed = false;

  const get = (rootHost: object) => {
    if (disposed) return new Map<any, any>();
    const existing = elementCaches.get(rootHost);
    if (existing != null) return existing;
    const cache = new Map<any, any>();
    elementCaches.set(rootHost, cache);
    cacheSets.add(cache);
    return cache;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const cache of cacheSets) cache.clear();
    cacheSets.clear();
  };

  return { get, dispose, get disposed() { return disposed; } };
}

export { createAnnotationElementCacheRegistry };
if (typeof module !== `undefined`) module.exports = { createAnnotationElementCacheRegistry };
