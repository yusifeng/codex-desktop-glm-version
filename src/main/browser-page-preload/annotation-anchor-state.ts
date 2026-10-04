/**
 * State/payload transformations shared by the annotation editor and marker
 * renderers.  DOM lookup and viewport/theme reads stay injected so this
 * module remains deterministic and safe to exercise outside a browser.
 */

type AnnotationAnchor = {
  kind: string;
  [key: string]: unknown;
};

type AnnotationAnchorSelection = {
  anchor: AnnotationAnchor;
  liveElement: unknown;
};

type AnnotationAnchorState = {
  type: string;
  additionalSelections: AnnotationAnchorSelection[];
  themeVariant?: unknown;
  viewportSize?: unknown;
  value: AnnotationAnchor;
  element?: unknown;
  markerViewportPoint?: unknown;
  cardViewportRect?: unknown;
};

type AnchorStateDependencies = {
  resolveThemeVariant: () => unknown;
  readViewportSize: () => unknown;
  resolveLiveElement: (anchor: AnnotationAnchor, id?: number | string) => unknown;
  resolveDocumentForFrame?: (framePath: unknown) => unknown;
};

function createAnnotationAnchorSelection(
  anchor: AnnotationAnchor,
  dependencies: Pick<AnchorStateDependencies, `resolveLiveElement`>,
  id?: number | string,
): AnnotationAnchorSelection {
  return anchor.kind === `element`
    ? { anchor, liveElement: dependencies.resolveLiveElement(anchor, id) }
    : { anchor, liveElement: null };
}

function createAnnotationAnchorState(
  value: {
    anchor: AnnotationAnchor;
    additionalAnchors?: AnnotationAnchor[];
    themeVariant?: unknown;
    viewportSize?: unknown;
    markerViewportPoint?: unknown;
  },
  element: unknown,
  dependencies: AnchorStateDependencies,
): AnnotationAnchorState {
  const themeVariant = value.themeVariant ?? dependencies.resolveThemeVariant();
  if (value.anchor.kind === `virtual`) {
    return { type: `virtual`, additionalSelections: [], themeVariant, value: value.anchor, viewportSize: value.viewportSize };
  }
  if (value.anchor.kind === `text`) {
    return { type: `text`, additionalSelections: [], themeVariant, value: value.anchor };
  }
  const additionalSelections = (value.additionalAnchors ?? []).map((anchor) =>
    createAnnotationAnchorSelection(anchor, dependencies),
  );
  if (value.anchor.kind === `region`) {
    return {
      type: `region`,
      additionalSelections,
      themeVariant,
      value: value.anchor,
      viewportSize: dependencies.readViewportSize(),
    };
  }
  return {
    type: `element`,
    additionalSelections,
    element,
    markerViewportPoint: value.markerViewportPoint,
    themeVariant,
    value: value.anchor,
    viewportSize: dependencies.readViewportSize(),
  };
}

function buildAnnotationAnchorPayload(
  value: { target: unknown; anchorState: { anchor: AnnotationAnchor; additionalAnchors?: AnnotationAnchor[]; themeVariant?: unknown; viewportSize?: unknown; cardViewportRect?: unknown; viewportPoint?: unknown } },
  dependencies: Pick<AnchorStateDependencies, `resolveLiveElement`>,
) {
  const anchor = value.anchorState.anchor;
  if (anchor.kind === `virtual`) {
    return { target: value.target, anchor: { type: `virtual`, additionalSelections: [], themeVariant: value.anchorState.themeVariant, value: anchor, viewportSize: value.anchorState.viewportSize } };
  }
  if (anchor.kind === `text`) {
    return { target: value.target, anchor: { type: `text`, ...(value.anchorState.themeVariant == null ? {} : { themeVariant: value.anchorState.themeVariant }), value: anchor } };
  }
  const additionalSelections = (value.anchorState.additionalAnchors ?? []).map((item) =>
    createAnnotationAnchorSelection(item, dependencies),
  );
  if (anchor.kind === `region`) {
    return { target: value.target, anchor: { type: `region`, additionalSelections, themeVariant: value.anchorState.themeVariant, value: anchor, viewportSize: value.anchorState.viewportSize } };
  }
  return {
    target: value.target,
    anchor: {
      type: `element`,
      additionalSelections,
      cardViewportRect: value.anchorState.cardViewportRect,
      element: dependencies.resolveLiveElement(anchor),
      markerViewportPoint: value.anchorState.viewportPoint,
      themeVariant: value.anchorState.themeVariant,
      viewportSize: value.anchorState.viewportSize,
      value: anchor,
    },
  };
}

