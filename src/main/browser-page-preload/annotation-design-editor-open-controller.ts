type AnnotationDesignEditorOpenDependencies = {
  resolveCard: (element: any) => any;
  normalizeAnchor: (element: any, anchor: any, canUseSiteAnnotationApi: boolean) => any;
  projectCardRect: (rootHost: any, rect: any, options: any) => any;
  projectDesign: (element: any, anchorState: any, controls: any, designChange: any, card: any) => any;
  rememberTarget: (id: string, element: any) => void;
  createTargetMap: (rootHost: any) => Map<any, any>;
  applyDesignChange: (element: any, id: string) => void;
  openEditor: (payload: any) => void;
  refreshViewport: () => void;
  setEditorState: (state: any) => void;
  setCard: (card: any) => void;
  closePopover: () => void;
};

/** Opens a design editor from an element anchor while preserving target, IPC, and editor-state order. */
function createAnnotationDesignEditorOpenController(dependencies: AnnotationDesignEditorOpenDependencies) {
  let disposed = false;

  const open = (
    element: any,
    anchorState: any,
    context: { rootHost: any; canUseSiteAnnotationApi: boolean; viewportScale: number; zoom: number; getAnnotationControls?: (element: any) => any },
  ) => {
    if (disposed) return false;
    const card = dependencies.resolveCard(element);
    if (card == null) return false;
    const nextAnchor = {
      ...anchorState,
      anchor: dependencies.normalizeAnchor(element, anchorState.anchor, context.canUseSiteAnnotationApi),
      cardViewportRect: dependencies.projectCardRect(context.rootHost, card.rect, {
        viewportScale: context.viewportScale,
        zoomFactor: context.zoom,
      }),
    };
    const designState = dependencies.projectDesign(
      element,
      nextAnchor,
      context.canUseSiteAnnotationApi ? context.getAnnotationControls?.(element) : undefined,
      undefined,
      card,
    );
    if (context.canUseSiteAnnotationApi) dependencies.rememberTarget(designState.id, element);
    dependencies.createTargetMap(context.rootHost).set(designState.id, element);
    dependencies.applyDesignChange(element, designState.id);
    dependencies.openEditor({ type: `browser-sidebar-runtime-open-design-editor`, anchorState: nextAnchor, designEditorState: designState });
    dependencies.refreshViewport();
    dependencies.setEditorState({
      target: { mode: `design`, groupId: designState.id },
      anchor: {
        type: `element`,
        additionalSelections: [],
        cardViewportRect: nextAnchor.cardViewportRect,
        element,
        themeVariant: nextAnchor.themeVariant,
        value: nextAnchor.anchor,
        viewportSize: nextAnchor.viewportSize,
      },
    });
    dependencies.setCard(card);
    dependencies.closePopover();
    return true;
  };

  const dispose = () => { disposed = true; };
  return { open, dispose };
}

export { createAnnotationDesignEditorOpenController };
if (typeof module !== `undefined`) module.exports = { createAnnotationDesignEditorOpenController };
