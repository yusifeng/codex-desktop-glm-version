type AnnotationPermissionControllerDependencies = {
  isPermissionGranted: () => boolean;
  createRequestId: () => string;
  invokeHost: (message: { type: string; requestId: string }) => Promise<unknown>;
};

function createAnnotationPermissionController(deps: AnnotationPermissionControllerDependencies) {
  let pending: { requestId: string; promise: Promise<boolean>; resolve: (allowed: boolean) => void } | null = null;

  const reset = () => {
    pending?.resolve(false);
    pending = null;
  };

  const handleResult = (requestId: string, allowed: boolean) => {
    if (pending?.requestId !== requestId) return false;
    pending.resolve(allowed);
    pending = null;
    return true;
  };

  const requestPermission = () => {
    if (deps.isPermissionGranted()) return true;
    if (pending != null) return pending.promise;

    let resolve!: (allowed: boolean) => void;
    const promise = new Promise<boolean>((complete) => {
      resolve = complete;
    });
    const request = { requestId: deps.createRequestId(), promise, resolve };
    pending = request;
    deps.invokeHost({
      type: `browser-sidebar-runtime-request-annotation-permission`,
      requestId: request.requestId,
    }).catch(() => {
      if (pending === request) {
        pending = null;
        request.resolve(false);
      }
    });
    return promise;
  };

  return { handleResult, requestPermission, reset };
}

export { createAnnotationPermissionController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPermissionController };
