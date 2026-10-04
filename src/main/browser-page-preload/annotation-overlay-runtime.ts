import { collectAnnotationFlexGapOverlays } from "./annotation-flex-gap-overlays";
import { observeAnnotationMutationsOutsideOverlay } from "./annotation-overlay-observer";
import { shouldSuppressAnnotationRegionOverlay } from "./annotation-overlay-policies";

type AnnotationOverlayRuntimeDependencies = {
  documentLike: any;
  windowLike: any;
  htmlDivElementConstructor: any;
  htmlElementConstructor: any;
  nodeConstructor: any;
  mutationObserverConstructor: new (callback: (records: any[]) => void) => {
    observe(target: any, options: any): void;
    disconnect(): void;
  };
  mutationObserverOptions: any;
  rootId: string;
  maximumZIndex: number;
  isRootElement: (element: any) => boolean;
  snapshotElement: (element: any) => any;
  resolveElementAtPoint: (x: number, y: number, documentLike: any, allowRoot: boolean) => any;
  samePageUrl: (left: string, right: string) => boolean;
  resolveAnchorElement: (anchor: any, annotationId: string, cache: Map<any, any>) => any;
  refreshElementAnchor: (element: any, anchor: any, viewportSize: any, markerViewportPoint: any) => any;
  getOwnerWindow: (element: any) => any;
  isElement: (value: any) => boolean;
  getVisibleRect: (element: any) => any;
  anchorToViewportRect: (anchor: any) => any;
  scaleViewportPoint: (point: any, scale: any) => any;
  getEditorSelections: (anchor: any) => any;
  anchorsEqual: (left: any, right: any) => boolean;
};

function createAnnotationOverlayRuntime(deps: AnnotationOverlayRuntimeDependencies) {
  const elementCaches = new WeakMap<object, Map<any, any>>();

  const ensureOverlayRoot = () => {
    const existing = deps.documentLike.getElementById(deps.rootId);
    if (existing instanceof deps.htmlDivElementConstructor) return existing;
    const root = deps.documentLike.createElement(`div`);
    root.id = deps.rootId;
    root.style.position = `fixed`;
    root.style.inset = `0`;
    root.style.pointerEvents = `none`;
    root.style.zIndex = String(deps.maximumZIndex);
    deps.documentLike.documentElement.appendChild(root);
    return root;
  };

  const snapshotHoverElement = (element: any, allowRoot = false) =>
    element == null || (!allowRoot && deps.isRootElement(element)) ? null : deps.snapshotElement(element);

  const resolveHoverElementAtPoint = (point: any, allowRoot: boolean, documentLike: any) =>
    point == null ? null : deps.resolveElementAtPoint(point.x, point.y, documentLike, allowRoot);

  const refreshDesignAnnotation = (annotation: any, cache: Map<any, any>) => {
    if (
      !deps.samePageUrl(annotation.anchor.pageUrl, deps.windowLike.location.href) ||
      annotation.anchor.kind !== `element`
    ) return null;
    const element = deps.resolveAnchorElement(annotation.anchor, annotation.id, cache);
    if (element == null) return null;
    cache.set(annotation.id, element);
    return {
      ...annotation,
      anchor: deps.refreshElementAnchor(
        element,
        annotation.anchor,
        annotation.viewportSize,
        annotation.markerViewportPoint,
      ),
    };
  };

  const isAnnotationForCurrentPage = (annotation: any) =>
    deps.samePageUrl(annotation.anchor.pageUrl, deps.windowLike.location.href);

  const getElementCache = (rootHost: object) => {
    const existing = elementCaches.get(rootHost);
    if (existing != null) return existing;
    const cache = new Map<any, any>();
    elementCaches.set(rootHost, cache);
    return cache;
  };

  const observeMutationsOutsideOverlay = (documentLike: any, rootHost: any, onChange: () => void) => {
    return observeAnnotationMutationsOutsideOverlay(documentLike, rootHost, onChange, deps);
  };

  const resolveTextSelectionRects = (anchor: any) =>
    anchor.selectionRects.flatMap((rect: any) => {
      const viewportRect = deps.anchorToViewportRect({ ...anchor, rect });
      return viewportRect == null ? [] : [viewportRect];
    });

  const resolveMetadataTooltipRect = (
    rootHost: any,
    point: any,
    scale: { viewportScale: number; zoomFactor: number },
  ) => {
    const scaledPoint = deps.scaleViewportPoint(point, scale);
    const tooltip = rootHost.shadowRoot?.querySelector(`.element-metadata-tooltip`);
    if (
      tooltip instanceof deps.htmlElementConstructor &&
      Number.parseFloat(tooltip.style.left) === scaledPoint.x &&
      Number.parseFloat(tooltip.style.top) === scaledPoint.y
    ) {
      const rect = tooltip.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }
    return scaledPoint;
  };

  return {
    ensureOverlayRoot,
    snapshotHoverElement,
    resolveHoverElementAtPoint,
    refreshDesignAnnotation,
    isAnnotationForCurrentPage,
    collectFlexGapOverlays: (property: string | null, editor: any, annotation: any, cache: Map<any, any>) =>
      collectAnnotationFlexGapOverlays(property, editor, annotation, cache, deps),
    getElementCache,
    observeMutationsOutsideOverlay,
    resolveTextSelectionRects,
    resolveMetadataTooltipRect,
    shouldSuppressRegionOverlay: (annotation: any, editor: any, activeAnnotation: any) =>
      shouldSuppressAnnotationRegionOverlay(annotation, editor, activeAnnotation, deps),
  };
}

export { createAnnotationOverlayRuntime };
if (typeof module !== `undefined`) module.exports = { createAnnotationOverlayRuntime };
