type AnnotationWyHostMessageHandlers = {
  syncContext: (message: any) => void;
  syncPointerMode: (message: any) => void;
  syncHover: (message: any) => void;
  cancelUnavailableSiteInteraction: () => void;
  clearModifierOnModeChange: () => void;
  clearPreparedScreenshot: () => void;
  disposeCommentInteraction: () => void;
  clearSelectionModifier: () => void;
  applySyncState: (message: any, scheduleRefresh: () => void) => void;
  refreshViewport: () => void;
  syncDesignModifier: (message: any) => void;
  clearDesignScrub: () => void;
  reconcilePreparedScreenshot: (message: any) => void;
  prepareScreenshot: (commentId: string) => void;
  captureTextSelection: () => void;
  selectComment: (commentId: string) => void;
  closeEditor: (message: any) => void;
  setDesignScrub: (property: string | null) => void;
  clearSelectionHover: () => void;
  createCommentAtPoint: (point: any) => boolean;
  retryCreateCommentAtPoint: (point: any) => void;
  createCommentFromSelection: (message: any) => void;
  openDesignEditorAtPoint: (point: any) => boolean;
  retryOpenDesignEditorAtPoint: (point: any) => void;
  setSelectionModifier: (pressed: boolean) => void;
  setSelectionHover: (selectionIndex: number | null) => void;
  removeAnnotationSelection: (selectionIndex: number) => void;
  restoreEditor: (message: any) => void;
};

/** Dispatches Wy host messages while keeping all state/ref/IPC effects injected. */
function dispatchAnnotationWyHostMessage(
  message: any,
  capabilities: { canUseTweaks: boolean; canUseMultiSelect: boolean },
  handlers: AnnotationWyHostMessageHandlers,
  scheduleRefresh: () => void,
): boolean {
  switch (message.type) {
    case `browser-sidebar-runtime-sync`:
      handlers.syncContext(message);
      handlers.syncPointerMode(message);
      handlers.syncHover(message);
      if (message.canUseSiteAnnotationApi !== true) handlers.cancelUnavailableSiteInteraction();
      if (message.interactionMode !== `comment`) handlers.clearModifierOnModeChange();
      if (message.isAnnotationSuspended === true || message.areAnnotationMarkersVisible === false) {
        handlers.clearPreparedScreenshot();
      }
      if (message.interactionMode !== `comment` || message.isAnnotationSuspended === true) {
        handlers.disposeCommentInteraction();
      }
      if (message.canUseAnnotationMultiSelect !== true) handlers.clearSelectionModifier();
      handlers.applySyncState(message, scheduleRefresh);
      handlers.refreshViewport();
      handlers.syncDesignModifier(message);
      if (
        message.interactionMode !== `comment` ||
        message.canUseTweaks === false ||
        message.isTweaksEditorOpen !== true
      ) {
        handlers.clearDesignScrub();
      }
      handlers.reconcilePreparedScreenshot(message);
      return true;
    case `browser-sidebar-runtime-prepare-comment-screenshot`:
      handlers.prepareScreenshot(message.commentId);
      return true;
    case `browser-sidebar-runtime-clear-comment-screenshot`:
      handlers.clearPreparedScreenshot();
      return true;
    case `browser-sidebar-runtime-capture-text-selection`:
      handlers.captureTextSelection();
      return true;
    case `browser-sidebar-runtime-select-comment`:
      handlers.selectComment(message.commentId);
      return true;
    case `browser-sidebar-runtime-close-editor`:
      handlers.closeEditor(message);
      return true;
    case `browser-sidebar-runtime-design-scrub-changed`:
      handlers.setDesignScrub(message.property);
      return true;
    case `browser-sidebar-runtime-create-comment-at-point`:
      handlers.clearSelectionHover();
      if (!handlers.createCommentAtPoint(message.viewportPoint)) {
        handlers.retryCreateCommentAtPoint(message.viewportPoint);
      }
      return true;
    case `browser-sidebar-runtime-create-comment-from-selection`:
      handlers.clearSelectionHover();
      handlers.createCommentFromSelection(message);
      return true;
    case `browser-sidebar-runtime-open-design-editor-at-point`:
      handlers.clearSelectionHover();
      if (!capabilities.canUseTweaks) return true;
      if (!handlers.openDesignEditorAtPoint(message.viewportPoint)) {
        handlers.retryOpenDesignEditorAtPoint(message.viewportPoint);
      }
      return true;
    case `browser-sidebar-runtime-annotation-selection-modifier-state`:
      handlers.setSelectionModifier(message.pressed);
      return true;
    case `browser-sidebar-runtime-annotation-selection-hover-state`:
      handlers.setSelectionHover(capabilities.canUseMultiSelect ? message.selectionIndex : null);
      return true;
    case `browser-sidebar-runtime-remove-annotation-selection`:
      if (!capabilities.canUseMultiSelect) return true;
      handlers.removeAnnotationSelection(message.selectionIndex);
      return true;
    case `browser-sidebar-runtime-restore-editor`:
      handlers.restoreEditor(message);
      return true;
    default:
      return false;
  }
}

export { dispatchAnnotationWyHostMessage };
if (typeof module !== `undefined`) module.exports = { dispatchAnnotationWyHostMessage };
