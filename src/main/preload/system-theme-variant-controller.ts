type SystemThemeVariantControllerDependencies = {
  getDocumentElement: () => { dataset: { theme?: string } } | null;
  observeDocument: (onReady: () => void) => () => void;
};

/** Owns preload theme state, document readiness observation, listener fan-out, and cleanup. */
function createSystemThemeVariantController(
  initialVariant: string,
  dependencies: SystemThemeVariantControllerDependencies,
) {
  let variant = initialVariant;
  let stopObservation: (() => void) | null = null;
  const listeners = new Set<() => void>();
  const apply = () => {
    const element = dependencies.getDocumentElement();
    if (element != null) {
      element.dataset.theme = variant;
      stopObservation?.();
      stopObservation = null;
      return true;
    }
    if (stopObservation == null) stopObservation = dependencies.observeDocument(apply);
    return false;
  };
  apply();
  const update = (nextVariant: string) => {
    variant = nextVariant;
    apply();
    listeners.forEach((listener) => listener());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const get = () => variant;
  const dispose = () => {
    stopObservation?.();
    stopObservation = null;
    listeners.clear();
  };
  return { get, update, subscribe, dispose };
}

export { createSystemThemeVariantController };
if (typeof module !== `undefined`) module.exports = { createSystemThemeVariantController };
