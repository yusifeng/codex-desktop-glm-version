type AnnotationControl = { callback: string; [key: string]: unknown };
type AnnotationControlChange = { callback: string; value: unknown; previousValue?: unknown };
type AnnotationDesignChange = {
  id: string;
  anchor: {
    pageUrl: string;
    framePath: string;
    frameUrl?: string;
    kind: string;
    surfaceId?: string;
    targetId?: string;
  };
  annotationControls?: { controls: AnnotationControl[] };
  annotationControlChanges?: AnnotationControlChange[];
};
type AnnotationDesignSyncState = {
  canUseSiteAnnotationApi?: boolean;
  canUseTweaks?: boolean;
  isAgentControllingBrowser?: boolean;
  comments: Array<{ designChange?: AnnotationDesignChange }>;
  activeDesignChange?: AnnotationDesignChange;
  isOriginalViewEnabled?: boolean;
  interactionMode?: string;
};
type ControlChangeDetail = {
  callback: string;
  value: unknown;
  action: `reset` | `preview` | `preview-original`;
  virtualTarget?: { surfaceId?: string; targetId?: string };
};
type AnnotationDesignControlSyncDependencies = {
  currentPageUrl: () => string;
  isSamePageUrl: (left: string, right: string) => boolean;
  resolveFrameDocument: (framePath: string) => unknown;
  currentDocument: unknown;
  getDocumentUrl: (documentRef: unknown) => string;
  isConnected: (target: object) => boolean;
  getDefaultValue: (control: AnnotationControl) => unknown;
  dispatchChange: (target: object, detail: ControlChangeDetail) => void;
};

/** Applies design-control previews to live annotation targets and restores stale previews. */
function createAnnotationDesignControlSync(deps: AnnotationDesignControlSyncDependencies) {
  const targetByDesignId = new Map<string, WeakRef<object>>();
  let lastDesignId: string | null = null;
  let appliedByTarget = new Map<object, Map<string, ControlChangeDetail & { resetValue: unknown }>>();

  const dispatch = (target: object, detail: ControlChangeDetail) => {
    if (deps.isConnected(target) || detail.action === `reset`) deps.dispatchChange(target, detail);
  };
  const clear = () => {
    const stale = appliedByTarget;
    appliedByTarget = new Map();
    targetByDesignId.clear();
    lastDesignId = null;
    for (const [target, changes] of stale) {
      for (const change of changes.values()) {
        dispatch(target, {
          callback: change.callback,
          value: change.resetValue,
          action: `reset`,
          ...(change.virtualTarget == null ? {} : { virtualTarget: { ...change.virtualTarget } }),
        });
      }
    }
  };
  const rememberTarget = (designId: string, target: object) => {
    if (!targetByDesignId.has(designId)) targetByDesignId.set(designId, new WeakRef(target));
    lastDesignId = designId;
  };
  const sync = (state: AnnotationDesignSyncState) => {
    if (state.canUseSiteAnnotationApi !== true || state.canUseTweaks === false || state.isAgentControllingBrowser) {
      clear();
      return;
    }
    const changes = state.comments.flatMap((comment) =>
      comment.designChange == null || comment.designChange.id === state.activeDesignChange?.id
        ? []
        : [comment.designChange],
    );
    if (state.activeDesignChange != null) changes.push(state.activeDesignChange);
    const showOriginal = state.isOriginalViewEnabled === true || state.interactionMode !== `comment`;
    const next = new Map<object, Map<string, ControlChangeDetail & { resetValue: unknown }>>();
    const validIds = new Set(changes.map((change) => change.id));
    for (const id of targetByDesignId.keys()) if (id !== lastDesignId && !validIds.has(id)) targetByDesignId.delete(id);
    for (const designChange of changes) {
      const target = targetByDesignId.get(designChange.id)?.deref();
      const anchor = designChange.anchor;
      const targetDocument = target == null ? null : deps.resolveFrameDocument(anchor.framePath);
      if (
        target == null ||
        !deps.isConnected(target) ||
        !deps.isSamePageUrl(anchor.pageUrl, deps.currentPageUrl()) ||
        targetDocument !== deps.currentDocument ||
        (anchor.frameUrl != null && !deps.isSamePageUrl(anchor.frameUrl, deps.getDocumentUrl(targetDocument)))
      ) continue;
      const virtualTarget = anchor.kind === `virtual` ? { surfaceId: anchor.surfaceId, targetId: anchor.targetId } : undefined;
      for (const change of designChange.annotationControlChanges ?? []) {
        const control = designChange.annotationControls?.controls.find((candidate) => candidate.callback === change.callback);
        if (control == null) continue;
        const fallback = change.previousValue ?? deps.getDefaultValue(control);
        if (change.value === fallback) continue;
        const byCallback = next.get(target) ?? new Map();
        const key = virtualTarget == null ? change.callback : JSON.stringify([virtualTarget.surfaceId, virtualTarget.targetId, change.callback]);
        const resetValue = appliedByTarget.get(target)?.get(key)?.resetValue ?? byCallback.get(key)?.resetValue ?? fallback;
        byCallback.set(key, {
          callback: change.callback,
          resetValue,
          value: showOriginal ? resetValue : change.value,
          action: showOriginal ? `preview-original` : `preview`,
          ...(virtualTarget == null ? {} : { virtualTarget }),
        });
        next.set(target, byCallback);
      }
    }
    const previous = appliedByTarget;
    appliedByTarget = next;
    for (const [target, byCallback] of previous) {
      for (const [key, change] of byCallback) {
        if (!next.get(target)?.has(key))
          dispatch(target, { callback: change.callback, value: change.resetValue, action: `reset`, ...(change.virtualTarget == null ? {} : { virtualTarget: { ...change.virtualTarget } }) });
      }
    }
    for (const [target, byCallback] of next) {
      for (const [key, change] of byCallback) {
        const previousChange = previous.get(target)?.get(key);
        if (previousChange?.value !== change.value || previousChange.action !== change.action)
          dispatch(target, {
            callback: change.callback,
            value: change.value,
            action: change.action,
            ...(change.virtualTarget == null ? {} : { virtualTarget: { ...change.virtualTarget } }),
          });
      }
    }
  };
  return { rememberTarget, sync, clear };
}

export { createAnnotationDesignControlSync };
if (typeof module !== `undefined`) module.exports = { createAnnotationDesignControlSync };
