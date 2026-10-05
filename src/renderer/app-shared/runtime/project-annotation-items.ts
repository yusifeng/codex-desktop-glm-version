export interface AnnotationItem { designChange?: unknown; body?: string; additionalAnchors?: unknown }

/** Project annotation items for surfaces that hide design changes or extra anchors. */
export function projectAnnotationItems<T extends AnnotationItem>(items: readonly T[], includeDesignChanges: boolean, includeAdditionalAnchors: boolean): T[] {
  if (includeDesignChanges && includeAdditionalAnchors) return [...items];
  return items.flatMap((item) => {
    let projected = item;
    if (!includeDesignChanges && item.designChange != null) {
      if ((item.body?.trim() ?? "").length === 0) return [];
      const { designChange: _designChange, ...withoutDesignChange } = projected;
      projected = withoutDesignChange as T;
    }
    if (!includeAdditionalAnchors && projected.additionalAnchors != null) {
      const { additionalAnchors: _additionalAnchors, ...withoutAnchors } = projected;
      projected = withoutAnchors as T;
    }
    return [projected];
  });
}
