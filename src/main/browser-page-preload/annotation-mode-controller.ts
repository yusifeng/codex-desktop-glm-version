type AnnotationModeControllerDependencies = {
  isAvailable: () => boolean;
  isActive: () => boolean;
  recordUse: (event: unknown) => void;
  toggle: (force?: boolean) => boolean;
  registerControls: (active: () => boolean) => (() => void) | null;
  installMainWorldListener: (notify: (event: unknown) => void) => boolean;
  removeMainWorldListener: () => void;
};

/** Coordinates the page-facing annotation mode API and its main-world listener. */
function createAnnotationModeController(deps: AnnotationModeControllerDependencies) {
  const state = createAnnotationModeControllerState();
  const disposeControls = deps.registerControls(() => state.active);
  if (disposeControls == null) return null;

  const installed = deps.installMainWorldListener((event) => {
    if (!state.disposed && state.active) deps.recordUse(event);
  });

  return () => {
    if (!state.dispose()) return;
    if (installed) deps.removeMainWorldListener();
    disposeControls();
  };
}

export { createAnnotationModeController };
if (typeof module !== `undefined`) module.exports = { createAnnotationModeController };
import { createAnnotationModeControllerState } from "./annotation-mode-controller-state";
