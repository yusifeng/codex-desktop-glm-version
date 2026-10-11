type AnnotationHoverSyncContext = {
  modeAllowsHover: boolean;
  hasOpenEditor: boolean;
};

type AnnotationHoverSyncDependencies = {
  getPointer: () => { x: number; y: number } | null;
  updatePointer: (pointer: { x: number; y: number } | null, enabled: boolean) => boolean;
  clearDomHover: () => void;
  isDomHover: (pointer: { x: number; y: number }) => boolean;
  setPointer: (pointer: { x: number; y: number } | null) => void;
  clearHoverState: () => void;
  setHoverState: (value: unknown) => void;
  resolveElement: (pointer: { x: number; y: number }, canUseSiteAnnotationApi: boolean) => unknown;
  resolveHover: (element: unknown, canUseTweaks: boolean) => unknown;
  hasDesignComments: (comments: unknown) => boolean;
};

/** Moves syncHover's pointer/DOM/overlay coordination behind injected runtime owners. */
function createAnnotationHoverSyncController(dependencies: AnnotationHoverSyncDependencies) {
  let disposed = false;

  const sync = (message: any, context: AnnotationHoverSyncContext) => {
    if (disposed) return false;
    if (
      message.interactionMode !== `comment` ||
      message.isAnnotationSuspended === true ||
      !context.modeAllowsHover ||
      context.hasOpenEditor
    ) {
      return false;
    }

    const pointer = dependencies.getPointer();
    if (dependencies.updatePointer(pointer, message.canUseSiteAnnotationApi === true)) {
      dependencies.clearDomHover();
      return true;
    }
    if (
      pointer != null &&
      message.isDesignModifierPressed !== true &&
      dependencies.isDomHover(pointer)
    ) {
      dependencies.setPointer(pointer);
      dependencies.clearHoverState();
      return true;
    }

    const canUseTweaks =
      message.canUseTweaks !== false &&
      (message.isDesignModifierPressed === true ||
        (dependencies.hasDesignComments(message.comments) && message.annotationEditorMode === `design`));
    const element =
      pointer == null
        ? null
        : dependencies.resolveElement(pointer, message.canUseSiteAnnotationApi === true);
    dependencies.setPointer(pointer);
    dependencies.setHoverState(dependencies.resolveHover(element, canUseTweaks));
    return true;
  };

  const dispose = () => {
    disposed = true;
  };

  return { sync, dispose };
}

export { createAnnotationHoverSyncController };
if (typeof module !== `undefined`) module.exports = { createAnnotationHoverSyncController };
