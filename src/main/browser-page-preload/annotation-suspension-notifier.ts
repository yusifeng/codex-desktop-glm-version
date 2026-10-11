type AnnotationSuspensionNotifierDependencies = {
  send: (suspended: boolean) => void;
};

/** Deduplicates annotation suspension host notifications while respecting mode guards. */
function createAnnotationSuspensionNotifier(dependencies: AnnotationSuspensionNotifierDependencies) {
  let lastSuspended: boolean | undefined;
  let disposed = false;
  const update = (interactionMode: string, suspended: boolean) => {
    if (disposed || interactionMode !== `comment` || lastSuspended === suspended) return false;
    lastSuspended = suspended;
    dependencies.send(suspended);
    return true;
  };
  const reset = () => {
    lastSuspended = undefined;
  };
  const dispose = () => {
    disposed = true;
  };
  return { update, reset, dispose };
}

export { createAnnotationSuspensionNotifier };
if (typeof module !== `undefined`) module.exports = { createAnnotationSuspensionNotifier };
