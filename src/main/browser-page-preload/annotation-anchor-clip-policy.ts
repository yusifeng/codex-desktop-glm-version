type AnnotationClipRect = { x: number; y: number; width: number; height: number };

type AnnotationScrollClipPolicyDependencies = {
  resolveContainer: (selector: string) => any;
  isContainingBlock: (container: any) => boolean;
  getStyle: (container: any) => { overflow?: string; overflowX?: string; overflowY?: string };
  isClippingOverflow: (value: string) => boolean;
  getViewportRect: (container: any) => AnnotationClipRect;
};

/** Applies recorded scroll-container clipping to an already viewport-clipped anchor. */
function applyAnnotationScrollContainerClips(
  clip: AnnotationClipRect | null,
  descriptors: Array<{ selector: string }> | null | undefined,
  deps: AnnotationScrollClipPolicyDependencies,
): AnnotationClipRect | null {
  let result = clip;
  for (const descriptor of descriptors ?? []) {
    if (result == null) return null;
    const container = deps.resolveContainer(descriptor.selector);
    if (container == null || !deps.isContainingBlock(container)) continue;
    const style = deps.getStyle(container);
    const overflowX = style.overflowX || style.overflow || ``;
    const overflowY = style.overflowY || style.overflow || ``;
    const clipX = deps.isClippingOverflow(overflowX);
    const clipY = deps.isClippingOverflow(overflowY);
    if (!clipX && !clipY) continue;
    const viewport = deps.getViewportRect(container);
    const right = clipX ? Math.min(result.x + result.width, viewport.x + viewport.width) : result.x + result.width;
    const bottom = clipY ? Math.min(result.y + result.height, viewport.y + viewport.height) : result.y + result.height;
    const left = clipX ? Math.max(result.x, viewport.x) : result.x;
    const top = clipY ? Math.max(result.y, viewport.y) : result.y;
    if (right < left || bottom < top) return null;
    result = { x: left, y: top, width: right - left, height: bottom - top };
  }
  return result;
}

export { applyAnnotationScrollContainerClips };
if (typeof module !== `undefined`) module.exports = { applyAnnotationScrollContainerClips };
