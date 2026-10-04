type AnnotationRequestContextDependencies = {
  documentRef: any;
  windowRef: any;
  globalLike: any;
  isRange: (value: any) => boolean;
  isHTMLElement: (value: any) => boolean;
  isExcludedElement: (value: any) => boolean;
  getVisibleRect: (value: any) => any;
  resolveRangeAnchor: (value: any) => any;
  getRangeClientRects: (value: any) => Iterable<any>;
  isRangeSelectable: (value: any) => boolean;
};

type AnnotationRequestState = {
  canUseSiteAnnotationApi: boolean;
  hasActiveEditor: boolean;
  isAgentControllingBrowser: boolean;
  canUseTweaks?: boolean;
};

const isAnnotationRequestAllowed = (
  state: AnnotationRequestState,
  globalLike: any,
) =>
  globalLike.isSecureContext === true &&
  state.canUseSiteAnnotationApi === true &&
  state.isAgentControllingBrowser !== true &&
  state.hasActiveEditor !== true;

function createAnnotationRequestContext(dependencies: AnnotationRequestContextDependencies) {
  const resolveSerializedRange = (root: any, descriptor: any) => {
    let start = root;
    let end = root;
    for (const index of descriptor.startPath) {
      start = start?.childNodes?.[index];
      if (start == null) return null;
    }
    for (const index of descriptor.endPath) {
      end = end?.childNodes?.[index];
      if (end == null) return null;
    }
    const range = dependencies.documentRef.createRange();
    try {
      range.setStart(start, descriptor.startOffset);
      range.setEnd(end, descriptor.endOffset);
    } catch {
      return null;
    }
    return !range.collapsed && range.toString() === descriptor.rangeText ? range : null;
  };

  const resolveTarget = (
    input: { target: any; request: { openTweaks?: boolean }; rangeText?: string },
    state: AnnotationRequestState,
  ) => {
    const { target, request, rangeText } = input;
    if (!isAnnotationRequestAllowed(state, dependencies.globalLike) ||
        (request.openTweaks === true && state.canUseTweaks !== true)) return null;
    if (dependencies.isRange(target)) {
      const commonAncestor = target.commonAncestorContainer;
      const ancestor = dependencies.isHTMLElement(commonAncestor)
        ? commonAncestor
        : commonAncestor?.parentElement;
      if (
        request.openTweaks === true ||
        ancestor == null ||
        dependencies.isExcludedElement(ancestor) ||
        target.startContainer?.ownerDocument !== dependencies.documentRef ||
        target.toString() !== rangeText ||
        !dependencies.isRangeSelectable(target)
      ) return null;
      const anchor = dependencies.resolveRangeAnchor(target);
      const viewport = dependencies.windowRef;
      const visible = Array.from(dependencies.getRangeClientRects(target) ?? []).some(
        (rect: any) =>
          rect.width > 0 &&
          rect.height > 0 &&
          rect.x < viewport.innerWidth &&
          rect.x + rect.width > 0 &&
          rect.y < viewport.innerHeight &&
          rect.y + rect.height > 0,
      );
      return anchor != null && visible ? anchor.viewportPoint : null;
    }
    if (
      target?.ownerDocument !== dependencies.documentRef ||
      target?.isConnected !== true ||
      dependencies.isExcludedElement(target)
    ) return null;
    const rect = dependencies.getVisibleRect(target);
    return rect == null ||
      !Number.isFinite(rect.x) ||
      !Number.isFinite(rect.y) ||
      !Number.isFinite(rect.width) ||
      !Number.isFinite(rect.height) ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.x >= dependencies.windowRef.innerWidth ||
      rect.x + rect.width <= 0 ||
      rect.y >= dependencies.windowRef.innerHeight ||
      rect.y + rect.height <= 0
      ? null
      : { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  };

  return { isAllowed: (state: AnnotationRequestState) => isAnnotationRequestAllowed(state, dependencies.globalLike), resolveSerializedRange, resolveTarget };
}

export { createAnnotationRequestContext, isAnnotationRequestAllowed };
if (typeof module !== `undefined`) module.exports = { createAnnotationRequestContext, isAnnotationRequestAllowed };
