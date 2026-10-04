/**
 * Projects the DOM metadata snapshot into the stable rows rendered by the
 * annotation hover tooltip.  Localization and positioning stay in the React
 * surface; this boundary owns only the serializable metadata contract.
 */
export type AnnotationMetadataTooltipSnapshot = {
  tagName?: unknown;
  size?: unknown;
  color?: unknown;
  font?: unknown;
};

export type AnnotationMetadataTooltipRow = {
  kind: "tag" | "size" | "color" | "font";
  value: unknown;
};

export function projectAnnotationMetadataTooltipRows(
  snapshot: AnnotationMetadataTooltipSnapshot | null | undefined,
): AnnotationMetadataTooltipRow[] {
  if (snapshot == null) return [];
  return [
    { kind: "tag", value: snapshot.tagName },
    { kind: "size", value: snapshot.size },
    { kind: "color", value: snapshot.color },
    { kind: "font", value: snapshot.font },
  ];
}

export function hasAnnotationMetadataTooltipSnapshot(
  snapshot: AnnotationMetadataTooltipSnapshot | null | undefined,
): snapshot is AnnotationMetadataTooltipSnapshot {
  return snapshot != null;
}

if (typeof module !== `undefined`) module.exports = {
  hasAnnotationMetadataTooltipSnapshot,
  projectAnnotationMetadataTooltipRows,
};
