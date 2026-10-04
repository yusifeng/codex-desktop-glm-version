type MotionElement = {
  getAnimations?: () => Array<{ playState: string }>;
  ownerDocument?: { defaultView?: unknown };
};

type MotionDependencies = {
  getParent: (element: MotionElement) => MotionElement | null;
  getFrameElement: (windowLike: unknown) => MotionElement | null;
  isElement: (value: unknown) => value is MotionElement;
};

/** Returns whether an annotation element or one of its containing frames is animating. */
function hasRunningAnnotationAnimation(
  element: MotionElement | null,
  dependencies: MotionDependencies,
): boolean {
  let current = element;
  while (current != null) {
    if (current.getAnimations?.().some((animation) => animation.playState === `running`)) return true;
    const parent = dependencies.getParent(current);
    if (parent != null) {
      current = parent;
      continue;
    }
    const frame = dependencies.getFrameElement(current.ownerDocument?.defaultView);
    current = dependencies.isElement(frame) ? frame : null;
  }
  return false;
}

export { hasRunningAnnotationAnimation };
if (typeof module !== `undefined`) module.exports = { hasRunningAnnotationAnimation };