function resolveAnnotationAnchorValue(
  state: AnnotationAnchorState,
  dependencies: { refreshElement: (element: unknown, anchor: AnnotationAnchor, viewportSize?: unknown) => AnnotationAnchor },
) {
  return state.type === `element` ? dependencies.refreshElement(state.element, state.value, state.viewportSize) : state.value;
}

function resolveAnnotationLiveElement(
  state: AnnotationAnchorState,
  dependencies: { isConnected: (element: unknown) => boolean; ownerDocumentMatches: (element: unknown, framePath: unknown) => boolean; resolveElement: (anchor: AnnotationAnchor) => unknown },
) {
  if (state.type !== `element`) return null;
  return state.element != null && dependencies.isConnected(state.element) && dependencies.ownerDocumentMatches(state.element, state.value.framePath)
    ? state.element
    : dependencies.resolveElement(state.value);
}

function splitAnnotationAnchorState(state: AnnotationAnchorState) {
  return {
    additional: state.additionalSelections,
    primary: state.type === `element`
      ? { anchor: state.value, liveElement: state.element }
      : { anchor: state.value, liveElement: null },
  };
}

function mergeAnnotationAnchorState(
  previous: AnnotationAnchorState,
  selection: { additional: AnnotationAnchorSelection[]; primary: AnnotationAnchorSelection },
  overrides?: { themeVariant?: unknown; viewportSize?: unknown },
): AnnotationAnchorState {
  const themeVariant = overrides?.themeVariant ?? previous.themeVariant;
  const viewportSize = overrides?.viewportSize ?? previous.viewportSize;
  const anchor = selection.primary.anchor;
  if (anchor.kind === `virtual`) return { type: `virtual`, additionalSelections: [], themeVariant, value: anchor, viewportSize };
  if (anchor.kind === `region`) return { type: `region`, additionalSelections: selection.additional, themeVariant, value: anchor, viewportSize };
  return {
    type: `element`,
    additionalSelections: selection.additional,
    ...(previous.type === `element` && previous.cardViewportRect != null ? { cardViewportRect: previous.cardViewportRect } : {}),
    element: selection.primary.liveElement,
    markerViewportPoint: previous.type === `element` ? previous.markerViewportPoint : undefined,
    themeVariant,
    value: anchor,
    viewportSize,
  };
}

function resolveAnnotationSelection(
  selection: AnnotationAnchorSelection,
  dependencies: { refreshElement: (element: unknown, anchor: AnnotationAnchor, viewportSize?: unknown) => AnnotationAnchor },
  viewportSize?: unknown,
) {
  return selection.anchor.kind === `element` ? dependencies.refreshElement(selection.liveElement, selection.anchor, viewportSize) : selection.anchor;
}

function replaceAnnotationSelection(value: { anchor: AnnotationAnchor; additionalAnchors?: AnnotationAnchor[]; markerViewportPoint?: unknown }, replacement: AnnotationAnchor, index: number) {
  const anchors = [value.anchor, ...(value.additionalAnchors ?? [])].filter((_, position) => position !== index);
  return {
    ...value,
    anchor: replacement,
    additionalAnchors: anchors.length === 0 ? undefined : anchors,
    markerViewportPoint: index === 0 ? undefined : value.markerViewportPoint,
  };
}

export {
  buildAnnotationAnchorPayload,
  createAnnotationAnchorSelection,
  createAnnotationAnchorState,
  mergeAnnotationAnchorState,
  replaceAnnotationSelection,
  resolveAnnotationAnchorValue,
  resolveAnnotationLiveElement,
  resolveAnnotationSelection,
  splitAnnotationAnchorState,
};
if (typeof module !== `undefined`) module.exports = {
  buildAnnotationAnchorPayload,
  createAnnotationAnchorSelection,
  createAnnotationAnchorState,
  mergeAnnotationAnchorState,
  replaceAnnotationSelection,
  resolveAnnotationAnchorValue,
  resolveAnnotationLiveElement,
  resolveAnnotationSelection,
  splitAnnotationAnchorState,
};
