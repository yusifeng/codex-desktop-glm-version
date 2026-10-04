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
  let active = true;
  const disposeControls = deps.registerControls(() => active);
  if (disposeControls == null) return null;

  const installed = deps.installMainWorldListener((event) => {
    if (active) deps.recordUse(event);
  });

  return () => {
    active = false;
    if (installed) deps.removeMainWorldListener();
    disposeControls();
  };
}

export { createAnnotationModeController };
if (typeof module !== `undefined`) module.exports = { createAnnotationModeController };
