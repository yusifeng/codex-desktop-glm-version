type AnnotationDesignSnapshot = {
  id: unknown;
  anchor: unknown;
  annotationControls: unknown;
  annotationControlChanges: unknown;
  declarations: unknown;
  draftAttribute: unknown;
  markerViewportPoint: unknown;
  provenance: unknown;
  selector: unknown;
  targetLabel: unknown;
  elementTagName: unknown;
  text: unknown;
  themeVariant?: unknown;
  viewportSize: unknown;
};

/** Projects a live design annotation into the serializable editor snapshot shape. */
function snapshotAnnotationDesign(value: AnnotationDesignSnapshot): AnnotationDesignSnapshot {
  return {
    id: value.id,
    anchor: value.anchor,
    annotationControls: value.annotationControls,
    annotationControlChanges: value.annotationControlChanges,
    declarations: value.declarations,
    draftAttribute: value.draftAttribute,
    markerViewportPoint: value.markerViewportPoint,
    provenance: value.provenance,
    selector: value.selector,
    targetLabel: value.targetLabel,
    elementTagName: value.elementTagName,
    text: value.text,
    themeVariant: value.themeVariant,
    viewportSize: value.viewportSize,
  };
}

export { snapshotAnnotationDesign };
if (typeof module !== `undefined`) module.exports = { snapshotAnnotationDesign };
