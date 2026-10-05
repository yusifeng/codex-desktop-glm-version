export type AnnotationSurfaceRecord = { id: string; customRendering: boolean };
export type AnnotationSurfacePendingHit = {
  element: any; registrationId: string; requestId: string;
  point: { x: number; y: number };
  surfaceRect: { x: number; y: number; width: number; height: number };
  timer: ReturnType<typeof setTimeout>; finish: (value: unknown) => void;
};

/** Owns surface registrations, probe/request bookkeeping, and terminal disposal. */
function createAnnotationSurfaceRegistryState() {
  const surfaces = new Map<any, AnnotationSurfaceRecord>();
  const probed = new WeakSet<object>();
  let requestCounter = 0;
  let pending: AnnotationSurfacePendingHit | null = null;
  let disposed = false;
  return {
    hasSurface(element: any) { return !disposed && surfaces.has(element); },
    getSurface(element: any) { return disposed ? undefined : surfaces.get(element); },
    setSurface(element: any, record: AnnotationSurfaceRecord) { if (disposed) return undefined; const previous = surfaces.get(element); surfaces.set(element, record); return previous; },
    deleteSurface(element: any) { return disposed ? false : surfaces.delete(element); },
    surfaceEntries() { return disposed ? [] : surfaces.entries(); },
    surfaceCount() { return disposed ? 0 : surfaces.size; },
    wasProbed(element: object) { return disposed || probed.has(element); },
    markProbed(element: object) { if (!disposed) probed.add(element); },
    nextRequestId(prefix: string) { return disposed ? undefined : `${prefix}-${++requestCounter}`; },
    get pending() { return pending; },
    set pending(value: AnnotationSurfacePendingHit | null) { if (!disposed) pending = value; },
    dispose() { if (disposed) return false; disposed = true; surfaces.clear(); pending = null; return true; },
    get disposed() { return disposed; },
  };
}

export { createAnnotationSurfaceRegistryState };
if (typeof module !== `undefined`) module.exports = { createAnnotationSurfaceRegistryState };
