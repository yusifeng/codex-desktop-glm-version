/** Owns the single in-flight annotation permission request and terminal gate. */
function createAnnotationPermissionRequestState() {
  let pending: any = null;
  let disposed = false;
  return {
    get pending() { return pending; },
    get disposed() { return disposed; },
    setPending(value: any) { pending = value; },
    clearPending() { const value = pending; pending = null; return value; },
    dispose() {
      if (disposed) return false;
      disposed = true;
      pending = null;
      return true;
    },
  };
}
export { createAnnotationPermissionRequestState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPermissionRequestState };
