type SurfaceRecord = { id: string; customRendering: boolean };
type PendingHit = {
  element: any;
  registrationId: string;
  requestId: string;
  point: { x: number; y: number };
  surfaceRect: { x: number; y: number; width: number; height: number };
  timer: ReturnType<typeof setTimeout>;
  finish: (value: unknown) => void;
};

type AnnotationSurfaceRegistryDependencies = {
  documentRef: any;
  windowRef: any;
  mutationObserverConstructor: new (callback: () => void) => { disconnect(): void; observe(target: object, options: object): void };
  responseEvent: string;
  requestEvent: string;
  maxPayloadLength: number;
  deadlineMs: number;
  isValidSurface: (element: any) => boolean;
  getElementAtPoint: (point: { x: number; y: number }) => any;
  parseResponse: (detail: unknown) => any;
  createRequestId: () => string;
  clipRect: (element: any, rect: { x: number; y: number; width: number; height: number }) => any;
  normalizeName: (value: unknown) => string | undefined;
  normalizeRole: (value: unknown) => string | undefined;
  sanitizeMetadata: (value: unknown) => Record<string, unknown> | undefined;
  dispatchRequest: (target: any, payload: Record<string, unknown>) => void;
  isResponseEvent: (event: any) => boolean;
  onInvalidated: (element: any) => void;
  onRenderingFailed?: (element: any) => void;
};

function createAnnotationSurfaceRegistry(deps: AnnotationSurfaceRegistryDependencies) {
  const surfaces = new Map<any, SurfaceRecord>();
  const probed = new WeakSet<object>();
  let disposed = false;
  let requestCounter = 0;
  let pending: PendingHit | null = null;
  const mutationObserver = new deps.mutationObserverConstructor(() => {
    for (const element of surfaces.keys()) {
      if (!deps.isValidSurface(element)) {
        surfaces.delete(element);
        if (pending?.element === element) cancel();
        deps.onInvalidated(element);
      }
    }
    if (surfaces.size === 0) mutationObserver.disconnect();
  });
  const hasSurface = (element: any) => surfaces.has(element);
  const probe = (element: any) => {
    if (disposed || !deps.isValidSurface(element)) return false;
    if (!surfaces.has(element) && !probed.has(element)) {
      probed.add(element);
      try { deps.dispatchRequest(element, { type: `probe` }); } finally {}
    }
    return surfaces.has(element);
  };
  const hitTest = (element: any, point: { x: number; y: number }) => {
    cancel();
    if (!probe(element) || !isPointWithinSurface(element, point)) return Promise.resolve(undefined);
    const registration = surfaces.get(element);
    if (registration == null) return Promise.resolve(undefined);
    const requestId = `${deps.createRequestId()}-${++requestCounter}`;
    return new Promise((resolve) => {
      pending = { element, registrationId: registration.id, requestId, point: { ...point }, surfaceRect: element.getBoundingClientRect(), timer: setTimeout(cancel, deps.deadlineMs), finish: resolve };
      deps.dispatchRequest(element, { type: `hit-test`, registrationId: registration.id, requestId, x: point.x, y: point.y });
    });
  };
  const renderSelection = (element: any, registrationId: string, selection: Record<string, unknown>) => {
    const registration = surfaces.get(element);
    if (disposed || !deps.isValidSurface(element) || registration?.id !== registrationId || !registration.customRendering) return false;
    deps.dispatchRequest(element, { type: `render`, registrationId, ...selection });
    return registration.customRendering;
  };
  const cancel = () => {
    if (pending == null) return;
    const current = pending;
    pending = null;
    clearTimeout(current.timer);
    current.finish(undefined);
    deps.dispatchRequest(deps.documentRef, { type: `cancel` });
  };
  const clear = () => { cancel(); if (!disposed) deps.dispatchRequest(deps.documentRef, { type: `clear` }); };
  const dispose = () => {
    cancel();
    disposed = true;
    mutationObserver.disconnect();
    surfaces.clear();
    deps.documentRef.removeEventListener(deps.responseEvent, onResponse);
  };
  const onResponse = (event: any) => {
    if (disposed || !deps.isResponseEvent(event) || typeof event.detail !== `string` || event.detail.length > deps.maxPayloadLength || !deps.isValidSurface(event.target)) return;
    const response = deps.parseResponse(event.detail);
    if (response == null) return;
    const element = event.target;
    if (response.type === `registered`) {
      const previous = surfaces.get(element);
      if (surfaces.size === 0) mutationObserver.observe(deps.documentRef, { childList: true, subtree: true });
      surfaces.set(element, { id: response.registrationId, customRendering: response.customRendering === true });
      if (previous?.id !== response.registrationId && pending?.element === element) cancel();
      if (previous?.id !== response.registrationId) deps.onInvalidated(element);
      return;
    }
    const registration = surfaces.get(element);
    if (registration?.id !== response.registrationId) return;
    if (response.type === `rendering-failed`) { registration.customRendering = false; deps.onRenderingFailed?.(element); return; }
    if (response.type === `invalidated` || response.type === `disposed`) {
      if (response.type === `disposed`) { surfaces.delete(element); if (surfaces.size === 0) mutationObserver.disconnect(); }
      pending?.element === element && cancel();
      deps.onInvalidated(element);
      return;
    }
    if (pending == null || pending.element !== element || pending.registrationId !== response.registrationId || pending.requestId !== response.requestId) return;
    const current = pending;
    pending = null;
    clearTimeout(current.timer);
    const rect = element.getBoundingClientRect();
    if (rect.x !== current.surfaceRect.x || rect.y !== current.surfaceRect.y || rect.width !== current.surfaceRect.width || rect.height !== current.surfaceRect.height || !isPointWithinSurface(element, current.point)) { current.finish(undefined); return; }
    if (response.hit == null) { current.finish(response.hit); return; }
    const hitRect = response.hit.rect == null ? undefined : deps.clipRect(element, response.hit.rect);
    if (response.hit.rect != null && hitRect == null) { current.finish(undefined); return; }
    current.finish({ registrationId: registration.id, id: response.hit.id, name: deps.normalizeName(response.hit.name), role: deps.normalizeRole(response.hit.role), metadata: deps.sanitizeMetadata(response.hit.metadata), rect: hitRect, customRendering: registration.customRendering });
  };
  const isPointWithinSurface = (element: any, point: { x: number; y: number }) => {
    const rect = deps.clipRect(element, element.getBoundingClientRect());
    return rect != null && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= rect.x && point.y >= rect.y && point.x <= rect.x + rect.width && point.y <= rect.y + rect.height && deps.getElementAtPoint(point) === element;
  };
  deps.documentRef.addEventListener(deps.responseEvent, onResponse);
  return { hasSurface, hitTest, renderSelection, cancel, clear, dispose };
}

export { createAnnotationSurfaceRegistry };
if (typeof module !== `undefined`) module.exports = { createAnnotationSurfaceRegistry };
