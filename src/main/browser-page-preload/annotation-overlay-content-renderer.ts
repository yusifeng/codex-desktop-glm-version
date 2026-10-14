type RendererDependencies = {
  jsx: (type: any, props: any, key?: any) => any;
  jsxs: (type: any, props: any, key?: any) => any;
  Fragment: any;
  InteractionBlocker: any;
  HighlightLayer: any;
  SelectionCursor: any;
  MetadataOverlay: any;
  Marker: any;
  SavedMarker: any;
  readAnchorRect: (anchor: any) => any;
  clipAnchorRect: (anchor: any, rect: any) => any;
  regionClassName: (anchor: any, rect: any, width: number, height: number) => string;
  rectStyle: (rect: any, zoom: number, borderRadius?: any) => any;
};

/** Renders Wy's region, highlight, cursor, metadata and marker overlay layers. */
function renderAnnotationOverlayContent(input: any, dependencies: RendererDependencies) {
  const { jsx, jsxs } = dependencies;
  const focusEditor = () => input.sendToHost({ type: `browser-sidebar-runtime-focus-editor` });
  return jsxs(dependencies.Fragment, {
    children: [
      input.interactionEnabled ? jsx(dependencies.InteractionBlocker, {}) : null,
      input.regionRecords.map(({ anchor, key }: any) => {
        const rect = dependencies.readAnchorRect(anchor);
        if (rect == null) return null;
        const clippedRect = dependencies.clipAnchorRect(anchor, rect);
        return clippedRect == null ? null : jsx(`div`, {
          className: dependencies.regionClassName(anchor, rect, input.viewport.width, input.viewport.height),
          style: dependencies.rectStyle(clippedRect, input.zoomFactor),
        }, key);
      }),
      jsx(dependencies.HighlightLayer, {
        additionalHighlights: input.additionalHighlights.filter((entry: any) => !entry.isPageAnnotation),
        highlightBorderRadius: input.highlightBorderRadius,
        highlightClassName: input.highlightClassName,
        highlightRect: input.removeHighlight ? null : input.highlightRect,
        hoverSnapshot: input.draftHoverSnapshot,
        isRemoveHover: input.removeHover,
        linkedSelectionIndex: input.linkedSelectionIndex,
        viewportHeight: input.viewport.height,
        viewportWidth: input.viewport.width,
        zoomFactor: input.zoomFactor,
      }),
      !input.hasActiveSelection && input.pointer != null &&
      (input.editor == null || (input.editor.target.mode === `create` && input.editor.anchor.type !== `text`))
        ? jsx(dependencies.SelectionCursor, {
            className: `annotation-selection-cursor`,
            "data-browser-comment-annotation-selection-cursor": true,
            "data-browser-comment-native-text-selection": input.nativeTextSelection || undefined,
            mode: input.cursorMode,
            pointerEvents: `none`,
            style: {
              height: input.hotspotSize.height * input.viewportScale,
              left: input.pointer.x * input.zoomFactor - input.hotspot.x * input.viewportScale,
              top: input.pointer.y * input.zoomFactor - input.hotspot.y * input.viewportScale,
              width: input.hotspotSize.width * input.viewportScale,
            },
          })
        : null,
      input.textSelectionRects.map((rect: any, index: number) => jsx(
        `div`,
        { className: `text-selection-highlight`, style: dependencies.rectStyle(rect, input.zoomFactor) },
        `${rect.x}:${rect.y}:${rect.width}:${rect.height}:${index}`,
      )),
      input.flexItemOverlays.map((entry: any) => jsx(`div`, {
        className: `flex-item-overlay`,
        "data-browser-comment-flex-item-overlay": true,
        style: dependencies.rectStyle(entry.rect, input.zoomFactor, entry.borderRadius),
      }, entry.key)),
      input.metadataSnapshot == null ? null : jsx(dependencies.MetadataOverlay, {
        snapshot: input.metadataSnapshot,
        viewportScale: input.runtimeViewportScale,
        zoomFactor: input.zoomFactor,
      }),
      input.markersEnabled || input.hasActiveSelection ? jsxs(`div`, {
        className: `markers-layer`,
        children: [
          input.metadataSelection?.selected === true ? jsx(dependencies.Marker, {
            commentNumber: null,
            markerPoint: {
              x: input.metadataSelection.point.x * input.zoomFactor,
              y: input.metadataSelection.point.y * input.zoomFactor,
            },
            onFocusEditor: focusEditor,
          }) : null,
          input.draftMarkerPoint == null ? null : jsx(dependencies.Marker, {
            commentNumber: input.draftCommentNumber,
            markerPoint: input.draftMarkerPoint,
            onFocusEditor: focusEditor,
          }),
          (input.markersVisible || input.hasActiveSelection ? input.markerRecords : []).map(
            ({ anchor, comment, commentNumber, key, savedSelectionIndex }: any, index: number) =>
              jsx(dependencies.SavedMarker, {
                commentNumber,
                isSelected: input.editor?.target.mode === `edit` && input.editor.target.commentId === comment.id,
                markerPoint: input.markerPoints[index],
                onMouseEnter: () => {
                  if (!input.hasActiveSelection && input.editor == null) input.openPreview(comment, anchor, savedSelectionIndex);
                },
                onMouseLeave: () => input.closePreview(comment.id),
                onClick: (event: any) => {
                  if (!event.isTrusted) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (input.editor != null) focusEditor();
                  else input.openEditor(comment, anchor, savedSelectionIndex);
                },
              }, key),
          ),
        ],
      }) : null,
    ],
  });
}

export { renderAnnotationOverlayContent };
if (typeof module !== `undefined`) module.exports = { renderAnnotationOverlayContent };
