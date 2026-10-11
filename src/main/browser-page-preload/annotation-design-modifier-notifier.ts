type AnnotationDesignModifierNotifierDependencies = {
  send: (pressed: boolean) => void;
};

/** Deduplicates derived design-modifier host notifications until the runtime is disposed. */
function createAnnotationDesignModifierNotifier(
  dependencies: AnnotationDesignModifierNotifierDependencies,
) {
  let lastPressed = false;
  let disposed = false;
  const update = (pressed: boolean) => {
    if (disposed || lastPressed === pressed) return false;
    lastPressed = pressed;
    dependencies.send(pressed);
    return true;
  };
  const dispose = () => {
    disposed = true;
  };
  return { update, dispose };
}

export { createAnnotationDesignModifierNotifier };

if (typeof module !== `undefined`) module.exports = { createAnnotationDesignModifierNotifier };
