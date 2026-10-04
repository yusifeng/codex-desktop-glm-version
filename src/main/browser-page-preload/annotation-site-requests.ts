type AnnotationOpenRequestCandidate = {
  target: any;
  resolvedTarget: any;
  request: any;
  metadata?: any;
  validationInput?: any;
};

type AnnotationSiteRequestsDependencies = {
  documentRef: any;
  windowRef: any;
  navigatorRef: any;
  getState: () => any;
  requestPermission: () => boolean | Promise<boolean>;
  prepareRequest: (event: any, state: any) => AnnotationOpenRequestCandidate | null;
  resolveRequest?: (candidate: AnnotationOpenRequestCandidate, state: any) => { resolvedTarget: any; metadata?: any } | null;
};
type AnnotationSiteRequestListener =
  (target: any, resolvedTarget: any, request: any, metadata?: any) => unknown;

/** Coordinates open-annotation events, permission races, and teardown-safe subscriptions. */
function createAnnotationSiteRequests(deps: AnnotationSiteRequestsDependencies) {
  let subscriber: AnnotationSiteRequestListener | null = null;
  let pending: any = null;
  let dispatching = false;
  let pageHidden = false;
  let disposed = false;

  const clear = () => {
    pending = null;
  };

  const dispatch = (candidate: AnnotationOpenRequestCandidate) => {
    if (subscriber == null || pageHidden || disposed) return false;
    const resolved = deps.resolveRequest == null
      ? { resolvedTarget: candidate.resolvedTarget, metadata: candidate.metadata }
      : deps.resolveRequest(candidate, deps.getState());
    if (resolved == null) return false;
    dispatching = true;
    try {
      return subscriber(
        candidate.target,
        resolved.resolvedTarget,
        candidate.request,
        resolved.metadata,
      );
    } finally {
      dispatching = false;
    }
  };

  const onOpen = (event: any) => {
    if (
      disposed ||
      pageHidden ||
      pending != null ||
      dispatching ||
      deps.navigatorRef.userActivation?.isActive !== true
    ) return;
    const candidate = deps.prepareRequest(event, deps.getState());
    if (candidate == null) return;
    pending = candidate;
    const permission = deps.requestPermission();
    if (typeof permission === `boolean`) {
      candidate.request.permissionGranted = permission;
      if (!permission) {
        clear();
        return;
      }
      if (subscriber != null && (clear(), !dispatch(candidate))) return;
      event.preventDefault();
      return;
    }
    event.preventDefault();
    permission.then(
      (allowed) => {
        if (pending !== candidate || disposed || pageHidden) return;
        if (!allowed) {
          clear();
          return;
        }
        candidate.request.permissionGranted = true;
        if (subscriber != null) {
          clear();
          dispatch(candidate);
        }
      },
      () => {
        if (pending === candidate) clear();
      },
    );
  };

  const onPageHide = (event: any) => {
    if (!event.isTrusted) return;
    pageHidden = true;
    clear();
    if (!event.persisted) dispose();
  };
  const onPageShow = (event: any) => {
    if (event.isTrusted) pageHidden = false;
  };
  const onKeyDown = (event: any) => {
    if (event.isTrusted && event.key === `Escape`) clear();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clear();
    subscriber = null;
    deps.documentRef.removeEventListener(`codex:open-annotation`, onOpen);
    deps.windowRef.removeEventListener(`pagehide`, onPageHide);
    deps.windowRef.removeEventListener(`pageshow`, onPageShow);
    deps.windowRef.removeEventListener(`keydown`, onKeyDown, true);
  };

  deps.documentRef.addEventListener(`codex:open-annotation`, onOpen);
  deps.windowRef.addEventListener(`pagehide`, onPageHide);
  deps.windowRef.addEventListener(`pageshow`, onPageShow);
  deps.windowRef.addEventListener(`keydown`, onKeyDown, true);

  return {
    subscribe(listener: AnnotationSiteRequestListener) {
      if (!disposed) {
        subscriber = listener;
        const candidate = pending;
        if (candidate?.request?.permissionGranted) {
          queueMicrotask(() => {
            if (subscriber === listener && pending === candidate && !disposed) {
              clear();
              dispatch(candidate);
            }
          });
        }
      }
      return () => {
        if (subscriber === listener) {
          subscriber = null;
          clear();
        }
      };
    },
    clear,
    dispose,
  };
}

export { createAnnotationSiteRequests };
if (typeof module !== `undefined`) module.exports = { createAnnotationSiteRequests };
