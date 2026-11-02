export const BROWSER_ANNOTATION_MARKER_SIZE = 26;
export const DEFAULT_RUNTIME_INTL_CONFIG = { defaultLocale: "en-US", locale: "en-US", messages: {} };

export function browserTransferKey(source: unknown, target: unknown): string {
  return `${String(source)}\0${String(target)}`;
}

function sameScrollContainers(left: any[] | null | undefined, right: any[] | null | undefined): boolean {
  const a = left ?? [], b = right ?? [];
  return a.length === b.length && a.every((entry, index) => {
    const other = b[index];
    return other != null && entry.selector === other.selector && entry.scrollLeft === other.scrollLeft && entry.scrollTop === other.scrollTop;
  });
}

export function browserAnchorsEqual(left: any, right: any): boolean {
  if (left.kind !== right.kind || left.pageUrl !== right.pageUrl || left.title !== right.title || left.elementPath !== right.elementPath ||
      left.frameUrl !== right.frameUrl || left.framePath.length !== right.framePath.length || !left.framePath.every((value: unknown, index: number) => value === right.framePath[index]) ||
      !sameScrollContainers(left.scrollContainers, right.scrollContainers) || left.isFixed !== right.isFixed || left.point.xPercent !== right.point.xPercent || left.point.y !== right.point.y ||
      left.rect.x !== right.rect.x || left.rect.y !== right.rect.y || left.rect.width !== right.rect.width || left.rect.height !== right.rect.height ||
      left.role !== right.role || left.name !== right.name || left.selector !== right.selector || left.nearbyText !== right.nearbyText) return false;
  if (left.kind === "virtual") return right.kind === "virtual" && left.surfaceId === right.surfaceId && left.targetId === right.targetId;
  if (left.kind === "element") return right.kind === "element" && left.runtimeElementId === right.runtimeElementId;
  if (left.kind === "region") return true;
  return right.kind === "text" && left.selectedText === right.selectedText && left.textLocator.kind === right.textLocator.kind &&
    left.textLocator.direction === right.textLocator.direction && (left.textLocator.kind === "form-control" || (right.textLocator.kind === "dom" && left.textLocator.rangeText === right.textLocator.rangeText)) &&
    left.textLocator.selector === right.textLocator.selector && left.textLocator.shadowHosts.length === right.textLocator.shadowHosts.length &&
    left.textLocator.shadowHosts.every((value: unknown, index: number) => value === right.textLocator.shadowHosts[index]) &&
    left.textLocator.startOffset === right.textLocator.startOffset && left.textLocator.endOffset === right.textLocator.endOffset &&
    left.selectionRects.length === right.selectionRects.length && left.selectionRects.every((rect: any, index: number) => {
      const other = right.selectionRects[index];
      return other != null && rect.x === other.x && rect.y === other.y && rect.width === other.width && rect.height === other.height;
    });
}

export function sanitizeBrowserComments(comments: any[], includeDesignChanges: boolean, includeAdditionalAnchors: boolean): any[] {
  if (includeDesignChanges && includeAdditionalAnchors) return comments;
  return comments.flatMap((comment) => {
    let result = comment;
    if (!includeDesignChanges && comment.designChange != null) {
      if ((comment.body?.trim() ?? "").length === 0) return [];
      const { designChange: _designChange, ...withoutDesignChange } = result;
      result = withoutDesignChange;
    }
    if (!includeAdditionalAnchors && result.additionalAnchors != null) {
      const { additionalAnchors: _additionalAnchors, ...withoutAdditionalAnchors } = result;
      result = withoutAdditionalAnchors;
    }
    return [result];
  });
}
