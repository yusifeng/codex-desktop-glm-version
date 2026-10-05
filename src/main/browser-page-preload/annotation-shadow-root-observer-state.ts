/** Owns observed shadow-root membership and terminal teardown for the observer. */
function createAnnotationShadowRootObserverState(root: any) {
  const roots = new Set<any>([root]);
  let disposed = false;
  return {
    roots,
    get disposed() { return disposed; },
    add(value: any) {
      if (disposed || roots.has(value)) return false;
      roots.add(value);
      return true;
    },
    remove(value: any) { return roots.delete(value); },
    dispose() {
      if (disposed) return false;
      disposed = true;
      roots.clear();
      return true;
    },
  };
}

export { createAnnotationShadowRootObserverState };
if (typeof module !== `undefined`) module.exports = { createAnnotationShadowRootObserverState };
