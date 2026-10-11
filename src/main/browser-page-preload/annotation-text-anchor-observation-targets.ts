type AnnotationTextAnchorObservationTargetDependencies = {
  collectFrameWindows: (framePath: any) => Iterable<any>;
  resolveFrameWindow: (framePath: any) => any;
  resolveTextTarget: (frameWindow: any, textLocator: any) => any;
  resolveFallbackRoot: (frameWindow: any, textLocator: any) => any;
  isShadowRoot: (value: any) => boolean;
  getShadowHost: (value: any) => any;
  getParentNode: (value: any) => any;
  getParentElement: (value: any) => any;
  getRootNode: (value: any) => any;
  isElement: (value: any) => boolean;
  getDocumentElement: (frameWindow: any) => any;
};

/** Build the DOM/frame targets needed to observe live text anchors. */
function collectAnnotationTextAnchorObservationTargets(
  anchors: any[],
  dependencies: AnnotationTextAnchorObservationTargetDependencies,
) {
  const inputTargets = new Set<any>();
  const scrollTargets = new Set<any>();
  const frameWindows = new Set<any>();
  const mutationTargets = new Set<any>();
  const mutationAncestors = new Set<any>();
  let hasUnresolved = false;

  for (const anchor of anchors) {
    for (const frameWindow of dependencies.collectFrameWindows(anchor.framePath)) {
      frameWindows.add(frameWindow);
      const documentElement = dependencies.getDocumentElement(frameWindow);
      if (documentElement != null) mutationTargets.add(documentElement);
    }

    const frameWindow = dependencies.resolveFrameWindow(anchor.framePath);
    if (frameWindow == null) {
      hasUnresolved = true;
      continue;
    }

    const target = dependencies.resolveTextTarget(frameWindow, anchor.textLocator);
    if (target == null) {
      hasUnresolved = true;
      const fallbackRoot = dependencies.resolveFallbackRoot(frameWindow, anchor.textLocator);
      if (fallbackRoot != null) {
        mutationTargets.add(fallbackRoot);
        if (dependencies.isShadowRoot(fallbackRoot)) frameWindows.add(fallbackRoot);
      }
      continue;
    }

    inputTargets.add(target);
    mutationTargets.add(target);
    if (dependencies.isShadowRoot(target)) frameWindows.add(target);

    let parent = dependencies.getParentNode(target) ?? dependencies.getShadowHost(target);
    while (parent != null) {
      if (dependencies.isShadowRoot(parent)) {
        mutationTargets.add(parent);
        frameWindows.add(parent);
      } else {
        mutationAncestors.add(parent);
      }
      parent = dependencies.getParentNode(parent) ?? dependencies.getShadowHost(parent);
    }

    let scrollTarget = dependencies.isElement(target)
      ? target
      : dependencies.getShadowHost(target);
    while (scrollTarget != null) {
      scrollTargets.add(scrollTarget);
      scrollTarget =
        dependencies.getParentElement(scrollTarget) ??
        dependencies.getShadowHost(dependencies.getRootNode(scrollTarget));
    }
  }

  return {
    inputTargets,
    scrollTargets,
    frameWindows,
    mutationTargets,
    mutationAncestors,
    hasUnresolved,
  };
}

export { collectAnnotationTextAnchorObservationTargets };
if (typeof module !== `undefined`) module.exports = { collectAnnotationTextAnchorObservationTargets };
