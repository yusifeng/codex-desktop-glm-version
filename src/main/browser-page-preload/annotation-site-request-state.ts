/** Owns the terminal, page-visibility, and in-flight request state for site annotations. */
function createAnnotationSiteRequestState() {
  let pending: any = null;
  let pageHidden = false;
  let disposed = false;

  return {
    canBegin(userActive: boolean, dispatching: boolean) {
      return !disposed && !pageHidden && pending == null && !dispatching && userActive;
    },
    begin(candidate: any) {
      if (disposed || pageHidden || pending != null) return false;
      pending = candidate;
      return true;
    },
    isCurrent(candidate: any) {
      return !disposed && !pageHidden && pending === candidate;
    },
    get pending() {
      return pending;
    },
    clear(candidate?: any) {
      if (arguments.length === 0 || pending === candidate) pending = null;
    },
    hide() {
      if (disposed) return;
      pageHidden = true;
      pending = null;
    },
    show() {
      if (!disposed) pageHidden = false;
    },
    dispose() {
      if (disposed) return false;
      disposed = true;
      pageHidden = true;
      pending = null;
      return true;
    },
    get disposed() {
      return disposed;
    },
    get pageHidden() {
      return pageHidden;
    },
  };
}

export { createAnnotationSiteRequestState };
if (typeof module !== `undefined`) module.exports = { createAnnotationSiteRequestState };
