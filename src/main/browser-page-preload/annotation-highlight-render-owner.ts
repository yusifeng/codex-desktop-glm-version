type HighlightDependencies = {
  projectHighlightState: (input: any, dependencies: any) => any;
  readLiveElementRect: (element: any) => any;
  readAnchorRect: (anchor: any) => any;
  styleElementHighlight: (anchor: any, rect: any, width: number, height: number) => any;
  styleRegionHighlight: (anchor: any, rect: any, width: number, height: number) => any;
  clipHighlightRect: (anchor: any, rect: any, element: any) => any;
  projectAdditionalHighlights: (selections: any, viewport: any, options: any) => any;
  resolveEditorAnchor: (anchor: any) => any;
  splitEditorAnchor: (anchor: any) => any;
  isPageAnnotation: (anchor: any) => boolean;
};

function projectAnnotationHighlightRuntimeState(input: any, dependencies: HighlightDependencies) {
  const highlightState = dependencies.projectHighlightState({
    hasActiveSelection: input.hasActiveSelection,
    active: input.active,
    activeElement: input.activeElement,
    activeAdditionalAnchors: input.activeAdditionalAnchors,
    editor: input.editor,
    activeHighlightRect: input.activeHighlightRect,
    hoveredSnapshot: input.hoveredSnapshot,
    metadataSnapshot: input.metadataSnapshot,
    viewport: input.viewport,
    viewportSize: input.viewport,
  }, {
    readLiveElementRect: dependencies.readLiveElementRect,
    readAnchorRect: dependencies.readAnchorRect,
    styleElementHighlight: dependencies.styleElementHighlight,
    styleRegionHighlight: dependencies.styleRegionHighlight,
    clipHighlightRect: dependencies.clipHighlightRect,
    projectAdditionalHighlights: dependencies.projectAdditionalHighlights,
    resolveEditorAnchor: dependencies.resolveEditorAnchor,
    splitEditorAnchor: dependencies.splitEditorAnchor,
    isPageAnnotation: dependencies.isPageAnnotation,
  });
  return {
    anchor: input.textPreviewState.anchor,
    selectionRects: input.textPreviewState.selectionRects,
    highlightRect: highlightState.highlightRect,
    isRemoveHover: highlightState.isRemoveHover,
    highlightClassName: highlightState.highlightClassName,
    highlightBorderRadius: highlightState.highlightBorderRadius,
    additionalHighlights: highlightState.additionalHighlights,
  };
}

function renderAnnotationRoot(input: any, dependencies: {
  jsx: (type: any, props: any) => any;
  jsxs: (type: any, props: any) => any;
  IntlProvider: any;
  onIntlError: (error: any) => void;
  InteractionLayer: any;
}) {
  const content = (!input.suspended || input.hasActiveSelection) && (
    input.interactionEnabled || input.nativeTextSelection
      ? dependencies.jsx(dependencies.InteractionLayer, { style: input.interactionStyle, children: input.content })
      : input.content
  );
  return dependencies.jsx(dependencies.IntlProvider, {
    defaultLocale: input.intlConfig.defaultLocale,
    locale: input.intlConfig.locale,
    messages: input.intlConfig.messages,
    onError: dependencies.onIntlError,
    children: dependencies.jsxs(`div`, {
      "data-browser-comment-annotation-selection-modifier-active":
        (input.modifierActive && input.pointer != null) || undefined,
      "data-browser-comment-root": true,
      style: input.overlayStyle,
      children: [dependencies.jsx(`style`, { children: input.stylesheet }), content],
    }),
  });
}

export { projectAnnotationHighlightRuntimeState, renderAnnotationRoot };
if (typeof module !== `undefined`) module.exports = { projectAnnotationHighlightRuntimeState, renderAnnotationRoot };
