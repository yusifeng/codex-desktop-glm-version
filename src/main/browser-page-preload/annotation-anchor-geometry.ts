type AnnotationRect = { x: number; y: number; width: number; height: number };
import { applyAnnotationScrollContainerClips } from './annotation-anchor-clip-policy';

type AnnotationAnchorGeometryDependencies = {
  getDefaultWindow: () => any;
  getDefaultDocument: () => any;
  resolveFrameWindow: (framePath: any[]) => any;
  resolveFrameElement: (documentLike: any, framePath: any[]) => any;
  getScrollOffset: (windowLike: any) => { x: number; y: number };
  getFrameWindow: (frameElement: any) => any;
  getParentElement: (element: any) => any;
  getComputedStyle: (windowLike: any, element: any) => any;
  isClippingOverflow: (value: string) => boolean;
  isElement: (value: any) => boolean;
  getElementRect: (element: any) => any;
  getElementOffsetWidth: (element: any) => number;
  getElementOffsetHeight: (element: any) => number;
  getElementClientLeft: (element: any) => number;
  getElementClientTop: (element: any) => number;
  getElementClientWidth: (element: any) => number;
  getElementClientHeight: (element: any) => number;
  getFrameElement: (windowLike: any) => any;
  getInnerWidth: (windowLike: any) => number;
  getInnerHeight: (windowLike: any) => number;
  getDocumentBody: (documentLike: any) => any;
  getDocumentElement: (documentLike: any) => any;
  getAnchorRect: (anchor: any) => AnnotationRect | null;
  getAnchorMarkerSize: (anchor: any, markerPoint: any, viewport: AnnotationRect) => any;
  getViewportState: () => any;
  getViewportOffset: (anchor: any, windowLike: any) => { x: number; y: number };
  getFrameOffset: (windowLike: any) => { x: number; y: number };
  getWindowScrollY: (windowLike: any) => number;
  clamp: (value: number, minimum: number, maximum: number) => number;
  getMarkerInset: () => number;
  getViewportOverride: (value: any, viewport: any) => any;
  getScaleRect: (rect: AnnotationRect, scale: number) => AnnotationRect;
  getFramePath: (anchor: any) => any[];
  getDocumentContext: (pageUrl: string, options: any) => any;
  getPageUrl: () => string;
  getCurrentDocumentTitle: () => string;
  getScrollContainers: (windowLike: any, point: any) => any[];
};

