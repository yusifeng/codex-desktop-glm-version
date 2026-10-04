export type AnnotationDesignEditorDependencies = {
  readElementSnapshot: (element: any) => { styles?: any[]; rect?: any } | null;
  readElementText: (element: any) => { previousValue: string; value: string } | null;
  mergeStyles: (styles: any[], declarations: any[]) => any[];
  projectProvenance: (styles: any[]) => any[];
  readControlValue: (control: any) => unknown;
  readTargetLabel: (element: any) => string;
  resolveVirtualLabel?: (target: any) => string;
  resolveElementAnchor: (target: any, state: any) => any;
  randomId?: () => string;
};

/** Builds the serializable design-editor state used by the annotation React surface. */
function createAnnotationDesignEditorState(
  element: any,
  anchorState: any,
  controls: any,
  previousState: any,
  deps: AnnotationDesignEditorDependencies,
): any {
  const isVirtual = anchorState.anchor.kind === `virtual`;
  const snapshot = isVirtual ? null : (previousState?.snapshot ?? deps.readElementSnapshot(element));
  const id = previousState?.id ?? deps.randomId?.() ?? `design-${Date.now()}`;
  const annotationControls = previousState?.annotationControls ?? controls;
  const declarations = deps.mergeStyles(snapshot?.styles ?? [], previousState?.declarations ?? []);
  const annotationControlChanges = previousState == null
    ? (annotationControls?.controls ?? []).map((control: any) => ({
        callback: control.callback,
        previousValue: control.currentValue,
        value: deps.readControlValue(control),
      }))
    : previousState.annotationControlChanges;
  const text = isVirtual
    ? null
    : previousState?.text == null
      ? deps.readElementText(element)
      : previousState.text;
  return {
    id,
    anchor: anchorState.anchor,
    annotationControls,
    annotationControlChanges,
    declarations,
    draftAttribute: previousState?.draftAttribute ?? id,
    markerViewportPoint: anchorState.viewportPoint,
    provenance: deps.projectProvenance(snapshot?.styles ?? []),
    selector: anchorState.anchor.selector,
    targetLabel: isVirtual
      ? (anchorState.anchor.elementName ?? anchorState.anchor.targetId ?? deps.resolveVirtualLabel?.(anchorState.anchor))
      : deps.readTargetLabel(element),
    elementTagName: element?.tagName?.toLowerCase?.() ?? undefined,
    text,
    ...(previousState?.themeVariant == null
      ? anchorState.themeVariant == null ? {} : { themeVariant: anchorState.themeVariant }
      : { themeVariant: previousState.themeVariant }),
    viewportSize: anchorState.viewportSize,
  };
}

export { createAnnotationDesignEditorState };
if (typeof module !== `undefined`) module.exports = { createAnnotationDesignEditorState };
