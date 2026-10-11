type AnnotationSelectionModifierNotifierDependencies = {
  send: (pressed: boolean) => void;
};

/** Keeps selection-modifier IPC construction out of pointer callbacks without changing send frequency. */
function createAnnotationSelectionModifierNotifier(
  dependencies: AnnotationSelectionModifierNotifierDependencies,
) {
  let disposed = false;
  const notify = (pressed: boolean) => {
    if (disposed) return false;
    dependencies.send(pressed);
    return true;
  };
  const dispose = () => {
    disposed = true;
  };
  return { notify, dispose };
}

export { createAnnotationSelectionModifierNotifier };

if (typeof module !== `undefined`) module.exports = { createAnnotationSelectionModifierNotifier };
