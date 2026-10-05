type AnnotationPermissionControllerDependencies = {
  isPermissionGranted: () => boolean;
  createRequestId: () => string;
  invokeHost: (message: { type: string; requestId: string }) => Promise<unknown>;
};

function createAnnotationPermissionController(deps: AnnotationPermissionControllerDependencies) {
  const state = createAnnotationPermissionRequestState();

  const reset = () => {
    state.clearPending()?.resolve(false);
  };

  const handleResult = (requestId: string, allowed: boolean) => {
    if (state.disposed) return false;
    if (state.pending?.requestId !== requestId) return false;
    state.clearPending()?.resolve(allowed);
    return true;
  };

  const requestPermission = () => {
    if (state.disposed) return false;
    if (deps.isPermissionGranted()) return true;
    if (state.pending != null) return state.pending.promise;

    let resolve!: (allowed: boolean) => void;
    const promise = new Promise<boolean>((complete) => {
      resolve = complete;
    });
    const request = { requestId: deps.createRequestId(), promise, resolve };
    state.setPending(request);
    deps.invokeHost({
      type: `browser-sidebar-runtime-request-annotation-permission`,
      requestId: request.requestId,
    }).catch(() => {
      if (state.pending === request) {
        state.clearPending();
        request.resolve(false);
      }
    });
    return promise;
  };

  const dispose = () => {
    if (state.disposed) return;
    reset();
    state.dispose();
  };

  return { handleResult, requestPermission, reset, dispose, get disposed() { return state.disposed; } };
}

export { createAnnotationPermissionController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPermissionController };
import { createAnnotationPermissionRequestState } from "./annotation-permission-request-state";
