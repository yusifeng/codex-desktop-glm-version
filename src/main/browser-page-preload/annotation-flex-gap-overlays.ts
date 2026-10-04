/**
 * Projects flex-container children into the gap overlay shape used by the
 * annotation design runtime.  DOM lookup and computed-style access remain
 * injected so the policy can be exercised without a browser.
 */
export type AnnotationFlexGapOverlayDependencies = {
  getOwnerWindow: (element: any) => { getComputedStyle: (element: any) => any };
  isElement: (value: any) => boolean;
  getVisibleRect: (element: any) => any;
};

export function collectAnnotationFlexGapOverlays(
  property: string | null,
  editor: any,
  annotation: any,
  cache: Map<any, any>,
  deps: AnnotationFlexGapOverlayDependencies,
) {
  if (property == null || ![`gap`, `row-gap`, `column-gap`].includes(property)) return [];
  const target = editor?.anchor.type === `element`
    ? editor.anchor.element
    : annotation == null
      ? null
      : (cache.get(annotation.id) ?? null);
  if (target == null) return [];
  const targetStyle = deps.getOwnerWindow(target).getComputedStyle(target);
  if (targetStyle.display !== `flex` && targetStyle.display !== `inline-flex`) return [];
  const overlays = Array.from(target.children).flatMap((child: any, index: number) => {
    if (!deps.isElement(child)) return [];
    const style = deps.getOwnerWindow(child).getComputedStyle(child);
    if (style.position === `absolute` || style.position === `fixed`) return [];
    const rect = deps.getVisibleRect(child);
    return rect == null
      ? []
      : [{
          borderRadius: style.borderRadius.length === 0 ? `0px` : style.borderRadius,
          key: `${index}-${Math.round(rect.x)}-${Math.round(rect.y)}-${Math.round(rect.width)}-${Math.round(rect.height)}`,
          rect,
        }];
  });
  return overlays.length > 1 ? overlays : [];
}

if (typeof module !== `undefined`) module.exports = { collectAnnotationFlexGapOverlays };