function createAnnotationAnchorGeometry(deps: AnnotationAnchorGeometryDependencies) {
  const intersect = (left: AnnotationRect, right: AnnotationRect, axes: { x: boolean; y: boolean }) => {
    const x = axes.x ? Math.max(left.x, right.x) : left.x;
    const y = axes.y ? Math.max(left.y, right.y) : left.y;
    const rightEdge = axes.x ? Math.min(left.x + left.width, right.x + right.width) : left.x + left.width;
    const bottomEdge = axes.y ? Math.min(left.y + left.height, right.y + right.height) : left.y + left.height;
    return rightEdge < x || bottomEdge < y
      ? null
      : { x, y, width: rightEdge - x, height: bottomEdge - y };
  };

  const elementContainingBlocks = (element: any, windowLike: any) => {
    const blocks = new Set<any>();
    let current = element;
    while (current != null) {
      const style = deps.getComputedStyle(windowLike, current);
      let parent = deps.getParentElement(current);
      if (style.position === `absolute` || style.position === `fixed`) {
        while (
          parent != null &&
          parent !== deps.getDocumentBody(windowLike.document) &&
          parent !== deps.getDocumentElement(windowLike.document) &&
          !establishesContainingBlock(deps.getComputedStyle(windowLike, parent), style.position)
        ) parent = deps.getParentElement(parent);
      }
      if (parent == null || parent === deps.getDocumentBody(windowLike.document) || parent === deps.getDocumentElement(windowLike.document)) break;
      blocks.add(parent);
      current = parent;
    }
    return blocks;
  };

  const establishesContainingBlock = (style: any, position: string) =>
    (position === `absolute` && style.position != null && style.position !== `` && style.position !== `static`) ||
    [`transform`, `translate`, `rotate`, `scale`, `perspective`, `filter`, `backdropFilter`].some((value) => style[value] != null && style[value] !== `` && style[value] !== `none`) ||
    style.contentVisibility === `auto` ||
    (style.containerType != null && style.containerType !== `` && style.containerType !== `normal`) ||
    String(style.contain ?? ``).split(/\s+/).some((value: string) => [`content`, `layout`, `paint`, `strict`].includes(value)) ||
    String(style.willChange ?? ``).split(/\s*,\s*/).some((value: string) => [`backdrop-filter`, `contain`, `filter`, `perspective`, `rotate`, `scale`, `transform`, `translate`].includes(value));

  const elementViewportRect = (element: any, offset: { x: number; y: number }, includeScale = false) => {
    const rect = deps.getElementRect(element);
    const xScale = includeScale && deps.getElementOffsetWidth(element) > 0 ? rect.width / deps.getElementOffsetWidth(element) : 1;
    const yScale = includeScale && deps.getElementOffsetHeight(element) > 0 ? rect.height / deps.getElementOffsetHeight(element) : 1;
    return {
      x: offset.x + rect.left + deps.getElementClientLeft(element) * xScale,
      y: offset.y + rect.top + deps.getElementClientTop(element) * yScale,
      width: deps.getElementClientWidth(element) * xScale,
      height: deps.getElementClientHeight(element) * yScale,
    };
  };

  const clipThroughAncestors = (rect: AnnotationRect, element: any, windowLike: any, includeScale = false) => {
    let clipped = rect;
    let parent = deps.getParentElement(element);
    while (parent != null && parent !== deps.getDocumentBody(windowLike.document) && parent !== deps.getDocumentElement(windowLike.document)) {
      const style = deps.getComputedStyle(windowLike, parent);
      const clipX = deps.isClippingOverflow(style.overflowX || style.overflow);
      const clipY = deps.isClippingOverflow(style.overflowY || style.overflow);
      if (clipX || clipY) {
        clipped = intersect(clipped, elementViewportRect(parent, { x: 0, y: 0 }, includeScale), { x: clipX, y: clipY });
        if (clipped == null) return null;
      }
      parent = deps.getParentElement(parent);
    }
    return clipped;
  };

  const resolveAnchorClipRect = (anchor: any, targetRect = deps.getAnchorRect(anchor), liveElement: any = null) => {
    if (targetRect == null) return null;
    const rootWindow = deps.getDefaultWindow();
    let clip = intersect(targetRect, { x: 0, y: 0, width: deps.getInnerWidth(rootWindow), height: deps.getInnerHeight(rootWindow) }, { x: true, y: true });
    if (clip == null) return null;
    let currentDocument = deps.getDefaultDocument();
    let currentWindow = rootWindow;
    for (const framePath of deps.getFramePath(anchor)) {
      const frame = deps.resolveFrameElement(currentDocument, framePath);
      if (frame == null || (clip = clipThroughAncestors(clip, frame, currentWindow)) == null || (clip = intersect(clip, frame.getBoundingClientRect(), { x: true, y: true })) == null) return null;
      const frameRect = frame.getBoundingClientRect();
      const scroll = deps.getScrollOffset(currentWindow);
      if ((clip = intersect(clip, { x: scroll.x + frameRect.left, y: scroll.y + frameRect.top, width: frameRect.width, height: frameRect.height }, { x: true, y: true })) == null) return null;
      currentWindow = deps.getFrameWindow(frame);
      if (currentWindow == null) return null;
      currentDocument = currentWindow.document;
    }
    const scroll = deps.getScrollOffset(currentWindow);
    const target = liveElement?.isConnected === true && liveElement.ownerDocument === currentDocument
      ? liveElement
      : anchor.kind === `element` && anchor.selector != null ? currentDocument.querySelector(anchor.selector) : null;
    const containingBlocks = target == null ? null : elementContainingBlocks(target, currentWindow);
    return applyAnnotationScrollContainerClips(clip, anchor.scrollContainers, {
      resolveContainer: (selector) => currentDocument.querySelector(selector),
      isContainingBlock: (container) => containingBlocks == null || containingBlocks.has(container),
      getStyle: (container) => currentWindow.getComputedStyle(container),
      isClippingOverflow: deps.isClippingOverflow,
      getViewportRect: (container) => elementViewportRect(container, scroll),
    });
  };

  const resolveElementFrameGeometry = (element: any) => {
    let currentWindow = element.ownerDocument?.defaultView;
    if (currentWindow == null) return null;
    let rect = deps.getElementRect(element);
    let clipRect: AnnotationRect | null = { x: 0, y: 0, width: deps.getInnerWidth(currentWindow), height: deps.getInnerHeight(currentWindow) };
    let radiusScale = { x: deps.getElementOffsetWidth(element) > 0 ? rect.width / deps.getElementOffsetWidth(element) : 1, y: deps.getElementOffsetHeight(element) > 0 ? rect.height / deps.getElementOffsetHeight(element) : 1 };
    let currentElement = element;
    while (clipRect != null && currentWindow != null) {
      clipRect = clipThroughAncestors(clipRect, currentElement, currentWindow, true);
      if (clipRect == null) return null;
      if (currentWindow === deps.getDefaultWindow()) return { rect, clipRect, radiusScale };
      const frame = deps.getFrameElement(currentWindow);
      if (!deps.isElement(frame) || frame.isConnected !== true) return null;
      const frameRect = deps.getElementRect(frame);
      const sx = deps.getElementOffsetWidth(frame) > 0 ? frameRect.width / deps.getElementOffsetWidth(frame) : 1;
      const sy = deps.getElementOffsetHeight(frame) > 0 ? frameRect.height / deps.getElementOffsetHeight(frame) : 1;
      const translate = (value: AnnotationRect) => ({ x: frameRect.x + (frame.clientLeft + value.x) * sx, y: frameRect.y + (frame.clientTop + value.y) * sy, width: value.width * sx, height: value.height * sy });
      rect = translate(rect);
      clipRect = intersect(translate(clipRect), { x: frameRect.x + frame.clientLeft * sx, y: frameRect.y + frame.clientTop * sy, width: frame.clientWidth * sx, height: frame.clientHeight * sy }, { x: true, y: true });
      radiusScale = { x: radiusScale.x * sx, y: radiusScale.y * sy };
      currentElement = frame;
      currentWindow = frame.ownerDocument?.defaultView;
    }
    return null;
  };

  const buildRegionAnchor = (rect: AnnotationRect, point: { x: number; y: number }, options: any = {}) => {
    const frameWindow = deps.resolveFrameWindow(options.framePath ?? []) ?? deps.getDefaultWindow();
    const frameOffset = deps.getScrollOffset(frameWindow);
    const pageScrollY = deps.getWindowScrollY(frameWindow);
    const offsetPoint = { x: point.x - frameOffset.x, y: point.y - frameOffset.y };
    const viewportRect = { x: rect.x - frameOffset.x, y: rect.y - frameOffset.y, width: rect.width, height: rect.height };
    const pageUrl = deps.getPageUrl();
    const documentContext = deps.getDocumentContext(pageUrl, { documentTitle: deps.getCurrentDocumentTitle(), fallbackWindow: deps.getDefaultWindow(), frameWindow, viewportRect });
    const scrollContainers = deps.getScrollContainers(frameWindow, offsetPoint);
    return { kind: `region`, pageUrl, frameUrl: options.frameUrl ?? null, title: `Selected browser region`, elementPath: `browser region`, point: { xPercent: (offsetPoint.x / deps.getInnerWidth(frameWindow)) * 100, y: offsetPoint.y + pageScrollY }, rect: { x: viewportRect.x, y: viewportRect.y + pageScrollY, width: viewportRect.width, height: viewportRect.height }, isFixed: false, role: null, name: null, selector: null, framePath: options.framePath ?? [], nearbyText: null, documentContext, ...(scrollContainers.length === 0 ? {} : { scrollContainers }) };
  };

  const resolveMarkerPoint = (anchor: any, viewportState = deps.getViewportState(), options: any = {}) => {
    const frameWindow = deps.resolveFrameWindow(deps.getFramePath(anchor));
    const annotationWindow = frameWindow ?? deps.getDefaultWindow();
    const annotationOffset = deps.getViewportOffset(anchor, annotationWindow);
    const inset = options.markerPointInset ?? deps.getMarkerInset();
    if (anchor.kind !== `element` && frameWindow != null && frameWindow !== deps.getDefaultWindow()) {
      const scroll = deps.getScrollOffset(frameWindow);
      const frameOffset = deps.getFrameOffset(frameWindow);
      return { x: deps.clamp(frameOffset.x + (anchor.point.xPercent / 100) * deps.getInnerWidth(frameWindow) - (annotationOffset.x + 0), inset, viewportState.width - inset), y: frameOffset.y + anchor.point.y - (anchor.isFixed ? 0 : deps.getWindowScrollY(frameWindow)) - annotationOffset.y };
    }
    const frameScroll = options.includeElementFrameScroll && anchor.kind === `element` && frameWindow != null && frameWindow !== deps.getDefaultWindow() ? deps.getScrollOffset(frameWindow).y : 0;
    return { x: deps.clamp((anchor.point.xPercent / 100) * viewportState.width - annotationOffset.x, inset, viewportState.width - inset), y: (anchor.isFixed ? anchor.point.y : anchor.point.y - viewportState.scrollY - frameScroll) - annotationOffset.y };
  };

  return { resolveAnchorClipRect, resolveElementFrameGeometry, buildRegionAnchor, resolveMarkerPoint, resolveViewportPoint: (anchor: any, viewportSize: any, options: any) => { const point = resolveMarkerPoint(anchor, deps.getViewportOverride(deps.getViewportState(), viewportSize), { ...options, markerPointInset: deps.getMarkerInset() / options.zoomFactor }); return { x: point.x * options.zoomFactor, y: point.y * options.zoomFactor }; }, resolveVisibleMarkerPoint: (anchor: any, zoomFactor: number, options: any) => { const viewport = deps.getViewportOverride(deps.getViewportState(), options); const point = resolveMarkerPoint(anchor, viewport, { markerPointInset: deps.getMarkerInset() / zoomFactor }); return { x: point.x, y: deps.clamp(point.y, deps.getMarkerInset() / zoomFactor, viewport.height - deps.getMarkerInset() / zoomFactor) }; }, buildBoxStyle: (rect: AnnotationRect, scale: number, borderRadius: string) => { const scaled = deps.getScaleRect(rect, scale); return { borderRadius, left: scaled.x, top: scaled.y, width: scaled.width, height: scaled.height }; } };
}

export { createAnnotationAnchorGeometry };
if (typeof module !== `undefined`) module.exports = { createAnnotationAnchorGeometry };
