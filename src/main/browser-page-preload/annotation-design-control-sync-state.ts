/**
 * Owns the mutable generation state for annotation design-control previews.
 *
 * The synchronizer still decides what to dispatch to the page. This helper
 * only tracks weak target identity, the currently applied changes and the
 * terminal dispose boundary so those concerns cannot leak across sync calls.
 */
function createAnnotationDesignControlSyncState() {
  const targetByDesignId = new Map<string, WeakRef<object>>();
  let lastDesignId: string | null = null;
  let appliedByTarget = new Map<object, Map<string, any>>();
  let disposed = false;

  return {
    rememberTarget(designId: string, target: object) {
      if (disposed) return false;
      if (!targetByDesignId.has(designId)) targetByDesignId.set(designId, new WeakRef(target));
      lastDesignId = designId;
      return true;
    },
    getTarget(designId: string) {
      return disposed ? undefined : targetByDesignId.get(designId)?.deref();
    },
    pruneTargets(validIds: ReadonlySet<string>) {
      if (disposed) return;
      for (const id of targetByDesignId.keys()) {
        if (id !== lastDesignId && !validIds.has(id)) targetByDesignId.delete(id);
      }
    },
    get appliedByTarget() {
      return disposed ? new Map<object, Map<string, any>>() : appliedByTarget;
    },
    replaceApplied(next: Map<object, Map<string, any>>) {
      if (disposed) return new Map<object, Map<string, any>>();
      const previous = appliedByTarget;
      appliedByTarget = next;
      return previous;
    },
    clear() {
      const stale = appliedByTarget;
      appliedByTarget = new Map();
      targetByDesignId.clear();
      lastDesignId = null;
      return stale;
    },
    dispose() {
      if (disposed) return false;
      disposed = true;
      return true;
    },
    get disposed() { return disposed; },
  };
}

export { createAnnotationDesignControlSyncState };
if (typeof module !== `undefined`) module.exports = { createAnnotationDesignControlSyncState };
