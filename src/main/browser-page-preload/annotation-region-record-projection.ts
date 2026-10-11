type AnnotationRegionRecordProjectionDependencies = {
  shouldSuppress: (annotation: any, editor: any, activeAnnotation: any) => boolean;
};

/** Project visible region-anchor records for the annotation overlay layer. */
function projectAnnotationRegionRecords(
  {
    enabled,
    annotations,
    editor,
    activeAnnotation,
  }: {
    enabled: boolean;
    annotations: any[];
    editor: any;
    activeAnnotation: any;
  },
  dependencies: AnnotationRegionRecordProjectionDependencies,
) {
  if (!enabled) return [];
  return annotations.flatMap((annotation) => {
    if (dependencies.shouldSuppress(annotation, editor, activeAnnotation)) return [];
    return [annotation.anchor, ...(annotation.additionalAnchors ?? [])].flatMap((anchor: any, index: number) =>
      anchor.kind === `region`
        ? [{
            anchor,
            key: `${annotation.id}:region:${anchor.framePath.join(`>`)}:${anchor.rect.x}:${anchor.rect.y}:${index}`,
          }]
        : [],
    );
  });
}

export { projectAnnotationRegionRecords };
if (typeof module !== `undefined`) module.exports = { projectAnnotationRegionRecords };
