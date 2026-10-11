type AnnotationHighlightStateDependencies = {
  readLiveElementRect: (element: any) => any;
  readAnchorRect: (anchor: any) => any;
  styleElementHighlight: (anchor: any, rect: any, width: number, height: number) => string;
  styleRegionHighlight: (anchor: any, rect: any, width: number, height: number) => string;
  clipHighlightRect: (anchor: any, rect: any, element?: any) => any;
  projectAdditionalHighlights: (selections: any[], viewport: any, options: any) => any[];
  resolveEditorAnchor: (anchor: any) => any;
  splitEditorAnchor: (anchor: any) => { primary: any; additional: any[] };
  isPageAnnotation: (anchor: any) => boolean;
};

/** Projects highlight and linked-selection render state while injecting DOM geometry adapters. */
function projectAnnotationHighlightState(
  {
    hasActiveSelection,
    active,
    activeElement,
    activeAdditionalAnchors,
    editor,
    activeHighlightRect,
    hoveredSnapshot,
    metadataSnapshot,
    viewport,
    viewportSize,
  }: {
    hasActiveSelection: boolean;
    active: any;
    activeElement: any;
    activeAdditionalAnchors: any[];
    editor: any;
    activeHighlightRect: any;
    hoveredSnapshot: any;
    metadataSnapshot: any;
    viewport: { width: number; height: number };
    viewportSize: any;
  },
  dependencies: AnnotationHighlightStateDependencies,
) {
  let highlightRect = null;
  let highlightClassName = `hover-box`;
  let highlightBorderRadius: any;
  let isRemoveHover = false;
  let additionalHighlights: any[] = [];
  const projectAdditional = (selections: any[], options: any) =>
    dependencies.projectAdditionalHighlights(selections, viewport, options);

  if (hasActiveSelection && active?.annotation.anchor.kind === `element`) {
    const live = activeElement == null ? null : dependencies.readLiveElementRect(activeElement);
    const rect = live?.rect ?? dependencies.readAnchorRect(active.annotation.anchor);
    highlightBorderRadius = live?.borderRadius;
    highlightClassName = dependencies.styleElementHighlight(
      active.annotation.anchor,
      rect,
      viewport.width,
      viewport.height,
    );
    highlightRect = dependencies.clipHighlightRect(active.annotation.anchor, rect, activeElement);
    isRemoveHover = active.kind === `comment` && dependencies.isPageAnnotation(active.annotation.anchor);
    additionalHighlights = projectAdditional(activeAdditionalAnchors, {
      clipToVisibleArea: true,
      selectionIndexOffset: 1,
      viewportSize: active.annotation.viewportSize,
    });
  } else if (hasActiveSelection && active?.kind === `comment` && active.annotation.anchor.kind === `region`) {
    const rect = dependencies.readAnchorRect(active.annotation.anchor);
    highlightClassName = dependencies.styleRegionHighlight(
      active.annotation.anchor,
      rect,
      viewport.width,
      viewport.height,
    );
    highlightRect = dependencies.clipHighlightRect(active.annotation.anchor, rect);
    additionalHighlights = projectAdditional(activeAdditionalAnchors, {
      clipToVisibleArea: true,
      selectionIndexOffset: 1,
      viewportSize: active.annotation.viewportSize,
    });
  } else if (!hasActiveSelection) {
    highlightRect = activeHighlightRect?.rect ?? null;
    if (highlightRect != null) {
      highlightClassName = dependencies.styleRegionHighlight(
        null,
        highlightRect,
        viewport.width,
        viewport.height,
      );
      if (editor?.target.mode === `create` && editor.anchor.type !== `text`) {
        const split = dependencies.splitEditorAnchor(editor.anchor);
        additionalHighlights = projectAdditional([split.primary, ...split.additional], {
          clipToVisibleArea: true,
          viewportSize: editor.anchor.viewportSize,
        });
      }
    } else if (editor?.anchor.type === `element`) {
      const anchor = dependencies.resolveEditorAnchor(editor.anchor);
      const live = editor.anchor.element == null ? null : dependencies.readLiveElementRect(editor.anchor.element);
      const rect = live?.rect ?? dependencies.readAnchorRect(anchor);
      highlightBorderRadius = live?.borderRadius;
      highlightClassName = editor.target.mode === `design`
        ? `hover-box`
        : dependencies.styleElementHighlight(anchor, rect, viewport.width, viewport.height);
      highlightRect = editor.target.mode === `design`
        ? rect
        : dependencies.clipHighlightRect(anchor, rect, editor.anchor.element);
      isRemoveHover = editor.target.mode !== `design` && dependencies.isPageAnnotation(anchor);
      additionalHighlights = projectAdditional(editor.anchor.additionalSelections, {
        clipToVisibleArea: editor.target.mode !== `design`,
        selectionIndexOffset: 1,
        viewportSize: editor.anchor.viewportSize,
      });
    } else if (editor?.anchor.type === `region` && editor.target.mode !== `design`) {
      const rect = dependencies.readAnchorRect(editor.anchor.value);
      highlightClassName = dependencies.styleRegionHighlight(
        editor.anchor.value,
        rect,
        viewport.width,
        viewport.height,
      );
      highlightRect = dependencies.clipHighlightRect(editor.anchor.value, rect);
      additionalHighlights = projectAdditional(editor.anchor.additionalSelections, {
        clipToVisibleArea: true,
        selectionIndexOffset: 1,
        viewportSize: editor.anchor.viewportSize,
      });
    } else if (editor?.anchor.type === `virtual` || metadataSnapshot != null) {
      highlightRect = metadataSnapshot?.rect ?? null;
    } else if (hoveredSnapshot != null) {
      highlightRect = hoveredSnapshot.rect;
      highlightBorderRadius = hoveredSnapshot.borderRadius;
      highlightClassName = dependencies.styleElementHighlight(null, highlightRect, viewport.width, viewport.height);
    }
  }
  return { highlightRect, highlightClassName, highlightBorderRadius, isRemoveHover, additionalHighlights };
}

export { projectAnnotationHighlightState };
if (typeof module !== `undefined`) module.exports = { projectAnnotationHighlightState };
