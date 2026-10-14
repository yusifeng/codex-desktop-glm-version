/** Registers controller cleanup effects without changing their original hook ordering. */
function useAnnotationControllerDisposalLifecycle(useEffect: any, controllers: any[]) {
  for (const controller of controllers) {
    useEffect(() => () => controller.dispose(), [controller]);
  }
}

/** Owns the highlight controller update and related notifier disposal effects. */
function useAnnotationHighlightControllerLifecycle(deps: any) {
  const { useLayoutEffect, useEffect, resolvedAnchor, textHighlightController, suspensionNotifier,
    designModifierNotifier, selectionModifierNotifier } = deps;
  useLayoutEffect(() => {
    textHighlightController.update(resolvedAnchor);
    return () => textHighlightController.update(null);
  }, [resolvedAnchor, textHighlightController]);
  useEffect(() => () => textHighlightController.dispose(), [textHighlightController]);
  useEffect(() => () => suspensionNotifier.dispose(), [suspensionNotifier]);
  useEffect(() => () => designModifierNotifier.dispose(), [designModifierNotifier]);
  useEffect(() => () => selectionModifierNotifier.dispose(), [selectionModifierNotifier]);
}

/** Owns screenshot-ready publication and the original duplicate disposal registrations. */
function useAnnotationScreenshotReadyLifecycle(deps: any) {
  const { useEffectEvent, useEffect, bridge, annotationId, hasPreview, annotationViewportRect,
    markerViewportPoint, skipScreenshotCapture, screenshotReadyController } = deps;
  const publishReady = useEffectEvent((commentId: any) => {
    bridge.sendMessageToHost({
      type: `browser-sidebar-runtime-comment-screenshot-ready`,
      commentId,
      annotationViewportRect,
      markerViewportPoint,
      ...(skipScreenshotCapture ? { skipScreenshotCapture: true } : {}),
    });
  });
  useEffect(() => screenshotReadyController.update(annotationId, hasPreview, publishReady),
    [hasPreview, annotationId, publishReady, screenshotReadyController]);
  useEffect(() => () => screenshotReadyController.dispose(), [screenshotReadyController]);
  useEffect(() => () => screenshotReadyController.dispose(), [screenshotReadyController]);
}

/** Owns native-selection cleanup and interaction-layer pointer visibility. */
function useAnnotationInteractionVisibilityLifecycle(deps: any) {
  const { useLayoutEffect, nativeTextSelection, clearNativeTextSelection, document, interactionLayerId,
    interactionEnabled, HTMLDivElement } = deps;
  useLayoutEffect(() => {
    if (nativeTextSelection) return clearNativeTextSelection();
  }, [nativeTextSelection]);
  useLayoutEffect(() => {
    const element = document.getElementById(interactionLayerId);
    if (element instanceof HTMLDivElement) {
      element.style.pointerEvents = interactionEnabled ? `auto` : `none`;
      return () => {
        element.style.pointerEvents = `none`;
      };
    }
  }, [deps.rootHost, interactionEnabled]);
}

export {
  useAnnotationControllerDisposalLifecycle,
  useAnnotationHighlightControllerLifecycle,
  useAnnotationScreenshotReadyLifecycle,
  useAnnotationInteractionVisibilityLifecycle,
};
if (typeof module !== `undefined`) module.exports = {
  useAnnotationControllerDisposalLifecycle,
  useAnnotationHighlightControllerLifecycle,
  useAnnotationScreenshotReadyLifecycle,
  useAnnotationInteractionVisibilityLifecycle,
};
